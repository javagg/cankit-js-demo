import { TextDirection } from "../Core";
import { TextFragment } from "./fragmenter";
import { LineBreakType } from "./line_breaker";
import { EngineTextStyle, ParagraphJS, ParagraphSpan, PlaceholderSpan } from "./ParagraphBuilder"
import { FragmentFlow } from "./text_direction";

abstract class _CombinedFragment extends TextFragment {

    type: LineBreakType;
}

export class LayoutFragment extends _CombinedFragment {




    fragmentFlow: FragmentFlow;

    span: ParagraphSpan;

    trailingNewlines: number;

    trailingSpaces : number;

    get style(): EngineTextStyle {
        return  this.span.style;
    }

    get length(): number {
        return this.end - this.start;
    }

    get isSpaceOnly(): boolean {
        return this.length === this.trailingSpaces;
    }

    get isPlaceholder(): boolean {
        return this.span instanceof PlaceholderSpan;
    }

    get isBreak(): boolean {
       return this.type != LineBreakType.prohibited;
    } 

    get isHardBreak(): boolean { 
        return this.type == LineBreakType.mandatory || this.type == LineBreakType.endOfText;
    }

    /// Returns the substring from [paragraph] that corresponds to this fragment,
    /// excluding new line characters.
    getText( paragraph: ParagraphJS): string {
        return paragraph.plainText.substring(this.start, this.end - this.trailingNewlines);
    }

    /// Splits this fragment into two fragments with the split point being the
    /// given [index].
    // TODO(mdebbar): If we ever get multiple return values in Dart, we should use it!
    //                See: https://github.com/dart-lang/language/issues/68
    split(index: number): LayoutFragment[] {
        throw new Error("need implement")
    }

    toString(): string {
        return '$LayoutFragment($start, $end, $type, $textDirection)';
    }
}

export class EllipsisFragment extends LayoutFragment {
    constructor(
        index: number,
        span: ParagraphSpan
    ) {
        super(
            index,
            index,
            LineBreakType.endOfText,
            TextDirection.LTR, // null
            // The ellipsis is always at the end of the line, so it can't be
            // sandwiched. This means it'll always follow the paragraph direction.
            FragmentFlow.sandwich,
            span, 0, 0,
        );
    }

    get isSpaceOnly(): boolean {
        return false;
    }

    get isPlaceholder(): boolean {
        return false;
    }

    getText(paragraph: ParagraphJS): string {
        if (!paragraph.paragraphStyle.ellipsis) {
            throw new Error('Paragraph style ellipsis is not defined');
        }
        return paragraph.paragraphStyle.ellipsis;
    }

    split(index: number): LayoutFragment[] {
        throw new Error('Cannot split an EllipsisFragment');
    }
}
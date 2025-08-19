import { GlyphInfo, RectWithDirection, TextDirection, PositionWithAffinity, TextStyle } from "canvaskit-wasm";
import { TextDirection as TextDirectionEnums, Affinity as AffinityEnums } from "../Core";
import { TextFragment, TextFragmenter } from "./fragmenter";
import { LineBreakFragment, LineBreakFragmenter, LineBreakType } from "./line_breaker";
import { ParagraphJS, ParagraphSpan, PlaceholderSpan, Spanometer, ParagraphLine } from "./ParagraphBuilder"
import { BidiFragment, BidiFragmenter, FragmentFlow } from "./text_direction";

abstract class _CombinedFragment extends TextFragment {

    type: LineBreakType;

    span: ParagraphSpan;

    trailingNewlines: number;

    trailingSpaces: number;

    get textDirection() { return this._textDirection; }
    _textDirection: TextDirection;

    // start mixin _FragmentMetrics 
    protected _spanometer!: Spanometer;
    protected _ascent!: number;
    protected _descent!: number;
    protected _widthExcludingTrailingSpaces!: number;
    protected _widthIncludingTrailingSpaces!: number;
    protected _extraWidthForJustification: number = 0.0;

    /** The rise from the baseline as calculated from the font and style for this text. */
    get ascent(): number {
        return this._ascent;
    }

    /** The drop from the baseline as calculated from the font and style for this text. */
    get descent(): number {
        return this._descent;
    }

    /** The width of the measured text, not including trailing spaces. */
    get widthExcludingTrailingSpaces(): number {
        return this._widthExcludingTrailingSpaces;
    }

    /** The width of the measured text, including any trailing spaces. */
    get widthIncludingTrailingSpaces(): number {
        return this._widthIncludingTrailingSpaces + this._extraWidthForJustification;
    }

    /** The total height as calculated from the font and style for this text. */
    get height(): number {
        return this.ascent + this.descent;
    }

    get widthOfTrailingSpaces(): number {
        return this.widthIncludingTrailingSpaces - this.widthExcludingTrailingSpaces;
    }

    /// Set measurement values for the fragment.
    setMetrics(spanometer: Spanometer,
        ascent: number,
        descent: number,
        widthExcludingTrailingSpaces: number,
        widthIncludingTrailingSpaces: number,
    ): void {
        this._spanometer = spanometer;
        this._ascent = ascent;
        this._descent = descent;
        this._widthExcludingTrailingSpaces = widthExcludingTrailingSpaces;
        this._widthIncludingTrailingSpaces = widthIncludingTrailingSpaces;
    }

    // end mixin _FragmentMetrics

    // start mixin _FragmentPosition
    /// Encapsulates positioning of the fragment relative to the line.
    ///
    /// The coordinates are all relative to the line it belongs to. For example,
    /// [left] is the distance from the left edge of the line to the left edge of
    /// the fragment.
    ///
    /// This is what the various measurements/coordinates look like for a fragment
    /// in an LTR paragraph:
    ///
    ///          *------------------------line.width-----------------*
    ///                            *---width----*
    ///          ┌─────────────────┬────────────┬────────────────────┐
    ///          │                 │--FRAGMENT--│                    │
    ///          └─────────────────┴────────────┴────────────────────┘
    ///          *---startOffset---*
    ///          *------left-------*
    ///          *--------endOffset-------------*
    ///          *----------right---------------*
    ///
    ///
    /// And in an RTL paragraph, [startOffset] and [endOffset] are flipped because
    /// the line starts from the right. Here's what they look like:
    ///
    ///          *------------------------line.width-----------------*
    ///                            *---width----*
    ///          ┌─────────────────┬────────────┬────────────────────┐
    ///          │                 │--FRAGMENT--│                    │
    ///          └─────────────────┴────────────┴────────────────────┘
    ///                                         *----startOffset-----*
    ///          *------left-------*
    ///                            *-----------endOffset-------------*
    ///          *----------right---------------*
    ///  

    /// The distance from the beginning of the line to the beginning of the fragment.
    get startOffset(): number {
        return this._startOffset;
    }
    private _startOffset!: number;

    /// The width of the line that contains this fragment.
    line: ParagraphLine;

    /// The distance from the beginning of the line to the end of the fragment.
    get endOffset(): number {
        return this.startOffset + this.widthIncludingTrailingSpaces;
    }

    /// The distance from the left edge of the line to the left edge of the fragment.
    get left(): number {
        return this.line.textDirection === TextDirectionEnums.LTR
            ? this.startOffset
            : this.line.width - this.endOffset;
    }

    /// The distance from the left edge of the line to the right edge of the fragment.
    get right(): number {
        return this.line.textDirection === TextDirectionEnums.LTR
            ? this.endOffset
            : this.line.width - this.startOffset;
    }

    /// Set the horizontal position of this fragment relative to the [line] that
    /// contains it.
    setPosition(startOffset: number, textDirection: TextDirection): void {
        this._startOffset = startOffset;
        this._textDirection ??= textDirection;
    }

    /// Adjust the width of this fragment for paragraph justification.
    justifyTo(paragraphWidth: number): void {
        // Only justify this fragment if it's not a trailing space in the line.
        if (this.end > this.line.endIndex - this.line.trailingSpaces) {
            // Don't justify fragments that are part of trailing spaces of the line.
            return;
        }
        if (this.trailingSpaces === 0) {
            // If this fragment has no spaces, there's nothing to justify.
            return;
        }
        const justificationTotal = paragraphWidth - this.line.width;
        const justificationPerSpace = justificationTotal / this.line.nonTrailingSpaces;
        this._extraWidthForJustification = justificationPerSpace * this.trailingSpaces;
    }

    // end mixin _FragmentPosition


    // start mixin _FragmentBox
    /// Encapsulates calculations related to the bounding box of the fragment
    /// relative to the paragraph.   
    get top(): number {
        return this.line.baseline - this.ascent;
    }

    get bottom(): number {
        return this.line.baseline + this.descent;
    }

    private __textBoxIncludingTrailingSpaces?: RectWithDirection
    get _textBoxIncludingTrailingSpaces(): RectWithDirection {
        return this.__textBoxIncludingTrailingSpaces ??= {
            rect: Float32Array.of(
                this.line.left + this.left,
                this.top,
                this.line.left + this.right,
                this.bottom
            ),
            dir: this.textDirection!
        }
    }

    /// Whether or not the trailing spaces of this fragment are part of trailing
    /// spaces of the line containing the fragment.
    get _isPartOfTrailingSpacesInLine(): boolean {
        return this.end > this.line.endIndex - this.line.trailingSpaces;
    }

    /// Returns a [ui.TextBox] for the purpose of painting this fragment.
    ///
    /// The coordinates of the resulting [ui.TextBox] are relative to the
    /// paragraph, not to the line.
    ///
    /// Trailing spaces in each line aren't painted on the screen, so they are
    /// excluded from the resulting text box.
    toPaintingTextBox(): RectWithDirection /*TextBox*/ {
        if (this._isPartOfTrailingSpacesInLine) {
            // For painting, we exclude the width of trailing spaces from the box.
            return this.textDirection === TextDirectionEnums.LTR
                ? {
                    rect: Float32Array.of(
                        this.line.left + this.left,
                        this.top,
                        this.line.left + this.right - this.widthOfTrailingSpaces,
                        this.bottom,
                    ),
                    dir: this.textDirection!
                }
                : {
                    rect: Float32Array.of(
                        this.line.left + this.left + this.widthOfTrailingSpaces,
                        this.top,
                        this.line.left + this.right,
                        this.bottom,
                    ),
                    dir: this.textDirection!
                };
        }
        return this._textBoxIncludingTrailingSpaces;
    }

    /// Returns a [ui.TextBox] representing this fragment.
    ///
    /// The coordinates of the resulting [ui.TextBox] are relative to the
    /// paragraph, not to the line.
    ///
    /// As opposed to [toPaintingTextBox], the resulting text box from this method
    /// includes trailing spaces of the fragment.
    toTextBox(start?: number, end?: number): RectWithDirection /*TextBox*/ {
        const start1 = start ?? this.start;
        const end1 = end ?? this.end;

        if (start1 <= this.start && end1 >= this.end - this.trailingNewlines) {
            return this._textBoxIncludingTrailingSpaces;
        }
        return this._intersect(start1, end1);
    }

    /// Performs the intersection of this fragment with the range given by [start] and
    /// [end] indices, and returns a [ui.TextBox] representing that intersection.
    ///
    /// The coordinates of the resulting [ui.TextBox] are relative to the
    /// paragraph, not to the line.
    private _intersect(start: number, end: number): RectWithDirection /*TextBox*/ {
        console.assert(start > this.start || end < this.end, '_intersect should only be called when there\'s an actual intersection');

        let before = 0;
        if (start > this.start) {
            this._spanometer.currentSpan = this.span;
            before = this._spanometer.measureRange(this.start, start);
        }

        let after = 0;
        if (end < this.end - this.trailingNewlines) {
            this._spanometer.currentSpan = this.span;
            after = this._spanometer.measureRange(end, this.end - this.trailingNewlines);
        }

        let left: number, right: number;
        if (this.textDirection === TextDirectionEnums.LTR) {
            // Example: let's say the text is "Loremipsum" and we want to get the box
            // for "rem". In this case, `before` is the width of "Lo", and `after`
            // is the width of "ipsum".
            //
            // Here's how the measurements/coordinates look like:
            //
            //              before         after
            //              |----|     |----------|
            //              +---------------------+
            //              | L o r e m i p s u m |
            //              +---------------------+
            //    this.left ^                     ^ this.right
            left = this.left + before;
            right = this.right - after;
        } else {
            // Example: let's say the text is "txet_werbeH" ("Hebrew_text" flowing from
            // right to left). Say we want to get the box for "brew". The `before` is
            // the width of "He", and `after` is the width of "_text".
            //
            //                 after           before
            //              |----------|       |----|
            //              +-----------------------+
            //              | t x e t _ w e r b e H |
            //              +-----------------------+
            //    this.left ^                       ^ this.right
            //
            // Notice how `before` and `after` are reversed in the RTL example. That's
            // because the text flows from right to left.
            left = this.left + after;
            right = this.right - before;
        }

        // The fragment's left and right edges are relative to the line. In order
        // to make them relative to the paragraph, we need to add the left edge of
        // the line.
        return {
            rect: Float32Array.of(
                this.line.left + left,
                this.top,
                this.line.left + right,
                this.bottom,
            ),
            dir: this.textDirection!
        };
    }

    /// Returns the text position within this fragment's range that's closest to
    /// the given [x] offset.
    ///
    /// The [x] offset is expected to be relative to the left edge of the fragment.
    getPositionForX(x: number): PositionWithAffinity {
        x = this._makeXDirectionAgnostic(x);

        const startIndex = this.start;
        const endIndex = this.end - this.trailingNewlines;

        // Check some special cases to return the result quicker.

        const length = endIndex - startIndex;

        if (length === 0) {
            return { pos: startIndex, affinity: AffinityEnums.Downstream } //new TextPosition(startIndex);
        }
        if (length === 1) {
            // Find out if `x` is closer to `startIndex` or `endIndex`.
            const distanceFromStart = x;
            const distanceFromEnd = this.widthIncludingTrailingSpaces - x;
            return distanceFromStart < distanceFromEnd
                ? { pos: startIndex, affinity: AffinityEnums.Downstream } // new TextPosition(startIndex)
                : { pos: startIndex, affinity: AffinityEnums.Upstream } // new TextPosition(endIndex, TextAffinity.upstream);
        }

        this._spanometer.currentSpan = this.span;
        // The resulting `cutoff` is the index of the character where the `x` offset
        // falls. We should return the text position of either `cutoff` or
        // `cutoff + 1` depending on which one `x` is closer to.
        //
        //   offset x
        //      ↓
        // "A B C D E F"
        //     ↑
        //   cutoff
        const cutoff = this._spanometer.forceBreak(startIndex, endIndex, x, true);

        if (cutoff == endIndex) {
            return { pos: cutoff, affinity: AffinityEnums.Upstream } //  ui.TextPosition(offset: cutoff, affinity: ui.TextAffinity.upstream);
        }

        const lowWidth = this._spanometer.measureRange(startIndex, cutoff);
        const highWidth = this._spanometer.measureRange(startIndex, cutoff + 1);

        // See if `x` is closer to `cutoff` or `cutoff + 1`.
        if (x - lowWidth < highWidth - x) {
            // The offset is closer to cutoff.
            return { pos: cutoff, affinity: AffinityEnums.Downstream } //ui.TextPosition(offset: cutoff);
        } else {
            // The offset is closer to cutoff + 1.
            return { pos: cutoff + 1, affinity: AffinityEnums.Upstream } //ui.TextPosition(offset: cutoff + 1, affinity: ui.TextAffinity.upstream);
        }
    }

    /// Transforms the [x] coordinate to be direction-agnostic.
    ///
    /// The X (input) is relative to the [left] edge of the fragment, and this
    /// method returns an X' (output) that's relative to beginning of the text.
    ///
    /// Here's how it looks for a fragment with LTR content:
    ///
    ///          *------------------------line width------------------*
    ///                      *-----X (input)
    ///          ┌───────────┬────────────────────────┬───────────────┐
    ///          │           │ ---text-direction----> │               │
    ///          └───────────┴────────────────────────┴───────────────┘
    ///                      *-----X' (output)
    ///          *---left----*
    ///          *---------------right----------------*
    ///
    ///
    /// And here's how it looks for a fragment with RTL content:
    ///
    ///          *------------------------line width------------------*
    ///                      *-----X (input)
    ///          ┌───────────┬────────────────────────┬───────────────┐
    ///          │           │ <---text-direction---- │               │
    ///          └───────────┴────────────────────────┴───────────────┘
    ///                   (output) X'-----------------*
    ///          *---left----*
    ///          *---------------right----------------*
    ///
    private _makeXDirectionAgnostic(x: number): number {
        return this.textDirection === TextDirectionEnums.LTR
            ? this.widthIncludingTrailingSpaces - x
            : x;
    }


    // [start, end).map((index) => line.graphemeStarts[index]) gives an ascending
    // list of UTF16 offsets of graphemes that start in this fragment.
    //
    // Returns null if this fragment contains no grapheme starts.
    private _graphemeStartIndexRange:[number, number] | null
    
    get graphemeStartIndexRange(): [number, number] | null {
        if (this._graphemeStartIndexRange === undefined) {
            this._graphemeStartIndexRange = this._getBreaksRange();
        }
        return this._graphemeStartIndexRange
    }

    // readonly graphemeStartIndexRange: [number, number] | null = this._getBreaksRange();

    _getBreaksRange(): [number, number] | null {
        if (this.end === this.start) {
            return null;
        }
        const lineGraphemeBreaks = this.line.graphemeStarts;
        console.assert(this.end > this.start);
        console.assert(lineGraphemeBreaks.length > 0);

        const startIndex = this.line.graphemeStartIndexBefore(this.start, 0, lineGraphemeBreaks.length);
        const endIndex = this.end === this.start + 1
            ? startIndex + 1
            : this.line.graphemeStartIndexBefore(this.end - 1, startIndex, lineGraphemeBreaks.length) + 1;

        const firstGraphemeStart = lineGraphemeBreaks[startIndex];
        return firstGraphemeStart > this.start
            ? (endIndex === startIndex + 1 ? null : [startIndex + 1, endIndex])
            : [startIndex, endIndex];
    }

    /// Whether the first codepoints of this fragment is not a valid grapheme start,
    /// and belongs in the the previous fragment.
    ///
    /// This is the result of a known bug: in rare circumstances, a grapheme is
    /// split into different fragments. To workaround this we ignore the trailing
    /// part of the grapheme during hit-testing, by adjusting the leading offset of
    /// a fragment to the leading edge of the first grapheme start in that fragment.
    //
    // TODO(LongCatIsLooong): Grapheme clusters should not be separately even
    // when they are in different runs. Also document the recommendation to use
    // U+25CC or U+00A0 for showing nonspacing marks in isolation.
    get hasLeadingBrokenGrapheme(): boolean {
        const graphemeStartIndexRangeStart = this.graphemeStartIndexRange?.[0];
        return graphemeStartIndexRangeStart === null ||
            this.line.graphemeStarts[graphemeStartIndexRangeStart] !== this.start;
    }


    /// Returns the GlyphInfo within the range [line.graphemeStarts[startIndex], line.graphemeStarts[endIndex]),
    /// that's visually closeset to the given horizontal offset `x` (in the paragraph's coordinates).
    private _getClosestCharacterInRange(x: number, startIndex: number, endIndex: number): GlyphInfo {
        const graphemeStartIndices = this.line.graphemeStarts;
        const fullRange = {
            start: graphemeStartIndices[startIndex],
            end: graphemeStartIndices[endIndex]
        }
        // new TextRange(graphemeStartIndices[startIndex], graphemeStartIndices[endIndex]);
        const fullBox = this.toTextBox(fullRange.start, fullRange.end);

        if (startIndex + 1 === endIndex) {
            // return new GlyphInfo(fullBox.toRect(), fullRange, fullBox.direction);
            return {
                graphemeLayoutBounds: fullBox.rect,
                graphemeClusterTextRange: fullRange,
                dir: fullBox.dir,
                isEllipsis: false,
            }
        }
        console.assert(startIndex + 1 < endIndex);

        const _left = fullBox.rect[0]
        const _right = fullBox.rect[2]

        if (_left < x && x < _right) {
            const midIndex = Math.floor((startIndex + endIndex) / 2);
            const firstHalf = this._getClosestCharacterInRange(x, startIndex, midIndex);
            const left1 = firstHalf.graphemeLayoutBounds[0]
            const right1 = firstHalf.graphemeLayoutBounds[2]


            if (left1 < x && x < right1) {
                return firstHalf;
            }
            const secondHalf = this._getClosestCharacterInRange(x, midIndex, endIndex);
            const left2 = secondHalf.graphemeLayoutBounds[0]
            const right2 = secondHalf.graphemeLayoutBounds[2]
            if (left2 < x && x < right2) {
                return secondHalf;
            }
            const distanceToFirst = Math.abs(x - Math.max(Math.min(x, right1), left1));
            const distanceToSecond = Math.abs(x - Math.max(Math.min(x, right2), left2));
            return distanceToFirst > distanceToSecond ? firstHalf : secondHalf;
        }

        const range = (fullBox.dir === TextDirectionEnums.LTR && x <= _left) ||
            (fullBox.dir === TextDirectionEnums.LTR && x > _left)
            ? { start: graphemeStartIndices[startIndex], end: graphemeStartIndices[startIndex + 1] }
            : { start: graphemeStartIndices[endIndex - 1], end: graphemeStartIndices[endIndex] };

        console.assert(!(range.start == range.end));

        const box = this.toTextBox(range.start, range.end);
        return { graphemeLayoutBounds: box.rect, graphemeClusterTextRange: range, dir: box.dir, isEllipsis: false };
    }

    /// Returns the GlyphInfo of the character in the fragment that is closest to
    /// the given offset x.
    getClosestCharacterBox(x: number): GlyphInfo {
        console.assert(this.end > this.start);
        console.assert(this.graphemeStartIndexRange !== null);

        // The non-null assertion is safe here because this method is only called by
        // LayoutService.getClosestGlyphInfo which checks this fragment has at least
        // one grapheme start before calling this method.
        const [rangeStart, rangeEnd] = this.graphemeStartIndexRange!;
        return this._getClosestCharacterInRange(x, rangeStart, rangeEnd);
    }
    // end mixin _FragmentBox 
}

export class LayoutFragment extends _CombinedFragment {

    fragmentFlow: FragmentFlow;

    type: LineBreakType;

    _textDirection: TextDirection | null;

    span: ParagraphSpan;

    trailingNewlines: number;

    trailingSpaces: number;

    constructor(
        start,
        end,
        type,
        _textDirection,
        fragmentFlow,
        span,
        trailingNewlines,
        trailingSpaces,
    ) {
        super(start, end)

        console.assert(trailingNewlines >= 0)
        console.assert(trailingSpaces >= trailingNewlines)
        this.type = type
        this._textDirection = _textDirection
        this.fragmentFlow = fragmentFlow
        this.span = span
        this.trailingNewlines = trailingNewlines
        this.trailingSpaces = trailingSpaces
    }

    get textDirection() { return this._textDirection }

    get style(): TextStyle {
        return this.span.style;
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
    getText(paragraph: ParagraphJS): string {
        return paragraph.plainText.substring(this.start, this.end - this.trailingNewlines);
    }

    /// Splits this fragment into two fragments with the split point being the
    /// given [index].
    // TODO(mdebbar): If we ever get multiple return values in Dart, we should use it!
    //                See: https://github.com/dart-lang/language/issues/68
    split(index: number): LayoutFragment[] {
        console.assert(this.start <= index, 'index must be >= start');
        console.assert(index <= this.end, 'index must be <= end');

        if (this.start === index) {
            return [null, this];
        }

        if (this.end === index) {
            return [this, null];
        }

        const secondLength = this.end - index;

        const secondTrailingNewlines = Math.min(this.trailingNewlines, secondLength);
        const secondTrailingSpaces = Math.min(this.trailingSpaces, secondLength);

        const firstTrailingNewlines = this.trailingNewlines - secondTrailingNewlines;
        const firstTrailingSpaces = this.trailingSpaces - secondTrailingSpaces;

        return [new LayoutFragment(
            this.start,
            index,
            LineBreakType.prohibited,
            this.textDirection,
            this.fragmentFlow,
            this.span,
            firstTrailingNewlines,
            firstTrailingSpaces
        ), new LayoutFragment(
            index,
            this.end,
            this.type,
            this.textDirection,
            this.fragmentFlow,
            this.span,
            secondTrailingNewlines,
            secondTrailingSpaces
        )];
    }

    toString(): string {
        return '$LayoutFragment($start, $end, $type, $textDirection)';
    }

}

function clampInt(value: number, min: number, max: number): number {
    if (min > max) {
        throw new Error('min must be less than or equal to max');
    }

    if (value < min) {
        return min;
    } else if (value > max) {
        return max;
    } else {
        return value;
    }
}

/// Splits [text] into fragments that are ready to be laid out by
/// [TextLayoutService].
///
/// This fragmenter takes into account line breaks, directionality and styles.
export class LayoutFragmenter extends TextFragmenter {

    constructor(text: string, readonly paragraphSpans: ParagraphSpan[]) {
        super(text)
    }

    fragment(): LayoutFragment[] {
        const fragments: LayoutFragment[] = [];
        let fragmentStart = 0;

        const lineBreakIterator = LineBreakFragmenter.create(this.text).fragment()[Symbol.iterator]();
        let lineBreakNext = lineBreakIterator.next();
        const bidiIterator = new BidiFragmenter(this.text).fragment()[Symbol.iterator]();
        let bidiNext = bidiIterator.next();
        const spanIterator = this.paragraphSpans[Symbol.iterator]();
        let spanNext = spanIterator.next();

        let currentLineBreak: LineBreakFragment = lineBreakNext.value;
        let currentBidi: BidiFragment = bidiNext.value;
        let currentSpan: ParagraphSpan = spanNext.value;

        while (true) {
            const fragmentEnd = Math.min(
                currentLineBreak.end,
                Math.min(currentBidi.end, currentSpan.end)
            );

            const distanceFromLineBreak = currentLineBreak.end - fragmentEnd;
            const lineBreakType = distanceFromLineBreak === 0
                ? currentLineBreak.type
                : LineBreakType.prohibited;

            const trailingNewlines = currentLineBreak.trailingNewlines - distanceFromLineBreak;
            const trailingSpaces = currentLineBreak.trailingSpaces - distanceFromLineBreak;
            const fragmentLength = fragmentEnd - fragmentStart;

            fragments.push(new LayoutFragment(
                fragmentStart,
                fragmentEnd,
                lineBreakType,
                currentBidi.textDirection,
                currentBidi.fragmentFlow,
                currentSpan,
                clampInt(trailingNewlines, 0, fragmentLength),
                clampInt(trailingSpaces, 0, fragmentLength)
            ));

            fragmentStart = fragmentEnd;

            let moved = false;
            if (currentLineBreak.end === fragmentEnd && !(lineBreakNext = lineBreakIterator.next()).done) {
                currentLineBreak = lineBreakNext.value;
                moved = true;
            }
            if (currentBidi.end === fragmentEnd && !(bidiNext = bidiIterator.next()).done) {
                currentBidi = bidiNext.value;
                moved = true;
            }
            if (currentSpan.end === fragmentEnd && !(spanNext = spanIterator.next()).done) {
                currentSpan = spanNext.value;
                moved = true;
            }

            // Once we reached the end of all fragments, exit the loop.
            if (!moved) break;
        }

        return fragments;
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
            null, //TextDirectionEnums.LTR,
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

    split(_index: number): LayoutFragment[] {
        throw new Error('Cannot split an EllipsisFragment');
    }
}
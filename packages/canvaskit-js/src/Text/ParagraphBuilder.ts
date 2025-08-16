import type {
  ParagraphBuilder as CKParagraphBuilder,
  InputGraphemes,
  InputLineBreaks,
  InputWords,
  Paint,
  Paragraph as CKParagraph,
  PlaceholderAlignment,
  TextBaseline,
  TextStyle,
  GlyphInfo,
  LineMetrics,
  PositionWithAffinity,
  RectHeightStyle,
  RectWidthStyle,
  RectWithDirection,
  ShapedLine,
  URange,
  ParagraphStyle,
  TypefaceFontProvider,
  Canvas,
} from "canvaskit-wasm";
import { HostObject } from "../HostObject";
import { StringBuffer } from "./sb";
import { LayoutFragment } from "./layout_fragmenter";
import { PaintJS } from "../Paint";
import { FontJS } from "./Font";
import { Affinity as AffinityEnum, TextBaselineEnum } from "../Core";
import { WordBreaker } from "./word_breaker";
import {
  ParagraphStyle as ParagraphStyleJS,
  TextStyle as TextStyleJS,
} from "./ParagraphStyle";
import { TypefaceFontProviderJS } from "./TypefaceFont";
import { measureSubstring } from "./measurement";

// export const ParagraphBuilder: CKParagraphBuilder = {
//     addPlaceholder: function (width?: number, height?: number, alignment?: PlaceholderAlignment, baseline?: TextBaseline, offset?: number): void {
//         throw new Error("Function not implemented.");
//     },
//     addText: function (str: string): void {
//         throw new Error("Function not implemented.");
//     },
//     build: function (): CKParagraph {
//         throw new Error("Function not implemented.");
//     },
//     setWordsUtf8: function (words: InputWords): void {
//         throw new Error("Function not implemented.");
//     },
//     setWordsUtf16: function (words: InputWords): void {
//         throw new Error("Function not implemented.");
//     },
//     setGraphemeBreaksUtf8: function (graphemes: InputGraphemes): void {
//         throw new Error("Function not implemented.");
//     },
//     setGraphemeBreaksUtf16: function (graphemes: InputGraphemes): void {
//         throw new Error("Function not implemented.");
//     },
//     setLineBreaksUtf8: function (lineBreaks: InputLineBreaks): void {
//         throw new Error("Function not implemented.");
//     },
//     setLineBreaksUtf16: function (lineBreaks: InputLineBreaks): void {
//         throw new Error("Function not implemented.");
//     },
//     getText: function (): string {
//         throw new Error("Function not implemented.");
//     },
//     pop: function (): void {
//         throw new Error("Function not implemented.");
//     },
//     pushStyle: function (text: TextStyle): void {
//         throw new Error("Function not implemented.");
//     },
//     pushPaintStyle: function (textStyle: TextStyle, fg: Paint, bg: Paint): void {
//         throw new Error("Function not implemented.");
//     },
//     reset: function (): void {
//         throw new Error("Function not implemented.");
//     },
//     _type: "ParagraphBuilder",
//     delete: function (): void {
//         throw new Error("Function not implemented.");
//     },
//     deleteLater: function (): void {
//         throw new Error("Function not implemented.");
//     },
//     isAliasOf: function (other: any): boolean {
//         throw new Error("Function not implemented.");
//     },
//     isDeleted: function (): boolean {
//         throw new Error("Function not implemented.");
//     }
// }

// export const Paragraph: CKParagraph = {
//     didExceedMaxLines: function (): boolean {
//         throw new Error("Function not implemented.");
//     },
//     getAlphabeticBaseline: function (): number {
//         throw new Error("Function not implemented.");
//     },
//     getGlyphPositionAtCoordinate: function (dx: number, dy: number): PositionWithAffinity {
//         throw new Error("Function not implemented.");
//     },
//     getClosestGlyphInfoAtCoordinate: function (dx: number, dy: number): GlyphInfo | null {
//         throw new Error("Function not implemented.");
//     },
//     getGlyphInfoAt: function (index: number): GlyphInfo | null {
//         throw new Error("Function not implemented.");
//     },
//     getHeight: function (): number {
//         throw new Error("Function not implemented.");
//     },
//     getIdeographicBaseline: function (): number {
//         throw new Error("Function not implemented.");
//     },
//     getLineNumberAt: function (index: number): number {
//         throw new Error("Function not implemented.");
//     },
//     getLineMetrics: function (): LineMetrics[] {
//         throw new Error("Function not implemented.");
//     },
//     getLineMetricsAt: function (lineNumber: number): LineMetrics | null {
//         throw new Error("Function not implemented.");
//     },
//     getLongestLine: function (): number {
//         throw new Error("Function not implemented.");
//     },
//     getMaxIntrinsicWidth: function (): number {
//         throw new Error("Function not implemented.");
//     },
//     getMaxWidth: function (): number {
//         throw new Error("Function not implemented.");
//     },
//     getMinIntrinsicWidth: function (): number {
//         throw new Error("Function not implemented.");
//     },
//     getNumberOfLines: function (): number {
//         throw new Error("Function not implemented.");
//     },
//     getRectsForPlaceholders: function (): RectWithDirection[] {
//         throw new Error("Function not implemented.");
//     },
//     getRectsForRange: function (start: number, end: number, hStyle: RectHeightStyle, wStyle: RectWidthStyle): RectWithDirection[] {
//         throw new Error("Function not implemented.");
//     },
//     getWordBoundary: function (offset: number): URange {
//         throw new Error("Function not implemented.");
//     },
//     getShapedLines: function (): ShapedLine[] {
//         throw new Error("Function not implemented.");
//     },
//     layout: function (width: number): void {
//         throw new Error("Function not implemented.");
//     },
//     unresolvedCodepoints: function (): number[] {
//         throw new Error("Function not implemented.");
//     },
//     _type: "Paragraph",
//     delete: function (): void {
//         throw new Error("Function not implemented.");
//     },
//     deleteLater: function (): void {
//         throw new Error("Function not implemented.");
//     },
//     isAliasOf: function (other: any): boolean {
//         throw new Error("Function not implemented.");
//     },
//     isDeleted: function (): boolean {
//         throw new Error("Function not implemented.");
//     }
// }

function createDomCanvasElement(width: number, height: number) {
    const ele = new HTMLCanvasElement()
    ele.width = width
    ele.height = height
    return ele
}

// We don't use this canvas to draw anything, so let's make it as small as
// possible to save memory.
const  textContext = createDomCanvasElement(0,0).getContext("2d")

const placeholderChar = String.fromCharCode(0xfffc);
const scale = 1.0;

export class ParagraphBuilderJS
  extends HostObject<"ParagraphBuilder">
  implements CKParagraphBuilder
{
  _plainTextBuf = new StringBuffer();
  style: ParagraphStyleJS;
  fontSrc: TypefaceFontProviderJS;
  _placeholderCount = 0;

  _placeholderScales: number[] = [];
  _spans: ParagraphSpan[] = [];

  constructor(style: ParagraphStyle, fontSrc: TypefaceFontProvider) {
    super("ParagraphBuilder");
    this.style = new ParagraphStyleJS(style);
    this.fontSrc = fontSrc;
  }

  get placeholderCount(): number {
    return this._placeholderCount;
  }

  get placeholderScales(): number[] {
    return this._placeholderScales;
  }

  addPlaceholder(
    width?: number,
    height?: number,
    alignment?: PlaceholderAlignment,
    baseline?: TextBaseline,
    offset?: number
  ): void {
    // assert(
    // !(alignment == ui.PlaceholderAlignment.aboveBaseline ||
    //         alignment == ui.PlaceholderAlignment.belowBaseline ||
    //         alignment == ui.PlaceholderAlignment.baseline) ||
    //     baseline != null,
    // );

    const start = this._plainTextBuf.length;
    this._plainTextBuf.append(placeholderChar);
    const end = this._plainTextBuf.length;

    const style = _currentStyleNode.resolveStyle();
    // _updateCanDrawOnCanvas(style);

    this._placeholderCount++;
    this._placeholderScales.push(scale);
    this._spans.push(
      new PlaceholderSpan(
        style,
        start,
        end,
        width * scale,
        height * scale,
        alignment,
        (offset ?? height) * scale,
        baseline ?? TextBaselineEnum.Alphabetic
      )
    );
  }

  addText(text: string): void {
    const start = this._plainTextBuf.length;
    this._plainTextBuf.append(text);
    const end = this._plainTextBuf.length;

    const style = _currentStyleNode.resolveStyle();
    // _updateCanDrawOnCanvas(style);

    this._spans.push(new ParagraphSpan(style, start, end));
  }

  build(): CKParagraph {
    if (this._spans.length == 0) {
      // In case `addText` and `addPlaceholder` were never called.
      //
      // We want the paragraph to always have a non-empty list of spans to match
      // the expectations of the [LayoutFragmenter].
      this._spans.push(new ParagraphSpan(rootStyleNode.resolveStyle(), 0, 0));
    }

    return new ParagraphJS(
      this._spans,
      this.style,
      this._plainTextBuf.toString()
    );
  }

  setWordsUtf8(words: InputWords): void {
    throw new Error("Method not implemented.");
  }
  setWordsUtf16(words: InputWords): void {
    throw new Error("Method not implemented.");
  }
  setGraphemeBreaksUtf8(graphemes: InputGraphemes): void {
    throw new Error("Method not implemented.");
  }
  setGraphemeBreaksUtf16(graphemes: InputGraphemes): void {
    throw new Error("Method not implemented.");
  }
  setLineBreaksUtf8(lineBreaks: InputLineBreaks): void {
    throw new Error("Method not implemented.");
  }
  setLineBreaksUtf16(lineBreaks: InputLineBreaks): void {
    throw new Error("Method not implemented.");
  }
  getText(): string {
    throw new Error("Method not implemented.");
  }
  pop(): void {
    throw new Error("Method not implemented.");
  }
  pushStyle(textStyle: TextStyle): void {
    throw new Error("Method not implemented.");
  }
  pushPaintStyle(textStyle: TextStyle, fg: Paint, bg: Paint): void {
    throw new Error("Method not implemented.");
  }
  reset(): void {
    throw new Error("Method not implemented.");
  }
}

export class ParagraphJS
  extends HostObject<"Paragraph">
  implements CKParagraph
{
  isLaidOut = false;
  _lastUsedConstraints: number;
  paintService: TextPaintService;

  layoutService: TextLayoutService;

  constructor(
    readonly span: ParagraphSpan[],
    readonly paragraphStyle: ParagraphStyle,
    readonly plainText: string
  ) {
    super("Paragraph");
    this.paintService = new TextPaintService(this);
    this.layoutService = new TextLayoutService(this);
  }
  didExceedMaxLines(): boolean {
    throw new Error("Method not implemented.");
  }
  getAlphabeticBaseline(): number {
    throw new Error("Method not implemented.");
  }
  getGlyphPositionAtCoordinate(dx: number, dy: number): PositionWithAffinity {
    throw new Error("Method not implemented.");
  }
  getClosestGlyphInfoAtCoordinate(dx: number, dy: number): GlyphInfo | null {
    return this.layoutService.getClosestGlyphInfo(dx, dy);
    throw new Error("Method not implemented.");
  }
  getGlyphInfoAt(index: number): GlyphInfo | null {
    const numberOfLines = this.lines.length;
    const lineNumber: number | null = this._findLine(
      index,
      /*codeUnitOffset,*/ 0,
      numberOfLines
    );
    if (lineNumber === null) {
      return null;
    }

    const line: ParagraphLine = this.lines[lineNumber];
    const range = line.getCharacterRangeAt(index /*codeUnitOffset*/);
    if (range === null) {
      return null;
    }

    console.assert(line.overlapsWith(range.start, range.end));

    for (const fragment of line.fragments) {
      if (fragment.overlapsWith(range.start, range.end)) {
        // If the grapheme cluster is split into multiple fragments (which really
        // shouldn't happen but currently if they are in different TextSpans they
        // don't combine), use the layout box of the first base character as its
        // layout box has a better chance to be not that far-off.
        const textBox = fragment.toTextBox(range.start, range.end);
        return {
          graphemeLayoutBounds: textBox.toRect(),
          graphemeClusterTextRange: range,
          dir: textBox.direction,
        };
      }
    }

    console.assert(false, "This should not be reachable.");
    return null;
  }

  getHeight(): number {
    throw new Error("Method not implemented.");
  }
  getIdeographicBaseline(): number {
    throw new Error("Method not implemented.");
  }
  getLineNumberAt(index: number): number {
    return this._findLine(index, /*codeUnitOffset,*/ 0, this.lines.length);
    // throw new Error("Method not implemented.");
  }
  getLineMetrics(): LineMetrics[] {
    return this.lines.map((line) => line.lineMetrics);
  }

  getLineMetricsAt(lineNumber: number): LineMetrics | null {
    return 0 <= lineNumber && lineNumber < this.lines.length
      ? this.lines[lineNumber].lineMetrics
      : null;
  }
  getLongestLine(): number {
    throw new Error("Method not implemented.");
  }
  getMaxIntrinsicWidth(): number {
    throw new Error("Method not implemented.");
  }
  getMaxWidth(): number {
    throw new Error("Method not implemented.");
  }
  getMinIntrinsicWidth(): number {
    throw new Error("Method not implemented.");
  }
  getNumberOfLines(): number {
    return this.lines.length;
  }
  getRectsForPlaceholders(): RectWithDirection[] {
    throw new Error("Method not implemented.");
  }
  getRectsForRange(
    start: number,
    end: number,
    hStyle: RectHeightStyle,
    wStyle: RectWidthStyle
  ): RectWithDirection[] {
    throw new Error("Method not implemented.");
  }

  getShapedLines(): ShapedLine[] {
    throw new Error("Method not implemented.");
  }

  layout(width: number): void {
    if (width == this._lastUsedConstraints) {
      return;
    }
    this.layoutService.performLayout(width);
    // throw new Error("Method not implemented.");
    this.isLaidOut = true;
    this._lastUsedConstraints = width;
  }
  unresolvedCodepoints(): number[] {
    throw new Error("Method not implemented.");
  }

  draw(canvas: Canvas, x: number, y: number) {
    this.paintService.paint(canvas, x, y);
  }

  get lines() {
    return this.layoutService.lines;
  }

  private _findLine(
    codeUnitOffset: number,
    startLine: number,
    endLine: number
  ): number | null {
    console.assert(endLine <= this.lines.length);
    const numberOfLines = this.lines.length;

    const isOutOfBounds: boolean =
      endLine <= startLine ||
      codeUnitOffset < this.lines[startLine].startIndex ||
      (endLine < numberOfLines &&
        this.lines[endLine].startIndex <= codeUnitOffset);

    if (isOutOfBounds) {
      return null;
    }

    if (endLine === startLine + 1) {
      console.assert(this.lines[startLine].startIndex <= codeUnitOffset);
      console.assert(
        endLine === numberOfLines ||
          codeUnitOffset < this.lines[endLine].startIndex
      );
      return codeUnitOffset >= this.lines[startLine].visibleEndIndex
        ? null
        : startLine;
    }

    // endLine >= startLine + 2 thus we have
    // startLine + 1 <= midIndex <= endLine - 1
    const midIndex: number = Math.floor((startLine + endLine) / 2);
    return (
      this._findLine(codeUnitOffset, midIndex, endLine) ??
      this._findLine(codeUnitOffset, startLine, midIndex)
    );
  }

  getWordBoundary(position: PositionWithAffinity): URange {
    let characterPosition: number;

    switch (position.affinity) {
      case AffinityEnum.Upstream:
        characterPosition = position.pos - 1;
        break;
      case AffinityEnum.Downstream:
        characterPosition = position.pos;
        break;
    }

    const start: number = WordBreaker.prevBreakIndex(
      this.plainText,
      characterPosition + 1
    );
    const end: number = WordBreaker.nextBreakIndex(
      this.plainText,
      characterPosition
    );

    return { start: start, end: end };
  }

  getLineBoundary(position: PositionWithAffinity): URange {
    if (this.lines.length === 0) {
      return { start: 0, end: 0 }; //YourClass.emptyTextRange;
    }

    const lineNumber = this.getLineNumberAt(position.pos);

    // Fallback to the last line for backward compatibility.
    const line =
      lineNumber !== null
        ? this.lines[lineNumber]
        : this.lines[this.lines.length - 1];

    return {
      start: line.startIndex,
      end: line.endIndex - line.trailingNewlines,
    };
  }
}
export class ParagraphLine {
    /// Metrics for this line of the paragraph.
    readonly lineMetrics: EngineLineMetrics;

    /// The index (inclusive) in the text where this line begins.
    readonly startIndex: number;

    /// The index (exclusive) in the text where this line ends.
    readonly endIndex: number;

    /// The largest visible index (exclusive) in this line.
    private _visibleEndIndex: number | null = null;
    get visibleEndIndex(): number {
        if (this._visibleEndIndex === null) {
            this._visibleEndIndex = (() => {
                if (this.fragments.length === 0) {
                    return this.startIndex;
                }
                
                // 检查最后一个片段是否是EllipsisFragment
                const lastFragment = this.fragments[this.fragments.length - 1];
                if (this._isEllipsisFragment(lastFragment)) {
                    if (this.fragments.length === 1) {
                        return this.startIndex;
                    }
                    return this.fragments[this.fragments.length - 2].end;
                }
                
                return this.fragments[this.fragments.length - 1].end;
            })();
        }
        return this._visibleEndIndex;
    }

    /// The number of new line characters at the end of the line.
    readonly trailingNewlines: number;

    /// The number of spaces at the end of the line.
    readonly trailingSpaces: number;

    /// The number of space characters in the entire line.
    readonly spaceCount: number;

    /// The full width of the line including all trailing space but not new lines.
    readonly widthWithTrailingSpaces: number;

    /// The fragments that make up this line.
    readonly fragments: LayoutFragment[];

    /// The text direction of this line, which is the same as the paragraph's.
    readonly textDirection: TextDirection;

    /// The text to be rendered on the screen representing this line.
    readonly displayText: string | null;

    /// The [CanvasParagraph] this line is part of.
    readonly paragraph: CanvasParagraph;

    constructor(options: {
        hardBreak: boolean;
        ascent: number;
        descent: number;
        height: number;
        width: number;
        left: number;
        baseline: number;
        lineNumber: number;
        startIndex: number;
        endIndex: number;
        trailingNewlines: number;
        trailingSpaces: number;
        spaceCount: number;
        widthWithTrailingSpaces: number;
        fragments: LayoutFragment[];
        textDirection: TextDirection;
        paragraph: ParagraphJS;
        displayText?: string | null;
    }) {
        console.assert(options.trailingNewlines <= options.endIndex - options.startIndex);
        
        this.lineMetrics = {
            hardBreak: options.hardBreak,
            ascent: options.ascent,
            descent: options.descent,
            unscaledAscent: options.ascent,
            height: options.height,
            width: options.width,
            left: options.left,
            baseline: options.baseline,
            lineNumber: options.lineNumber,
        };
        
        this.startIndex = options.startIndex;
        this.endIndex = options.endIndex;
        this.trailingNewlines = options.trailingNewlines;
        this.trailingSpaces = options.trailingSpaces;
        this.spaceCount = options.spaceCount;
        this.widthWithTrailingSpaces = options.widthWithTrailingSpaces;
        this.fragments = options.fragments;
        this.textDirection = options.textDirection;
        this.paragraph = options.paragraph;
        this.displayText = options.displayText ?? null;
    }

    /// The number of space characters in the line excluding trailing spaces.
    get nonTrailingSpaces(): number {
        return this.spaceCount - this.trailingSpaces;
    }

    // Convenient getters for line metrics properties.
    get hardBreak(): boolean { return this.lineMetrics.hardBreak; }
    get ascent(): number { return this.lineMetrics.ascent; }
    get descent(): number { return this.lineMetrics.descent; }
    get unscaledAscent(): number { return this.lineMetrics.unscaledAscent; }
    get height(): number { return this.lineMetrics.height; }
    get width(): number { return this.lineMetrics.width; }
    get left(): number { return this.lineMetrics.left; }
    get baseline(): number { return this.lineMetrics.baseline; }
    get lineNumber(): number { return this.lineMetrics.lineNumber; }

    overlapsWith(startIndex: number, endIndex: number): boolean {
        return startIndex < this.endIndex && this.startIndex < endIndex;
    }

    getText(paragraph: ParagraphJS): string {
        const buffer: string[] = [];
        for (const fragment of this.fragments) {
            buffer.push(fragment.getText(paragraph));
        }
        return buffer.join('');
    }

    // This is the fallback graphme breaker that is only used if Intl.Segmenter()
    // is not supported so _fromDomSegmenter can't be called. This implementation
    // breaks the text into UTF-16 codepoints instead of graphme clusters.
    private _fallbackGraphemeStartIterable(lineText: string): number[] {
        const graphemeStarts: number[] = [];
        let precededByHighSurrogate = false;
        for (let i = 0; i < lineText.length; i++) {
            const maskedCodeUnit = lineText.charCodeAt(i) & 0xFC00;
            // Only skip `i` if it points to a low surrogate in a valid surrogate pair.
            if (maskedCodeUnit !== 0xDC00 || !precededByHighSurrogate) {
                graphemeStarts.push(this.startIndex + i);
            }
            precededByHighSurrogate = maskedCodeUnit === 0xD800;
        }
        return graphemeStarts;
    }

    // This will be called at most once to lazily populate _graphemeStarts.
    private _fromDomSegmenter(fragmentText: string): number[] {
        const domSegmenter: DomSegmenter = createIntlSegmenter({ granularity: 'grapheme' });
        const graphemeStarts: number[] = [];
        const segments = domSegmenter.segment(fragmentText).iterator();
        while (segments.moveNext()) {
            graphemeStarts.push(segments.current.index + this.startIndex);
        }
        console.assert(graphemeStarts.length === 0 || graphemeStarts[0] === this.startIndex);
        return graphemeStarts;
    }

    private _breakTextIntoGraphemes(text: string): number[] {
        const graphemeStarts: number[] = 
            domIntl.Segmenter == null ? this._fallbackGraphemeStartIterable(text) : this._fromDomSegmenter(text);
        // Add the end index of the fragment to the list if the text is not empty.
        if (graphemeStarts.length > 0) {
            graphemeStarts.push(this.visibleEndIndex);
        }
        return graphemeStarts;
    }

    private _graphemeStarts: number[] | null = null;
    /// This List contains an ascending sequence of UTF16 offsets that points to
    /// grapheme starts within the line. Each UTF16 offset is relative to the
    /// start of the paragraph, instead of the start of the line.
    get graphemeStarts(): number[] {
        if (this._graphemeStarts === null) {
            this._graphemeStarts = 
                this.visibleEndIndex === this.startIndex
                    ? []
                    : this._breakTextIntoGraphemes(this.paragraph.plainText.substring(this.startIndex, this.visibleEndIndex));
        }
        return this._graphemeStarts;
    }

    /// Translate a UTF16 code unit in the paragaph (`offset`), to a grapheme
    /// offset with in the current line.
    ///
    /// The `start` and `end` parameters are both grapheme offsets within the
    /// current line. They are used to limit the search range (so the return value
    /// that corresponds to the code unit `offset` must be with in [start, end)).
    graphemeStartIndexBefore(offset: number, start: number, end: number): number {
        let low = start;
        let high = end;
        console.assert(0 <= low);
        console.assert(low < high);

        const lineGraphemeBreaks: number[] = this.graphemeStarts;
        console.assert(offset >= lineGraphemeBreaks[start]);
        console.assert(offset < lineGraphemeBreaks[lineGraphemeBreaks.length - 1], `${offset}, ${lineGraphemeBreaks}`);
        console.assert(end === lineGraphemeBreaks.length || offset < lineGraphemeBreaks[end]);
        
        while (low + 2 <= high) {
            // high >= low + 2, so low + 1 <= mid <= high - 1
            const mid = Math.floor((low + high) / 2);
            const diff = lineGraphemeBreaks[mid] - offset;
            
            if (diff > 0) {
                high = mid;
            } else if (diff < 0) {
                low = mid;
            } else {
                return mid;
            }
        }

        console.assert(lineGraphemeBreaks[low] <= offset);
        console.assert(high === lineGraphemeBreaks.length || offset < lineGraphemeBreaks[high]);
        return low;
    }

    /// Returns the UTF-16 range of the character that encloses the code unit at
    /// the given offset.
    getCharacterRangeAt(codeUnitOffset: number): URange | null {
        console.assert(codeUnitOffset >= this.startIndex);
        if (codeUnitOffset >= this.visibleEndIndex || this.graphemeStarts.length === 0) {
            return null;
        }

        const startIndex = this.graphemeStartIndexBefore(codeUnitOffset, 0, this.graphemeStarts.length);
        console.assert(startIndex < this.graphemeStarts.length - 1);
        return {
            start: this.graphemeStarts[startIndex], 
            end: this.graphemeStarts[startIndex + 1]
        };
    }

    private _isEllipsisFragment(fragment: LayoutFragment): boolean {
        // 简化实现，实际需要根据具体类型判断
        return (fragment as any).constructor?.name === 'EllipsisFragment';
    }

    closestFragmentTo(targetFragment: LayoutFragment, searchLeft: boolean): LayoutFragment | null {
        let closestFragment: { fragment: LayoutFragment; distance: number } | null = null;
        
        for (const fragment of this.fragments) {
            console.assert(!this._isEllipsisFragment(fragment));
            if (fragment.start >= this.visibleEndIndex) {
                break;
            }
            if (fragment.graphemeStartIndexRange === null) {
                continue;
            }
            
            const distance = searchLeft 
                ? targetFragment.left - fragment.right 
                : fragment.left - targetFragment.right;
            const minDistance = closestFragment?.distance;
            
            if (distance > 0.0 && (minDistance === undefined || minDistance === null || minDistance > distance)) {
                closestFragment = { fragment: fragment, distance: distance };
            } else if (distance === 0.0) {
                return fragment;
            }
        }
        return closestFragment?.fragment ?? null;
    }

    /// Finds the closest [LayoutFragment] to the given horizontal offset `dx` in
    /// this line, that is not an [EllipsisFragment] and contains at least one
    /// grapheme start.
    closestFragmentAtOffset(dx: number): LayoutFragment | null {
        if (this.graphemeStarts.length === 0) {
            return null;
        }
        console.assert(this.graphemeStarts.length >= 2);
        
        let graphemeIndex = 0;
        let closestFragment: { fragment: LayoutFragment; distance: number } | null = null;
        
        for (const fragment of this.fragments) {
            console.assert(!this._isEllipsisFragment(fragment));
            if (fragment.start >= this.visibleEndIndex) {
                break;
            }
            if (fragment.length === 0) {
                continue;
            }
            
            while (fragment.start > this.graphemeStarts[graphemeIndex]) {
                graphemeIndex += 1;
            }
            
            const firstGraphemeStartInFragment = this.graphemeStarts[graphemeIndex];
            if (firstGraphemeStartInFragment >= fragment.end) {
                continue;
            }
            
            let distance: number;
            if (dx < fragment.left) {
                distance = fragment.left - dx;
            } else if (dx > fragment.right) {
                distance = dx - fragment.right;
            } else {
                return fragment;
            }
            console.assert(distance > 0);

            const minDistance = closestFragment?.distance;
            if (minDistance === undefined || minDistance === null || minDistance > distance) {
                closestFragment = { fragment: fragment, distance: distance };
            }
        }
        return closestFragment?.fragment ?? null;
    }

    // hashCode equivalent
    getHashCode(): number {
        return this._hashObjects([
            this.lineMetrics,
            this.startIndex,
            this.endIndex,
            this.trailingNewlines,
            this.trailingSpaces,
            this.spaceCount,
            this.widthWithTrailingSpaces,
            this.fragments,
            this.textDirection,
            this.displayText
        ]);
    }

    private _hashObjects(objects: any[]): number {
        // 简化的哈希实现
        let hash = 0;
        for (const obj of objects) {
            hash = ((hash << 5) - hash) + this._getObjectHash(obj);
            hash |= 0; // 转换为32位整数
        }
        return hash;
    }

    private _getObjectHash(obj: any): number {
        if (obj === null || obj === undefined) return 0;
        if (typeof obj === 'number') return obj;
        if (typeof obj === 'string') return this._stringHash(obj);
        if (typeof obj === 'boolean') return obj ? 1 : 0;
        if (Array.isArray(obj)) return this._hashObjects(obj);
        if (typeof obj === 'object' && obj.hashCode) return obj.hashCode();
        return 0;
    }

    private _stringHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash;
    }

    // equals equivalent
    equals(other: any): boolean {
        if (this === other) {
            return true;
        }
        if (other === null || typeof other !== 'object' || !(other instanceof ParagraphLine)) {
            return false;
        }
        
        return this.lineMetrics === other.lineMetrics &&
            this.startIndex === other.startIndex &&
            this.endIndex === other.endIndex &&
            this.trailingNewlines === other.trailingNewlines &&
            this.trailingSpaces === other.trailingSpaces &&
            this.spaceCount === other.spaceCount &&
            this.widthWithTrailingSpaces === other.widthWithTrailingSpaces &&
            this.fragments === other.fragments &&
            this.textDirection === other.textDirection &&
            this.displayText === other.displayText;
    }

    toString(): string {
        return `ParagraphLine(${this.startIndex}, ${this.endIndex}, ${JSON.stringify(this.lineMetrics)})`;
    }
}
export class TextPaintService {
  constructor(readonly paragraph: ParagraphJS) {}

  paint(canvas: Canvas, x: number, y: number) {
    // Loop through all the lines, for each line, loop through all fragments and
    // paint them. The fragment objects have enough information to be painted
    // individually.
    const paint = new PaintJS();
    const font = new FontJS();
    canvas.drawText("Hello Roboto", x, y, paint, font);
    for (const line of this.paragraph.lines) {
      for (const fragment of line.fragments) {
        this._paintBackground(canvas, x, y, fragment);
        this._paintText(canvas, x, y, line, fragment);
      }
    }
  }

  _paintBackground(
    canvas: Canvas,
    x: number,
    y: number,
    fragment: LayoutFragment
  ) {
    if (fragment.isPlaceholder) {
      return;
    }
    // Paint the background of the box, if the span has a background.
    const background = fragment.style.background; //as SurfacePaint?;
    if (background != null) {
      // final ui.Rect rect = fragment.toPaintingTextBox().toRect();
      // if (!rect.isEmpty) {
      //     canvas.drawRect(rect.shift(offset), background.paintData);
      // }
    }
  }

  _paintText(
    canvas: Canvas,
    x: number,
    y: number,
    line: ParagraphLine,
    fragment: LayoutFragment
  ) {
    // There's no text to paint in placeholder spans.
    if (fragment.isPlaceholder) {
      return;
    }

    // Don't paint the text for space-only boxes. This is just an
    // optimization, it doesn't have any effect on the output.
    if (fragment.isSpaceOnly) {
      return;
    }

    this._prepareCanvasForFragment(canvas, fragment);

    // const fragmentX = fragment.textDirection! == ui.TextDirection.ltr ? fragment.left : fragment.right;

    // const _x = x + line.left + fragmentX;
    // const _y = y + line.baseline;
    // const text = fragment.getText(this.paragraph);
    const paint = new CanvasKit.Paint();
    paint.setColor(CanvasKit.CYAN);
    const font = new CanvasKit.Font();
    console.log("aaahah");
    canvas.drawText("Hello Roboto", 10, 50, paint, font);
    // canvas.drawText(text, _x, _y, fragment.style.paint, fragment.style.font)
    // canvas.tearDownPaint
  }

  _prepareCanvasForFragment(canvas: Canvas, fragment: LayoutFragment) {}
}

export class TextLayoutService {
  width: number = -1.0;

  height: number = 0.0;

  longestLine: ParagraphLine | null;

  minIntrinsicWidth: number = 0.0;

  maxIntrinsicWidth: number = 0.0;

  alphabeticBaseline: number = -1.0;

  ideographicBaseline: number = -1.0;

  didExceedMaxLines = false;

  lines: ParagraphLine[] = [];

  constructor(readonly paragraph: ParagraphJS) {}

  getClosestGlyphInfo(dx: number, dy: number): GlyphInfo | null {
    throw new Error("need implemented");
  }

  performLayout(width: number) {
    this.width = width;
    this.height = 0.0;
    this.longestLine = null;
    this.minIntrinsicWidth = 0.0;
    this.maxIntrinsicWidth = 0.0;
    this.didExceedMaxLines = false;
    this.lines = []
  }
}

export class ParagraphSpan {
  constructor(
    readonly style: TextStyleJS,
    readonly start: number,
    readonly end: number
  ) {}
  // stype: TextStyleJS,
  // start: number,
  // end: number,
}

export class ParagraphPlaceholder extends ParagraphSpan {
  constructor(style: TextStyleJS, start: number, end: number) {
    super(style, start, end);
  }
}

export class PlaceholderSpan extends ParagraphPlaceholder /*implements ParagraphSpan*/ {
  constructor(
    style: TextStyleJS,
    start: number,
    end: number,
    width: number,
    height: number,
    alignment: PlaceholderAlignment,
    baselineOffset: number,
    baseline: TextBaseline
  ) {
    super(style, start, end);
  }
}

/// Builds instances of [ParagraphLine] for the given [paragraph].
class LineBuilder {
    private _fragments: LayoutFragment[];
    private _fragmentsForNextLine: LayoutFragment[] | null = null;
    
    readonly maxWidth: number;
    readonly paragraph: ParagraphJS;
    readonly spanometer: Spanometer;
    readonly lineNumber: number;
    readonly accumulatedHeight: number;
    
    width: number = 0.0;
    widthIncludingSpace: number = 0.0;
    ascent: number = 0.0;
    descent: number = 0.0;
    
    private _lastBreakableFragment: number = -1;
    private _breakCount: number = 0;
    private _spaceCount: number = 0;
    private _trailingSpaces: number = 0;
    
    private constructor(
        paragraph: ParagraphJS,
        spanometer: Spanometer,
        maxWidth: number,
        lineNumber: number,
        accumulatedHeight: number,
        fragments: LayoutFragment[]
    ) {
        this.paragraph = paragraph;
        this.spanometer = spanometer;
        this.maxWidth = maxWidth;
        this.lineNumber = lineNumber;
        this.accumulatedHeight = accumulatedHeight;
        this._fragments = fragments;
        this._recalculateMetrics();
    }
    
    /// Creates a [LineBuilder] for the first line in a paragraph.
    static first(
        paragraph: ParagraphJS,
        spanometer: Spanometer,
        maxWidth: number
    ): LineBuilder {
        return new LineBuilder(
            paragraph,
            spanometer,
            maxWidth,
            0,
            0.0,
            []
        );
    }
    
    get startIndex(): number {
        console.assert(this._fragments.length > 0 || (this._fragmentsForNextLine && this._fragmentsForNextLine.length > 0));
        
        return this.isNotEmpty ? this._fragments[0].start : this._fragmentsForNextLine![0].start;
    }
    
    get endIndex(): number {
        console.assert(this._fragments.length > 0 || (this._fragmentsForNextLine && this._fragmentsForNextLine.length > 0));
        
        return this.isNotEmpty ? this._fragments[this._fragments.length - 1].end : this._fragmentsForNextLine![0].start;
    }
    
    private get _widthExcludingLastFragment(): number {
        return this._fragments.length > 1
            ? this.widthIncludingSpace - this._fragments[this._fragments.length - 1].widthIncludingTrailingSpaces
            : 0;
    }
    
    get height(): number {
        return this.ascent + this.descent;
    }
    
    /// Whether this line can be legally broken into more than one line.
    get isBreakable(): boolean {
        if (this._fragments.length === 0) {
            return false;
        }
        if (this._fragments[this._fragments.length - 1].isBreak) {
            // We need one more break other than the last one.
            return this._breakCount > 1;
        }
        return this._breakCount > 0;
    }
    
    /// Returns true if the line can't be legally broken any further.
    get isNotBreakable(): boolean {
        return !this.isBreakable;
    }
    
    get isEmpty(): boolean {
        return this._fragments.length === 0;
    }
    
    get isNotEmpty(): boolean {
        return this._fragments.length > 0;
    }
    
    get isHardBreak(): boolean {
        return this._fragments.length > 0 && this._fragments[this._fragments.length - 1].isHardBreak;
    }
    
    /// The horizontal offset necessary for the line to be correctly aligned.
    get alignOffset(): number {
        const emptySpace = this.maxWidth - this.width;
        const textAlign = this.paragraph.paragraphStyle.effectiveTextAlign;
        const paragraphDirection = this._paragraphDirection;
        
        switch (textAlign) {
            case TextAlign.center:
                return emptySpace / 2.0;
            case TextAlign.right:
                return emptySpace;
            case TextAlign.start:
                return paragraphDirection === TextDirection.rtl ? emptySpace : 0.0;
            case TextAlign.end:
                return paragraphDirection === TextDirection.rtl ? 0.0 : emptySpace;
            default:
                return 0.0;
        }
    }
    
    get isOverflowing(): boolean {
        return this.width > this.maxWidth;
    }
    
    get canHaveEllipsis(): boolean {
        if (this.paragraph.paragraphStyle.ellipsis === null) {
            return false;
        }
        
        const maxLines: number | null = this.paragraph.paragraphStyle.maxLines;
        return (maxLines === null) || (maxLines === this.lineNumber + 1);
    }
    
    private get _canAppendEmptyFragments(): boolean {
        if (this.isHardBreak) {
            // Can't append more fragments to this line if it has a hard break.
            return false;
        }
        
        if (this._fragmentsForNextLine && this._fragmentsForNextLine.length > 0) {
            // If we already have fragments prepared for the next line, then we can't
            // append more fragments to this line.
            return false;
        }
        
        return true;
    }
    
    private get _paragraphDirection(): TextDirection {
        return this.paragraph.paragraphStyle.effectiveTextDirection;
    }
    
    addFragment(fragment: LayoutFragment): void {
        this._updateMetrics(fragment);
        
        if (fragment.isBreak) {
            this._lastBreakableFragment = this._fragments.length;
        }
        
        this._fragments.push(fragment);
    }
    
    /// Updates the [LineBuilder]'s metrics to take into account the new [fragment].
    private _updateMetrics(fragment: LayoutFragment): void {
        this._spaceCount += fragment.trailingSpaces;
        
        if (fragment.isSpaceOnly) {
            this._trailingSpaces += fragment.trailingSpaces;
        } else {
            this._trailingSpaces = fragment.trailingSpaces;
            this.width = this.widthIncludingSpace + fragment.widthExcludingTrailingSpaces;
        }
        this.widthIncludingSpace += fragment.widthIncludingTrailingSpaces;
        
        if (fragment.isPlaceholder) {
            this._adjustPlaceholderAscentDescent(fragment);
        }
        
        if (fragment.isBreak) {
            this._breakCount++;
        }
        
        this.ascent = Math.max(this.ascent, fragment.ascent);
        this.descent = Math.max(this.descent, fragment.descent);
    }
    
    private _adjustPlaceholderAscentDescent(fragment: LayoutFragment): void {
        const placeholder: PlaceholderSpan = fragment.span as PlaceholderSpan;
        
        let ascent: number, descent: number;
        switch (placeholder.alignment) {
            case PlaceholderAlignment.top:
                // The placeholder is aligned to the top of text, which means it has the
                // same `ascent` as the remaining text. We only need to extend the
                // `descent` enough to fit the placeholder.
                ascent = this.ascent;
                descent = placeholder.height - this.ascent;
                break;
                
            case PlaceholderAlignment.bottom:
                // The opposite of `top`. The `descent` is the same, but we extend the
                // `ascent`.
                ascent = placeholder.height - this.descent;
                descent = this.descent;
                break;
                
            case PlaceholderAlignment.middle:
                const textMidPoint: number = this.height / 2;
                const placeholderMidPoint: number = placeholder.height / 2;
                const diff: number = placeholderMidPoint - textMidPoint;
                ascent = this.ascent + diff;
                descent = this.descent + diff;
                break;
                
            case PlaceholderAlignment.aboveBaseline:
                ascent = placeholder.height;
                descent = 0.0;
                break;
                
            case PlaceholderAlignment.belowBaseline:
                ascent = 0.0;
                descent = placeholder.height;
                break;
                
            case PlaceholderAlignment.baseline:
                ascent = placeholder.baselineOffset;
                descent = placeholder.height - ascent;
                break;
        }
        
        // Update the metrics of the fragment to reflect the calculated ascent and
        // descent.
        fragment.setMetrics(
            this.spanometer,
            ascent,
            descent,
            fragment.widthExcludingTrailingSpaces,
            fragment.widthIncludingTrailingSpaces
        );
    }
    
    private _recalculateMetrics(): void {
        this.width = 0;
        this.widthIncludingSpace = 0;
        this.ascent = 0;
        this.descent = 0;
        this._spaceCount = 0;
        this._trailingSpaces = 0;
        this._breakCount = 0;
        this._lastBreakableFragment = -1;
        
        for (let i = 0; i < this._fragments.length; i++) {
            this._updateMetrics(this._fragments[i]);
            if (this._fragments[i].isBreak) {
                this._lastBreakableFragment = i;
            }
        }
    }
    
    forceBreakLastFragment(availableWidth?: number, allowEmptyLine: boolean = false): void {
        console.assert(this.isNotEmpty);
        
        availableWidth = availableWidth ?? this.maxWidth;
        console.assert(this.widthIncludingSpace > availableWidth);
        
        this._fragmentsForNextLine = this._fragmentsForNextLine ?? [];
        
        // When the line has fragments other than the last one, we can always allow
        // the last fragment to be empty (i.e. completely removed from the line).
        const hasOtherFragments: boolean = this._fragments.length > 1;
        const allowLastFragmentToBeEmpty: boolean = hasOtherFragments || allowEmptyLine;
        
        const lastFragment: LayoutFragment = this._fragments[this._fragments.length - 1];
        
        if (lastFragment.isPlaceholder) {
            // Placeholder can't be force-broken. Either keep all of it in the line or
            // move it to the next line.
            if (allowLastFragmentToBeEmpty) {
                this._fragmentsForNextLine!.unshift(this._fragments.pop()!);
                this._recalculateMetrics();
            }
            return;
        }
        
        this.spanometer.currentSpan = lastFragment.span;
        const lineWidthWithoutLastFragment: number =
            this.widthIncludingSpace - lastFragment.widthIncludingTrailingSpaces;
        const availableWidthForFragment: number = availableWidth - lineWidthWithoutLastFragment;
        const forceBreakEnd: number = lastFragment.end - lastFragment.trailingNewlines;
        
        const breakingPoint: number = this.spanometer.forceBreak(
            lastFragment.start,
            forceBreakEnd,
            availableWidthForFragment,
            allowLastFragmentToBeEmpty
        );
        
        if (breakingPoint === forceBreakEnd) {
            // The entire fragment remained intact. Let's keep everything as is.
            return;
        }
        
        this._fragments.pop();
        this._recalculateMetrics();
        
        const split: (LayoutFragment | null)[] = lastFragment.split(breakingPoint);
        
        const first: LayoutFragment | null = split[0];
        if (first != null) {
            this.spanometer.measureFragment(first);
            this.addFragment(first);
        }
        
        const second: LayoutFragment | null = split[1];
        if (second != null) {
            this.spanometer.measureFragment(second);
            this._fragmentsForNextLine!.unshift(second);
        }
    }
    
    insertEllipsis(): void {
        console.assert(this.canHaveEllipsis);
        console.assert(this.isOverflowing);
        
        const ellipsisText: string = this.paragraph.paragraphStyle.ellipsis!;
        
        this._fragmentsForNextLine = [];
        
        this.spanometer.currentSpan = this._fragments[this._fragments.length - 1].span;
        let ellipsisWidth: number = this.spanometer.measureText(ellipsisText);
        let availableWidth: number = Math.max(0, this.maxWidth - ellipsisWidth);
        
        while (this._widthExcludingLastFragment > availableWidth) {
            this._fragmentsForNextLine!.unshift(this._fragments.pop()!);
            this._recalculateMetrics();
            
            this.spanometer.currentSpan = this._fragments[this._fragments.length - 1].span;
            ellipsisWidth = this.spanometer.measureText(ellipsisText);
            availableWidth = this.maxWidth - ellipsisWidth;
        }
        
        const lastFragment: LayoutFragment = this._fragments[this._fragments.length - 1];
        this.forceBreakLastFragment(availableWidth, true);
        
        // 创建椭圆片段（需要具体实现）
        const ellipsisFragment: LayoutFragment = {
            start: this.endIndex,
            end: this.endIndex,
            trailingSpaces: 0,
            trailingNewlines: 0,
            widthExcludingTrailingSpaces: ellipsisWidth,
            widthIncludingTrailingSpaces: ellipsisWidth,
            ascent: lastFragment.ascent,
            descent: lastFragment.descent,
            span: lastFragment.span,
            isBreak: false,
            isHardBreak: false,
            isSpaceOnly: false,
            isPlaceholder: false,
            split: (breakingPoint: number) => [null, null],
            setMetrics: (
                spanometer: Spanometer,
                ascent: number,
                descent: number,
                widthExcludingTrailingSpaces: number,
                widthIncludingTrailingSpaces: number
            ) => {
                // 实现设置度量的逻辑
            }
        } as LayoutFragment;
        
        this.addFragment(ellipsisFragment);
    }
    
    revertToLastBreakOpportunity(): void {
        console.assert(this.isBreakable);
        
        // The last fragment in the line may or may not be breakable. Regardless,
        // it needs to be removed.
        //
        // We need to find the latest breakable fragment in the line (other than the
        // last fragment). Such breakable fragment is guaranteed to be found because
        // the line `isBreakable`.
        
        // Start from the end and skip the last fragment.
        let i: number = this._fragments.length - 2;
        while (!this._fragments[i].isBreak) {
            i--;
        }
        
        this._fragmentsForNextLine = this._fragments.slice(i + 1);
        this._fragments.splice(i + 1);
        this._recalculateMetrics();
    }
    
    /// Appends as many zero-width fragments as this line allows.
    ///
    /// Returns the number of fragments that were appended.
    appendZeroWidthFragments(fragments: LayoutFragment[], startFrom: number): number {
        let i: number = startFrom;
        while (this._canAppendEmptyFragments &&
            i < fragments.length &&
            fragments[i].widthExcludingTrailingSpaces === 0) {
            this.addFragment(fragments[i]);
            i++;
        }
        return i - startFrom;
    }
    
    /// Builds the [ParagraphLine] instance that represents this line.
    build(): ParagraphLine {
        if (this._fragmentsForNextLine === null) {
            this._fragmentsForNextLine =
                this._fragments.slice(this._lastBreakableFragment + 1);
            this._fragments.splice(this._lastBreakableFragment + 1);
        }
        
        const trailingNewlines: number = this.isEmpty ? 0 : this._fragments[this._fragments.length - 1].trailingNewlines;
        const line: ParagraphLine = {
            lineNumber: this.lineNumber,
            startIndex: this.startIndex,
            endIndex: this.endIndex,
            trailingNewlines: trailingNewlines,
            trailingSpaces: this._trailingSpaces,
            spaceCount: this._spaceCount,
            hardBreak: this.isHardBreak,
            width: this.width,
            widthWithTrailingSpaces: this.widthIncludingSpace,
            left: this.alignOffset,
            height: this.height,
            baseline: this.accumulatedHeight + this.ascent,
            ascent: this.ascent,
            descent: this.descent,
            fragments: this._fragments,
            textDirection: this._paragraphDirection,
            paragraph: this.paragraph
        };
        
        for (const fragment of this._fragments) {
            fragment.line = line;
        }
        
        return line;
    }
    
    /// Creates a new [LineBuilder] to build the next line in the paragraph.
    nextLine(): LineBuilder {
        return new LineBuilder(
            this.paragraph,
            this.spanometer,
            this.maxWidth,
            this.lineNumber + 1,
            this.accumulatedHeight + this.height,
            this._fragmentsForNextLine ?? []
        );
    }
}

/// Responsible for taking measurements within spans of a paragraph.
export class Spanometer {
    readonly paragraph: ParagraphJS;
    private static _rulerHost: RulerHost = new RulerHost();
    private static _rulers: Map<TextHeightStyle, TextHeightRuler> = new Map();
    
    private _currentRuler: TextHeightRuler | null = null;
    private _currentSpan: ParagraphSpan | null = null;
    private _lastContextFont: string = '';
    
    constructor(paragraph: ParagraphJS) {
        this.paragraph = paragraph;
    }
    
    /// Clears the cache of rulers that are used for measuring text height and
    /// baseline metrics.
    static clearRulersCache(): void {
        this._rulers.forEach((ruler: TextHeightRuler, style: TextHeightStyle) => {
            ruler.dispose();
        });
        this._rulers.clear();
    }
    
    get letterSpacing(): number | null {
        return this.currentSpan.style.letterSpacing;
    }
    
    get currentSpan(): ParagraphSpan {
        if (this._currentSpan === null) {
            throw new Error('Current span is not set');
        }
        return this._currentSpan;
    }
    
    set currentSpan(span: ParagraphSpan | null) {
        // Update the font string if it's different from the last applied font
        // string.
        //
        // Also, we need to update the font string even if the span isn't changing.
        // That's because `textContext` is shared across all spanometers.
        if (span !== null) {
            const newCssFontString: string = span.style.cssFontString;
            if (this._lastContextFont !== newCssFontString) {
                this._lastContextFont = newCssFontString;
                textContext.font = newCssFontString;
            }
        }
        
        if (span === this._currentSpan) {
            return;
        }
        this._currentSpan = span;
        
        if (span === null) {
            this._currentRuler = null;
            return;
        }
        
        // Update the height ruler.
        // If the ruler doesn't exist in the cache, create a new one and cache it.
        const heightStyle: TextHeightStyle = span.style.heightStyle;
        let ruler: TextHeightRuler | undefined = Spanometer._rulers.get(heightStyle);
        if (ruler === undefined) {
            ruler = new TextHeightRuler(heightStyle, Spanometer._rulerHost);
            Spanometer._rulers.set(heightStyle, ruler);
        }
        this._currentRuler = ruler;
    }
    
    /// Whether the spanometer is ready to take measurements.
    get isReady(): boolean {
        return this._currentSpan !== null;
    }
    
    /// The distance from the top of the current span to the alphabetic baseline.
    get ascent(): number {
        if (this._currentRuler === null) {
            throw new Error('Current ruler is not set');
        }
        return this._currentRuler.alphabeticBaseline;
    }
    
    /// The distance from the bottom of the current span to the alphabetic baseline.
    get descent(): number {
        return this.height - this.ascent;
    }
    
    /// The line height of the current span.
    get height(): number {
        if (this._currentRuler === null) {
            throw new Error('Current ruler is not set');
        }
        return this._currentRuler.height;
    }
    
    measureText(text: string): number {
        return measureSubstring(textContext, text, 0, text.length);
    }
    
    measureRange(start: number, end: number): number {
        console.assert(this._currentSpan !== null);
        
        // Make sure the range is within the current span.
        console.assert(start >= this.currentSpan.start && start <= this.currentSpan.end);
        console.assert(end >= this.currentSpan.start && end <= this.currentSpan.end);
        
        return this._measure(start, end);
    }
    
    measureFragment(fragment: LayoutFragment): void {
        if (fragment.isPlaceholder) {
            const placeholder: PlaceholderSpan = fragment.span as PlaceholderSpan;
            // The ascent/descent values of the placeholder fragment will be finalized
            // later when the line is built.
            fragment.setMetrics(
                this,
                placeholder.height,
                0,
                placeholder.width,
                placeholder.width
            );
        } else {
            this.currentSpan = fragment.span;
            const widthExcludingTrailingSpaces: number = this._measure(
                fragment.start,
                fragment.end - fragment.trailingSpaces
            );
            const widthIncludingTrailingSpaces: number = this._measure(
                fragment.start,
                fragment.end - fragment.trailingNewlines
            );
            fragment.setMetrics(
                this,
                this.ascent,
                this.descent,
                widthExcludingTrailingSpaces,
                widthIncludingTrailingSpaces
            );
        }
    }
    
    /// In a continuous, unbreakable block of text from [start] to [end], finds
    /// the point where text should be broken to fit in the given [availableWidth].
    ///
    /// The [start] and [end] indices have to be within the same text span.
    ///
    /// When [allowEmpty] is true, the result is guaranteed to be at least one
    /// character after [start]. But if [allowEmpty] is false and there isn't
    /// enough [availableWidth] to fit the first character, then [start] is
    /// returned.
    ///
    /// See also:
    /// - [LineBuilder.forceBreak].
    forceBreak(start: number, end: number, availableWidth: number, allowEmpty: boolean): number {
        console.assert(this._currentSpan !== null);
        
        // Make sure the range is within the current span.
        console.assert(start >= this.currentSpan.start && start <= this.currentSpan.end);
        console.assert(end >= this.currentSpan.start && end <= this.currentSpan.end);
        
        if (availableWidth <= 0.0) {
            return allowEmpty ? start : start + 1;
        }
        
        let low: number = start;
        let high: number = end;
        while (high - low > 1) {
            const mid: number = Math.floor((low + high) / 2);
            const width: number = this._measure(start, mid);
            if (width < availableWidth) {
                low = mid;
            } else if (width > availableWidth) {
                high = mid;
            } else {
                low = high = mid;
            }
        }
        
        if (low === start && !allowEmpty) {
            low++;
        }
        return low;
    }
    
    private _measure(start: number, end: number): number {
        console.assert(this._currentSpan !== null);
        // Make sure the range is within the current span.
        console.assert(start >= this.currentSpan.start && start <= this.currentSpan.end);
        console.assert(end >= this.currentSpan.start && end <= this.currentSpan.end);
        
        return measureSubstring(
            textContext,
            this.paragraph.plainText,
            start,
            end,
            this.letterSpacing,
        );
    }
}
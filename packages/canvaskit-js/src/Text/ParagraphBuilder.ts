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
  TextDirection,
  FontWeight,
  FontStyle,
  TextFontFeatures,
  TextFontVariations,
  TextShadow,
  DecorationStyle,
  InputColor,
  Rect,
} from "canvaskit-wasm";
import { HostObject } from "../HostObject";
import { StringBuffer } from "./sb";
import { EllipsisFragment, LayoutFragment, LayoutFragmenter } from "./layout_fragmenter";
import { PaintJS } from "../Paint";
import { FontJS } from "./Font";
import { Affinity as AffinityEnums, PlaceholderAlignment as PlaceholderAlignmentEnums, TextAlign as TextAlignEnums, TextBaseline as TextBaselineEnums, TextDirection as TextDirectionEnums } from "../Core";
import { WordBreaker } from "./word_breaker";
import { ParagraphStyleJS, TextStyleJS } from "./ParagraphStyle";
import { TypefaceFontProviderJS } from "./TypefaceFont";
import { baselineRatioHack, measureSubstring, RulerHost } from "./measurement";
import { LineMetricsJS } from "./paragraph";
import { LineBreakType } from "./line_breaker";
import { FragmentFlow } from "./text_direction";
import { TextHeightRuler, TextHeightStyle } from "./ruler";
import { StyleManager } from "./style_manager";

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
  const c: HTMLCanvasElement = document.createElement("canvas")
  c.width = width
  c.height = height
  return c
}

// We don't use this canvas to draw anything, so let's make it as small as
// possible to save memory.
const textContext = createDomCanvasElement(0, 0).getContext("2d")

const placeholderChar = String.fromCharCode(0xfffc);
const scale = 1.0;


/// Represents a node in the tree of text styles pushed to [ui.ParagraphBuilder].
///
/// The [ui.ParagraphBuilder.pushText] and [ui.ParagraphBuilder.pop] operations
/// represent the entire tree of styles in the paragraph. In our implementation,
/// we don't need to keep the entire tree structure in memory. At any point in
/// time, we only need a stack of nodes that represent the current branch in the
/// tree. The items in the stack are [StyleNode] objects.
export abstract class StyleNode {
  // constructor(
  //   readonly parent: StyleNode | null,
  //   readonly style: TextStyle
  // ) { }

  /// Create a child for this style node.
  ///
  /// We are not creating a tree structure, hence there's no need to keep track
  /// of the children.
  createChild(style: TextStyle): StyleNode {
    return new ChildStyleNode(this, style);
  }

  _cachedStyle?: TextStyleJS;

  /// Generates the final text style to be applied to the text span.
  ///
  /// The resolved text style is equivalent to the entire ascendent chain of
  /// parent style nodes.
  resolveStyle(): TextStyleJS {
    return this._cachedStyle ??= new TextStyleJS({
      backgroundColor: this._backgroundColor,
      color: this._color,
      decoration: this._decoration,
      decorationColor: this._decorationColor,
      decorationThickness: this._decorationThickness,
      decorationStyle: this._decorationStyle,
      fontFamilies: [this._fontFamily],
      fontFeatures: this._fontFeatures,
      fontVariations: this._fontVariations,
      fontSize: this._fontSize,
      fontStyle: this._fontStyle,
      backgroundColor: this._backgroundColor,

      heightMultiplier: this._heightMultiplier,

      halfLeading: this._halfLeading,

      letterSpacing: this._letterSpacing,
      locale: this._locale,
      shadows: this._shadows,
      textBaseline: this._textBaseline,
      wordSpacing: this._wordSpacing,
    } as TextStyle);
  }

  abstract get _backgroundColor(): InputColor | null

  abstract get _color(): InputColor | null

  abstract get _decoration(): number | null

  abstract get _decorationColor(): InputColor | null

  abstract get _decorationStyle(): DecorationStyle | null

  abstract get _decorationThickness(): number | null

  // abstract get _fontWeight(): FontWeight | null

  abstract get _fontStyle(): FontStyle | null

  abstract get _textBaseline(): TextBaseline | null

  // abstract get _fontFamilyFallback(): string[] | null

  abstract get _fontFeatures(): TextFontFeatures[] | null

  abstract get _fontVariations(): TextFontVariations[] | null

  abstract get _fontSize(): number

  abstract get _letterSpacing(): number | null

  abstract get _wordSpacing(): number | null

  // abstract get _height(): number | null

  // abstract get _leadingDistribution(): TextLeadingDistribution | null;

  abstract get _heightMultiplier(): number | null

  abstract get _halfLeading(): boolean | null;

  abstract get _locale(): string | null;

  abstract get _foregroundColor(): InputColor | null

  abstract get _shadows(): TextShadow[] | null

  // Font family is slightly different from the other properties above. It's
  // never null on the TextStyle object, so we use `isFontFamilyProvided` to
  // check if font family is defined or not.
  abstract get _fontFamily(): string
}

export class ChildStyleNode extends StyleNode {

  constructor(readonly parent: StyleNode, readonly style: TextStyle) {
    super()
  }

  get _backgroundColor(): InputColor {
    return this.style.backgroundColor ?? this.parent._backgroundColor
  }
  get _decoration(): number {
    return this.style.decoration ?? this.parent._decoration
  }
  get _heightMultiplier(): number {
    return this.style.heightMultiplier ?? this.parent._heightMultiplier
  }
  get _halfLeading(): boolean {
    return this.style.halfLeading ?? this.parent._halfLeading
  }
  get _locale(): string {
    return this.style.locale ?? this.parent._locale
  }
  get _foregroundColor(): InputColor {
    return this.style.foregroundColor ?? this.parent._foregroundColor
  }

  // Read these properties from the TextStyle associated with this node. If the
  // property isn't defined, go to the parent node.
  get _color(): InputColor | null {
    return this.style.color ?? (this._foregroundColor == null ? this.parent._color : null);
  }

  get _decorationColor(): InputColor | null {
    return this.style.decorationColor ?? this.parent._decorationColor;
  }

  get _decorationStyle(): DecorationStyle | null {
    return this.style.decorationStyle ?? this.parent._decorationStyle;
  }

  get _decorationThickness(): number | null {
    return this.style.decorationThickness ?? this.parent._decorationThickness;
  }

  // get _fontWeight(): FontWeight | null {
  //   return this.style.fontWeight ?? this.parent._fontWeight;
  // }

  get _fontStyle(): FontStyle | null {
    return this.style.fontStyle ?? this.parent._fontStyle;
  }

  get _textBaseline(): TextBaseline | null {
    return this.style.textBaseline ?? this.parent._textBaseline;
  }

  // get _fontFamilyFallback(): string[] | null {
  //   return this.style.fontFamilyFallback ?? this.parent._fontFamilyFallback;
  // }

  get _fontFeatures(): TextFontFeatures[] | null {
    return this.style.fontFeatures ?? this.parent._fontFeatures;
  }

  get _fontVariations(): TextFontVariations[] | null {
    return this.style.fontVariations ?? this.parent._fontVariations;
  }

  get _fontSize(): number {
    return this.style.fontSize ?? this.parent._fontSize;
  }

  get _letterSpacing(): number | null {
    return this.style.letterSpacing ?? this.parent._letterSpacing;
  }

  get _wordSpacing(): number | null {
    return this.style.wordSpacing ?? this.parent._wordSpacing;
  }

  get _shadows(): TextShadow[] | null {
    return this.style.shadows ?? this.parent._shadows;
  }

  // Font family is slightly different from the other properties above. It's
  // never null on the TextStyle object, so we use `isFontFamilyProvided` to
  // check if font family is defined or not.
  get _fontFamily(): string {
    return this.style.isFontFamilyProvided ? this.style.fontFamily : this.parent._fontFamily;
  }
}
/**
* The root node of a style inheritance tree.
*/
export class RootStyleNode extends StyleNode {

  constructor(readonly paragraphStyle: ParagraphStyle) {
    super()
  }

  get _backgroundColor(): InputColor | null {
    return null
  }

  get _decoration(): number {
    return null
  }

  get _heightMultiplier(): number {
    return null
  }

  get _halfLeading(): boolean {
    return null
  }

  get _foregroundColor(): InputColor | null {
    return null
  }

  get _color(): InputColor | null {
    return null;
  }

  get _decorationColor(): InputColor | null {
    return null;
  }

  get _decorationStyle(): DecorationStyle | null {
    return null;
  }

  get _decorationThickness(): number | null {
    return null;
  }

  get _fontWeight(): FontWeight | null {
    return this.paragraphStyle.fontWeight ?? null;
  }

  get _fontStyle(): FontStyle | null {
    return this.paragraphStyle.fontStyle ?? null;
  }

  get _textBaseline(): TextBaseline | null {
    return null;
  }

  get _fontFamily(): string | null {
    return this.paragraphStyle.fontFamily ?? StyleManager.defaultFontFamily;
  }

  // get _fontFamilyFallback(): string[] | null {
  //   return null;
  // }

  get _fontFeatures(): TextFontFeatures[] | null {
    return null;
  }

  get _fontVariations(): TextFontVariations[] | null {
    return null;
  }

  get _fontSize(): number | null {
    return this.paragraphStyle.fontSize ?? StyleManager.defaultFontSize;
  }

  get _letterSpacing(): number | null {
    return null;
  }

  get _wordSpacing(): number | null {
    return null;
  }

  get _height(): number | null {
    return this.paragraphStyle.height ?? null;
  }

  // get _leadingDistribution(): TextLeadingDistribution | null {
  //   return null;
  // }

  get _locale(): string | null {
    return this.paragraphStyle.locale; //?? null;
  }

  get _shadows(): TextShadow[] | null {
    return null;
  }
}

export class ParagraphBuilderJS extends HostObject<"ParagraphBuilder"> implements CKParagraphBuilder {
  _plainTextBuf = new StringBuffer();
  style: ParagraphStyleJS;
  fontSrc: TypefaceFontProviderJS;
  _placeholderCount = 0;

  _placeholderScales: number[] = [];
  _spans: ParagraphSpan[] = [];
  _styleStack: StyleNode[] = [];

  _rootStyleNode: RootStyleNode;

  get _currentStyleNode(): StyleNode {
    return this._styleStack.length == 0 ? this._rootStyleNode : this._styleStack[this._styleStack.length - 1];
  }

  constructor(style: ParagraphStyle, fontSrc: TypefaceFontProvider) {
    super("ParagraphBuilder");
    this.style = new ParagraphStyleJS(style);
    this._rootStyleNode = new RootStyleNode(style);
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
    console.assert(!(alignment == PlaceholderAlignmentEnums.AboveBaseline ||
      alignment == PlaceholderAlignmentEnums.BelowBaseline ||
      alignment == PlaceholderAlignmentEnums.Baseline) ||
      baseline != null,
    );

    const start = this._plainTextBuf.length;
    this._plainTextBuf.append(placeholderChar);
    const end = this._plainTextBuf.length;

    const style = this._currentStyleNode.resolveStyle();
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
        baseline ?? TextBaselineEnums.Alphabetic
      )
    );
  }

  addText(text: string): void {
    const start = this._plainTextBuf.length;
    this._plainTextBuf.append(text);
    const end = this._plainTextBuf.length;

    const style = this._currentStyleNode.resolveStyle();
    // _updateCanDrawOnCanvas(style);

    this._spans.push(new ParagraphSpan(style, start, end));
  }

  build(): CKParagraph {
    if (this._spans.length == 0) {
      // In case `addText` and `addPlaceholder` were never called.
      //
      // We want the paragraph to always have a non-empty list of spans to match
      // the expectations of the [LayoutFragmenter].
      this._spans.push(new ParagraphSpan(this._rootStyleNode.resolveStyle(), 0, 0));
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
    if (this._styleStack.length != 0) {
      this._styleStack.pop();
    }
  }

  pushStyle(style: TextStyle): void {
    this._styleStack.push(this._currentStyleNode.createChild(style))
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
  implements CKParagraph {
  isLaidOut = false;
  _lastUsedConstraints: number;
  paintService: TextPaintService;

  layoutService: TextLayoutService;

  constructor(
    readonly spans: ParagraphSpan[],
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
          graphemeLayoutBounds: textBox.rect,
          graphemeClusterTextRange: range,
          dir: textBox.dir,
          isEllipsis: false,
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


  /**
   * Finds the first and last glyphs that define a word containing the glyph at index offset.
   * @param offset
   */
  getWordBoundary(offset: number): URange {
    throw new Error("not implemented")
  }

  private getWordBoundary1(position: PositionWithAffinity): URange {
    let characterPosition: number;

    switch (position.affinity) {
      case AffinityEnums.Upstream:
        characterPosition = position.pos - 1;
        break;
      case AffinityEnums.Downstream:
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

  private getLineBoundary(position: PositionWithAffinity): URange {
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
  readonly lineMetrics: LineMetricsJS;

  /// The index (inclusive) in the text where this line begins.
  readonly startIndex: number;

  /// The index (exclusive) in the text where this line ends.
  ///
  /// When the line contains an overflow, then [endIndex] goes until the end of
  /// the text and doesn't stop at the overflow cutoff.
  readonly endIndex: number;

  /// The largest visible index (exclusive) in this line.
  ///
  /// When the line contains an overflow, or is ellipsized at the end, this is
  /// the largest index that remains visible in this line. If the entire line is
  /// ellipsized, this returns [startIndex];
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
  ///
  /// The difference between [width] and [widthWithTrailingSpaces] is that
  /// [widthWithTrailingSpaces] includes trailing spaces in the width
  /// calculation while [width] doesn't.
  ///
  /// For alignment purposes for example, the [width] property is the right one
  /// to use because trailing spaces shouldn't affect the centering of text.
  /// But for placing cursors in text fields, we do care about trailing
  /// spaces so [widthWithTrailingSpaces] is more suitable.
  readonly widthWithTrailingSpaces: number;

  /// The fragments that make up this line.
  ///
  /// The fragments in the [List] are sorted by their logical order in within the
  /// line. In other words, a [LayoutFragment] in the [List] will have larger
  /// start and end indices than all [LayoutFragment]s that appear before it.
  readonly fragments: LayoutFragment[];

  /// The text direction of this line, which is the same as the paragraph's.
  readonly textDirection: TextDirection;

  /// The text to be rendered on the screen representing this line.
  readonly displayText?: string;

  /// The [CanvasParagraph] this line is part of.
  readonly paragraph: ParagraphJS;

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

    this.lineMetrics = new LineMetricsJS(
      options.startIndex,
      options.endIndex,
      options.trailingSpaces,
      options.trailingNewlines,
      options.hardBreak,
      options.ascent,
      options.descent,
      options.ascent,
      options.height,
      options.width,
      options.left,
      options.baseline,
      options.lineNumber,
    );

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
  get hardBreak(): boolean { return this.lineMetrics.isHardBreak; }
  get ascent(): number { return this.lineMetrics.ascent; }
  get descent(): number { return this.lineMetrics.descent; }
  // get unscaledAscent(): number { return this.lineMetrics.unscaledAscent; }
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
    const domSegmenter = new Intl.Segmenter([], { granularity: 'grapheme' }) //createIntlSegmenter({ granularity: 'grapheme' });
    const graphemeStarts = [];
    const segments = domSegmenter.segment(fragmentText)[Symbol.iterator]();
    for (let result = segments.next(); !result.done; result = segments.next()) {
      graphemeStarts.push(result.value.index + this.startIndex);
    }
    console.assert(graphemeStarts.length === 0 || graphemeStarts[0] === this.startIndex);
    return graphemeStarts;
  }

  private _breakTextIntoGraphemes(text: string): number[] {
    const graphemeStarts = Intl.Segmenter == null ? this._fallbackGraphemeStartIterable(text) : this._fromDomSegmenter(text);
    // Add the end index of the fragment to the list if the text is not empty.
    if (graphemeStarts.length > 0) {
      graphemeStarts.push(this.visibleEndIndex);
    }
    return graphemeStarts;
  }

  /// This List contains an ascending sequence of UTF16 offsets that points to
  /// grapheme starts within the line. Each UTF16 offset is relative to the
  /// start of the paragraph, instead of the start of the line.
  ///
  /// For example, `graphemeStarts[n]` gives the UTF16 offset of the `n`-th
  /// grapheme in the line.
  private _graphemeStarts?: number[] = null;
  get graphemeStarts(): number[] {
    return this._graphemeStarts ??= this.visibleEndIndex === this.startIndex
      ? []
      : this._breakTextIntoGraphemes(this.paragraph.plainText.substring(this.startIndex, this.visibleEndIndex));
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
  // getHashCode(): number {
  //   return this._hashObjects([
  //     this.lineMetrics,
  //     this.startIndex,
  //     this.endIndex,
  //     this.trailingNewlines,
  //     this.trailingSpaces,
  //     this.spaceCount,
  //     this.widthWithTrailingSpaces,
  //     this.fragments,
  //     this.textDirection,
  //     this.displayText
  //   ]);
  // }

  // private _hashObjects(objects: any[]): number {
  //   // 简化的哈希实现
  //   let hash = 0;
  //   for (const obj of objects) {
  //     hash = ((hash << 5) - hash) + this._getObjectHash(obj);
  //     hash |= 0; // 转换为32位整数
  //   }
  //   return hash;
  // }

  // private _getObjectHash(obj: any): number {
  //   if (obj === null || obj === undefined) return 0;
  //   if (typeof obj === 'number') return obj;
  //   if (typeof obj === 'string') return this._stringHash(obj);
  //   if (typeof obj === 'boolean') return obj ? 1 : 0;
  //   if (Array.isArray(obj)) return this._hashObjects(obj);
  //   if (typeof obj === 'object' && obj.hashCode) return obj.hashCode();
  //   return 0;
  // }

  // private _stringHash(str: string): number {
  //   let hash = 0;
  //   for (let i = 0; i < str.length; i++) {
  //     const char = str.charCodeAt(i);
  //     hash = ((hash << 5) - hash) + char;
  //     hash |= 0;
  //   }
  //   return hash;
  // }

  // equals equivalent
  // equals(other: any): boolean {
  //   if (this === other) {
  //     return true;
  //   }
  //   if (other === null || typeof other !== 'object' || !(other instanceof ParagraphLine)) {
  //     return false;
  //   }

  //   return this.lineMetrics === other.lineMetrics &&
  //     this.startIndex === other.startIndex &&
  //     this.endIndex === other.endIndex &&
  //     this.trailingNewlines === other.trailingNewlines &&
  //     this.trailingSpaces === other.trailingSpaces &&
  //     this.spaceCount === other.spaceCount &&
  //     this.widthWithTrailingSpaces === other.widthWithTrailingSpaces &&
  //     this.fragments === other.fragments &&
  //     this.textDirection === other.textDirection &&
  //     this.displayText === other.displayText;
  // }

  toString(): string {
    return `ParagraphLine(${this.startIndex}, ${this.endIndex}, ${JSON.stringify(this.lineMetrics)})`;
  }
}

export class TextPaintService {
  constructor(readonly paragraph: ParagraphJS) { }

  paint(canvas: Canvas, x: number, y: number) {
    // Loop through all the lines, for each line, loop through all fragments and
    // paint them. The fragment objects have enough information to be painted
    // individually.
    const paint = new PaintJS();
    const font = new FontJS();
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
    const backgroundColor = fragment.style.backgroundColor; //as SurfacePaint?;
    // paint.setColor(backgroundColor)

    if (backgroundColor != null) {
      const paint = new CanvasKit.Paint()
      paint.setColor(backgroundColor)
      const rc = fragment.toPaintingTextBox().rect;
      const l = rc[0]
      const t = rc[1]
      const r = rc[2]
      const b = rc[3]
      // if (!rect.isEmpty) {
      if (!((l == r) && (t == b))) {
        const rr = [l + x, t + y, r + x, b + y] // rect.shift(offset)
        canvas.drawRect(rr, paint);
      }
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

    const fragmentX = fragment.textDirection == TextDirectionEnums.LTR ? fragment.left : fragment.right;

    const _x = x + line.left + fragmentX;
    const _y = y + line.baseline;
    const text = fragment.getText(this.paragraph);
    const paint = new PaintJS();
    // paint.setColor(CanvasKit.CYAN);
    const font = new FontJS();
    canvas.drawText(text, _x, _y, paint, font)
    // canvas.tearDownPaint
  }

  _prepareCanvasForFragment(canvas: Canvas, fragment: LayoutFragment) { }
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

  /// The bounds that contain the text painted inside this paragraph.
  _paintBounds: Rect = Float32Array.of(0, 0, 0, 0);
  get paintBounds(): Rect {
    return this._paintBounds
  }

  spanometer: Spanometer;

  layoutFragmenter: LayoutFragmenter;

  constructor(readonly paragraph: ParagraphJS) {
    this.spanometer = new Spanometer(paragraph);
    this.layoutFragmenter = new LayoutFragmenter(paragraph.plainText, paragraph.spans);
  }

  performLayout(width: number) {
    this.width = width;
    this.height = 0.0;
    this.longestLine = null;
    this.minIntrinsicWidth = 0.0;
    this.maxIntrinsicWidth = 0.0;
    this.didExceedMaxLines = false;
    this.lines.length = 0

    let currentLine = LineBuilder.first(this.paragraph, this.spanometer, this.width);

    const fragments = this.layoutFragmenter.fragment();
    fragments.forEach((fragment) => this.spanometer.measureFragment(fragment));

    outerLoop:
    for (let i = 0; i < fragments.length; i++) {
      const fragment = fragments[i];
      currentLine.addFragment(fragment);

      while (currentLine.isOverflowing) {
        if (currentLine.canHaveEllipsis) {
          currentLine.insertEllipsis();
          this.lines.push(currentLine.build());
          this.didExceedMaxLines = true;
          break outerLoop;
        }

        if (currentLine.isBreakable) {
          currentLine.revertToLastBreakOpportunity();
        } else {
          // The line can't be legally broken, so the last fragment (that caused
          // the line to overflow) needs to be force-broken.
          currentLine.forceBreakLastFragment();
        }

        i += currentLine.appendZeroWidthFragments(fragments, i + 1);
        this.lines.push(currentLine.build());
        currentLine = currentLine.nextLine();
      }

      if (currentLine.isHardBreak) {
        this.lines.push(currentLine.build());
        currentLine = currentLine.nextLine();
      }
    }

    const maxLines = this.paragraph.paragraphStyle.maxLines;
    if (maxLines !== undefined && this.lines.length > maxLines) {
      this.didExceedMaxLines = true;
      // removeRange in Dart removes elements from start (inclusive) to end (exclusive)
      // In JS/TS, we can use splice
      this.lines.splice(maxLines, this.lines.length - maxLines);
    }

    // ***************************************************************** //
    // *** PARAGRAPH BASELINE & HEIGHT & LONGEST LINE & PAINT BOUNDS *** //
    // ***************************************************************** //

    let boundsLeft = Number.POSITIVE_INFINITY; // double.infinity
    let boundsRight = Number.NEGATIVE_INFINITY; // double.negativeInfinity
    for (const line of this.lines) {
      this.height += line.height;
      if (this.alphabeticBaseline === -1.0) {
        this.alphabeticBaseline = line.baseline;
        this.ideographicBaseline = this.alphabeticBaseline * baselineRatioHack;
      }
      const longestLineWidth: number = this.longestLine?.width ?? 0.0;
      if (longestLineWidth < line.width) {
        this.longestLine = line;
      }

      const left: number = line.left;
      if (left < boundsLeft) {
        boundsLeft = left;
      }
      const right: number = left + line.width;
      if (right > boundsRight) {
        boundsRight = right;
      }
    }
    // 假设 ui.Rect.fromLTRB 是可用的工厂方法
    this._paintBounds = Float32Array.of(boundsLeft, 0, boundsRight, this.height) //   Rect.fromLTRB(boundsLeft, 0, boundsRight, this.height);

    // **************************** //
    // *** FRAGMENT POSITIONING *** //
    // **************************** //

    // We have to perform justification alignment first so that we can position
    // fragments correctly later.
    if (this.lines.length > 0) {
      const shouldJustifyParagraph =
        isFinite(this.width) && this.paragraph.paragraphStyle.textAlign === TextAlignEnums.Justify;

      if (shouldJustifyParagraph) {
        // Don't apply justification to the last line.
        for (let i = 0; i < this.lines.length - 1; i++) {
          for (const fragment of this.lines[i].fragments) {
            fragment.justifyTo(this.width);
          }
        }
      }
    }

    this.lines.forEach((line) => this._positionLineFragments(line));

    // ******************************** //
    // *** MAX/MIN INTRINSIC WIDTHS *** //
    // ******************************** //

    // TODO(mdebbar): Handle maxLines https://github.com/flutter/flutter/issues/91254

    let runningMinIntrinsicWidth: number = 0;
    let runningMaxIntrinsicWidth: number = 0;

    for (const fragment of fragments) {
      runningMinIntrinsicWidth += fragment.widthExcludingTrailingSpaces;
      // Max intrinsic width includes the width of trailing spaces.
      runningMaxIntrinsicWidth += fragment.widthIncludingTrailingSpaces;

      switch (fragment.type) {
        case LineBreakType.prohibited:
          break;

        case LineBreakType.opportunity:
          this.minIntrinsicWidth = Math.max(this.minIntrinsicWidth, runningMinIntrinsicWidth);
          runningMinIntrinsicWidth = 0;
          break;

        case LineBreakType.mandatory:
        case LineBreakType.endOfText:
          this.minIntrinsicWidth = Math.max(this.minIntrinsicWidth, runningMinIntrinsicWidth);
          this.maxIntrinsicWidth = Math.max(this.maxIntrinsicWidth, runningMaxIntrinsicWidth);
          runningMinIntrinsicWidth = 0;
          runningMaxIntrinsicWidth = 0;
          break;
      }
    }
  }

  get _paragraphDirection() {
    return this.paragraph.paragraphStyle.effectiveTextDirection;
  }

  /// Positions the fragments taking into account their directions and the
  /// paragraph's direction.
  _positionLineFragments(line: ParagraphLine): void {
    let previousDirection = this._paragraphDirection;

    let startOffset: number = 0.0;
    let sandwichStart: number | null = null; // Dart 的 int? 对应 TS 的 number | null
    let sequenceStart: number = 0;

    for (let i = 0; i <= line.fragments.length; i++) {
      if (i < line.fragments.length) {
        const fragment = line.fragments[i];

        if (fragment.fragmentFlow === FragmentFlow.previous) {
          sandwichStart = null;
          continue;
        }
        if (fragment.fragmentFlow === FragmentFlow.sandwich) {
          sandwichStart ??= i;
          continue;
        }

        if (!(fragment.fragmentFlow === FragmentFlow.ltr || fragment.fragmentFlow === FragmentFlow.rtl)) {
          console.error("Assertion failed: fragment.fragmentFlow is not ltr or rtl");
          // 或者 throw new Error(...);
          continue; // 或根据策略处理
        }

        const currentDirection = fragment.fragmentFlow === FragmentFlow.ltr ? TextDirectionEnums.LTR : TextDirectionEnums.RTL;

        if (currentDirection === previousDirection) {
          sandwichStart = null;
          continue;
        }
      }

      // We've reached a fragment that'll flip the text direction. Let's
      // position the sequence that we've been traversing.

      if (sandwichStart === null) {
        // Position fragments in range [sequenceStart:i)
        startOffset += this._positionFragmentRange({
          line: line,
          start: sequenceStart,
          end: i,
          direction: previousDirection,
          startOffset: startOffset,
        });
      } else {
        // Position fragments in range [sequenceStart:sandwichStart)
        startOffset += this._positionFragmentRange({
          line: line,
          start: sequenceStart,
          end: sandwichStart,
          direction: previousDirection,
          startOffset: startOffset,
        });
        // Position fragments in range [sandwichStart:i)
        startOffset += this._positionFragmentRange({
          line: line,
          start: sandwichStart,
          end: i,
          direction: this._paragraphDirection,
          startOffset: startOffset,
        });
      }

      sequenceStart = i;
      sandwichStart = null;

      if (i < line.fragments.length) {
        previousDirection = line.fragments[i].textDirection!;
      }
    }
  }

  /**
   * 定位一行中指定范围内的片段。
   * @param args 包含行、起始索引、结束索引、方向和起始偏移量的对象。
   * @returns 范围内所有片段的总宽度。
   */
  _positionFragmentRange(args: {
    line: ParagraphLine;
    start: number;
    end: number;
    direction: TextDirection;
    startOffset: number;
  }): number {
    const { line, start, end, direction, startOffset } = args;

    console.assert(start <= end, "Assertion failed: start > end in _positionFragmentRange")
    let cumulativeWidth: number = 0.0;

    // The bodies of the two for loops below must remain identical. The only
    // difference is the looping direction. One goes from start to end, while
    // the other goes from end to start.

    if (direction === this._paragraphDirection) {
      for (let i = start; i < end; i++) {
        cumulativeWidth += this._positionOneFragment(line, i, startOffset + cumulativeWidth, direction);
      }
    } else {
      for (let i = end - 1; i >= start; i--) {
        cumulativeWidth += this._positionOneFragment(line, i, startOffset + cumulativeWidth, direction);
      }
    }

    return cumulativeWidth;
  }

  /**
   * 定位单个片段。
   * @param line 片段所在的行。
   * @param i 片段在行片段数组中的索引。
   * @param startOffset 片段的起始 X 偏移量。
   * @param direction 片段的文本方向。
   * @returns 片段的宽度（包括尾随空格）。
   */
  _positionOneFragment(
    line: ParagraphLine,
    i: number,
    startOffset: number,
    direction: TextDirection
  ): number {
    const fragment = line.fragments[i];
    fragment.setPosition(startOffset, direction);
    return fragment.widthIncludingTrailingSpaces;
  }

  /**
   * 获取段落中所有占位符的 TextBox 列表。
   * @returns 包含占位符 TextBox 的数组。
   */
  getBoxesForPlaceholders(): RectWithDirection[] {
    const boxes = [];
    for (const line of this.lines) {
      for (const fragment of line.fragments) {
        if (fragment.isPlaceholder) {
          boxes.push(fragment.toTextBox());
        }
      }
    }
    return boxes;
  }

  /**
   * 获取指定文本范围的 TextBox 列表。
   * @param start 范围的起始索引（包含）。
   * @param end 范围的结束索引（不包含）。
   * @param boxHeightStyle 高度样式（假设已定义）。
   * @param boxWidthStyle 宽度样式（假设已定义）。
   * @returns 包含范围 TextBox 的数组。
   */
  getBoxesForRange(
    start: number,
    end: number,
    // boxHeightStyle: BoxHeightStyle,
    // boxWidthStyle: BoxWidthStyle
  ): RectWithDirection[] {
    // Zero-length ranges and invalid ranges return an empty list.
    if (start >= end || start < 0 || end < 0) {
      return [];
    }

    const length = this.paragraph.plainText.length;
    // Ranges that are out of bounds should return an empty list.
    if (start > length || end > length) {
      return [];
    }

    const boxes = [];

    for (const line of this.lines) {
      if (line.overlapsWith(start, end)) {
        for (const fragment of line.fragments) {
          // 假设 LayoutFragment 有 isPlaceholder 和 overlapsWith 方法/属性
          if (!fragment.isPlaceholder && fragment.overlapsWith(start, end)) {
            boxes.push(fragment.toTextBox(start, end));
          }
        }
      }
    }
    return boxes;
  }

  /**
   * 根据给定的偏移量获取对应的文本位置。
   * @param offset 偏移量。
   * @returns 对应的 TextPosition。
   */
  getPositionForOffset(dx: number, dy: number): PositionWithAffinity /*ui.TextPosition*/ {
    // After layout, each line has boxes that contain enough information to make
    // it possible to do hit testing. Once we find the box, we look inside that
    // box to find where exactly the `offset` is located.
    const line = this._findLineForY(dy);
    if (line === null) {
      return { pos: 0, affinity: AffinityEnums.Downstream };
    }
    // [offset] is to the left of the line.
    if (dx <= line.left) {
      return { pos: line.startIndex, affinity: AffinityEnums.Downstream };
      // return new ui.TextPosition({ offset: line.startIndex });
    }

    // [offset] is to the right of the line.
    if (dx >= line.left + line.widthWithTrailingSpaces) {
      return { pos: line.endIndex - line.trailingNewlines, affinity: AffinityEnums.Upstream };
      // return new ui.TextPosition({
      //     offset: line.endIndex - line.trailingNewlines,
      //     affinity: ui.TextAffinity.upstream,
      // });
    }

    const _dx = dx - line.left;
    for (const fragment of line.fragments) {
      if (fragment.left <= _dx && _dx <= fragment.right) {
        return fragment.getPositionForX(_dx - fragment.left);
      }
    }
    // Is this ever reachable?
    return { pos: line.startIndex, affinity: AffinityEnums.Downstream };
  }

  /**
   * 获取给定偏移量处最接近的字形信息。
   * @param offset 偏移量。
   * @returns 最接近的 GlyphInfo，如果找不到则返回 null。
   */
  getClosestGlyphInfo(dx: number, dy: number): GlyphInfo | null {
    const line: ParagraphLine | null = this._findLineForY(dy);
    if (line === null) {
      return null;
    }
    const fragment: LayoutFragment | null = line.closestFragmentAtOffset(dx - line.left);
    if (fragment === null) {
      return null;
    }

    const closestGraphemeStartInFragment =
      !fragment.hasLeadingBrokenGrapheme ||
      dx <= fragment.line.left ||
      fragment.line.left + fragment.line.width <= dx ||
      (() => {
        switch (fragment.textDirection!) { // 非空断言
          // If dx is closer to the trailing edge, no need to check other fragments.
          case TextDirectionEnums.LTR:
            return dx >= fragment.line.left + (fragment.left + fragment.right) / 2;
          case TextDirectionEnums.RTL:
            return dx <= fragment.line.left + (fragment.left + fragment.right) / 2;
          default:
            // 处理意外的 direction 值
            return false;
        }
      })();

    const candidate1 = fragment.getClosestCharacterBox(dx);
    if (closestGraphemeStartInFragment) {
      return candidate1;
    }

    const searchLeft = (() => {
      switch (fragment.textDirection!) {
        case TextDirectionEnums.LTR:
          return true;
        case TextDirectionEnums.RTL:
          return false;
        default:
          return true;
      }
    })();

    const candidate2 = fragment.line
      .closestFragmentTo(fragment, searchLeft)
      ?.getClosestCharacterBox(dx);

    if (candidate2 === null) {
      return candidate1;
    }

    const distance1: number = Math.min(
      Math.abs(candidate1.graphemeClusterTextRange.start - dx),
      Math.abs(candidate1.graphemeClusterTextRange.end - dx),
    );
    const distance2: number = Math.min(
      Math.abs(candidate2.graphemeClusterTextRange.start - dx),
      Math.abs(candidate2.graphemeClusterTextRange.end - dx),
    );
    return distance2 > distance1 ? candidate1 : candidate2;
  }

  /**
   * 根据 Y 坐标查找对应的行。
   * @param y Y 坐标。
   * @returns 对应的 ParagraphLine，如果未找到则返回 null。
   */
  _findLineForY(y: number): ParagraphLine | null {
    if (this.lines.length === 0) {
      return null;
    }
    // We could do a binary search here but it's not worth it because the number
    // of line is typically low, and each iteration is a cheap comparison of
    // doubles.
    for (const line of this.lines) {
      if (y <= line.height) {
        return line;
      }
      y -= line.height;
    }
    return this.lines[this.lines.length - 1];
  }

}

export class ParagraphSpan {
  constructor(
    readonly style: TextStyleJS,
    readonly start: number,
    readonly end: number
  ) { }
}

/// Holds information for a placeholder in a paragraph.
///
/// [width], [height] and [baselineOffset] are expected to be already scaled.
export class ParagraphPlaceholder extends ParagraphSpan {
  /// The scaled width of the placeholder.
  width: number;

  /// The scaled height of the placeholder.
  height: number;

  /// Specifies how the placeholder rectangle will be vertically aligned with
  /// the surrounding text.
  alignment: PlaceholderAlignment;

  /// When the [alignment] value is [ui.PlaceholderAlignment.baseline], the
  /// [baselineOffset] indicates the distance from the baseline to the top of
  /// the placeholder rectangle.
  baselineOffset: number;

  /// Dictates whether to use alphabetic or ideographic baseline.
  baseline: TextBaseline;

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
    const textAlign = this.paragraph.paragraphStyle.textAlign // effectiveTextAlign;
    const paragraphDirection = this._paragraphDirection;

    switch (textAlign) {
      case TextAlignEnums.Center:
        return emptySpace / 2.0;
      case TextAlignEnums.Right:
        return emptySpace;
      case TextAlignEnums.Start:
        return paragraphDirection === TextDirectionEnums.RTL ? emptySpace : 0.0;
      case TextAlignEnums.End:
        return paragraphDirection === TextDirectionEnums.RTL ? 0.0 : emptySpace;
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
    return this.paragraph.paragraphStyle.textDirection // effectiveTextDirection;
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
    let textMidPoint: number, placeholderMidPoint: number, diff: number;
    switch (placeholder.alignment) {
      case PlaceholderAlignmentEnums.Top:
        // The placeholder is aligned to the top of text, which means it has the
        // same `ascent` as the remaining text. We only need to extend the
        // `descent` enough to fit the placeholder.
        ascent = this.ascent;
        descent = placeholder.height - this.ascent;
        break;

      case PlaceholderAlignmentEnums.Bottom:
        // The opposite of `top`. The `descent` is the same, but we extend the
        // `ascent`.
        ascent = placeholder.height - this.descent;
        descent = this.descent;
        break;

      case PlaceholderAlignmentEnums.Middle:
        textMidPoint = this.height / 2
        placeholderMidPoint = placeholder.height / 2
        diff = placeholderMidPoint - textMidPoint
        ascent = this.ascent + diff;
        descent = this.descent + diff;
        break;

      case PlaceholderAlignmentEnums.AboveBaseline:
        ascent = placeholder.height;
        descent = 0.0;
        break;

      case PlaceholderAlignmentEnums.BelowBaseline:
        ascent = 0.0;
        descent = placeholder.height;
        break;

      case PlaceholderAlignmentEnums.Baseline:
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

    const lastFragment = this._fragments[this._fragments.length - 1];
    this.forceBreakLastFragment(availableWidth, true);

    const ellipsisFragment = new EllipsisFragment(this.endIndex, lastFragment.span)
    // start: this.endIndex,
    // end: this.endIndex,
    // trailingSpaces: 0,
    // trailingNewlines: 0,
    // widthExcludingTrailingSpaces: ellipsisWidth,
    // widthIncludingTrailingSpaces: ellipsisWidth,
    // ascent: lastFragment.ascent,
    // descent: lastFragment.descent,
    // span: lastFragment.span,
    // isBreak: false,
    // isHardBreak: false,
    // isSpaceOnly: false,
    // isPlaceholder: false,
    // split: (breakingPoint: number) => [null, null],
    ellipsisFragment.setMetrics(
      this.spanometer, lastFragment.ascent, lastFragment.descent, ellipsisWidth, ellipsisWidth)

    //   ascent: number,
    //   descent: number,
    //   widthExcludingTrailingSpaces: number,
    //   widthIncludingTrailingSpaces: number
    // ) => {
    //   // 实现设置度量的逻辑
    // }
    // } as LayoutFragment;

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
    const line = new ParagraphLine({
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
    });

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
///
/// Can't perform measurements across spans. To measure across spans, multiple
/// measurements have to be taken.
///
/// Before performing any measurement, the [currentSpan] has to be set. Once
/// it's set, the [Spanometer] updates the underlying [context] so that
/// subsequent measurements use the correct styles.
export class Spanometer {
  readonly paragraph: ParagraphJS;
  private static _rulerHost = new RulerHost();
  private static _rulers: Map<TextHeightStyle, TextHeightRuler> = new Map();

  private _currentRuler?: TextHeightRuler = null;
  private _currentSpan?: ParagraphSpan = null;
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
    const heightStyle = span.style.heightStyle;
    let ruler = Spanometer._rulers.get(heightStyle);
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
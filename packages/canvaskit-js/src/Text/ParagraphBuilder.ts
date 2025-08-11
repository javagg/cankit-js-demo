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
} from "canvaskit-wasm";
import { HostObject } from "../HostObject";

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

export class ParagraphBuilderJS extends HostObject<"ParagraphBuilder"> implements CKParagraphBuilder {
    constructor(readonly style: ParagraphStyle, fontSrc: TypefaceFontProvider) {
        super("ParagraphBuilder")
    }

    addPlaceholder(width?: number, height?: number, alignment?: PlaceholderAlignment, baseline?: TextBaseline, offset?: number): void {
        throw new Error("Method not implemented.");
    }

    addText(str: string): void {
        // throw new Error("Method not implemented.");
    }
    build(): CKParagraph {
        // throw new Error("Method not implemented.");
        return new ParagraphJS()
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
    pushStyle(text: TextStyle): void {
        throw new Error("Method not implemented.");
    }
    pushPaintStyle(textStyle: TextStyle, fg: Paint, bg: Paint): void {
        throw new Error("Method not implemented.");
    }
    reset(): void {
        throw new Error("Method not implemented.");
    }
    _type: "ParagraphBuilder";
    delete(): void {
        throw new Error("Method not implemented.");
    }
    deleteLater(): void {
        throw new Error("Method not implemented.");
    }
    isAliasOf(other: any): boolean {
        throw new Error("Method not implemented.");
    }
    isDeleted(): boolean {
        throw new Error("Method not implemented.");
    }
}

export class ParagraphJS extends HostObject<"Paragraph"> implements CKParagraph {
    constructor() {
        super("Paragraph")
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
        throw new Error("Method not implemented.");
    }
    getGlyphInfoAt(index: number): GlyphInfo | null {
        throw new Error("Method not implemented.");
    }
    getHeight(): number {
        throw new Error("Method not implemented.");
    }
    getIdeographicBaseline(): number {
        throw new Error("Method not implemented.");
    }
    getLineNumberAt(index: number): number {
        throw new Error("Method not implemented.");
    }
    getLineMetrics(): LineMetrics[] {
        throw new Error("Method not implemented.");
    }
    getLineMetricsAt(lineNumber: number): LineMetrics | null {
        throw new Error("Method not implemented.");
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
        throw new Error("Method not implemented.");
    }
    getRectsForPlaceholders(): RectWithDirection[] {
        throw new Error("Method not implemented.");
    }
    getRectsForRange(start: number, end: number, hStyle: RectHeightStyle, wStyle: RectWidthStyle): RectWithDirection[] {
        throw new Error("Method not implemented.");
    }
    getWordBoundary(offset: number): URange {
        throw new Error("Method not implemented.");
    }
    getShapedLines(): ShapedLine[] {
        throw new Error("Method not implemented.");
    }
    layout(width: number): void {
        throw new Error("Method not implemented.");
    }
    unresolvedCodepoints(): number[] {
        throw new Error("Method not implemented.");
    }
    _type: "Paragraph";
    delete(): void {
        throw new Error("Method not implemented.");
    }
    deleteLater(): void {
        throw new Error("Method not implemented.");
    }
    isAliasOf(other: any): boolean {
        throw new Error("Method not implemented.");
    }
    isDeleted(): boolean {
        throw new Error("Method not implemented.");
    }

}
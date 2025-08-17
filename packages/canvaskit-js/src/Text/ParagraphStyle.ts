import type {
  ParagraphStyle as CKParagraphStyle,
  TextStyle as CKTextStyle,
  StrutStyle as CKStrutStyle,
  FontStyle,
  TextAlign,
  TextDirection,
  TextHeightBehavior,
  InputColor,
  DecorationStyle,
  TextFontFeatures,
  TextFontVariations,
  TextShadow,
  TextBaseline,
} from "canvaskit-wasm";
import { HostObject } from "../HostObject";

// export function TextStyle(style: CKTextStyle) {
//   return style;
// }

// export const ParagraphStyle = (style: CKParagraphStyle) => {
//   return style;
// };

export class TextStyleJS
  extends HostObject<"TextStyle">
  implements CKTextStyle {
  /**
   * Fills out all optional fields with defaults. The emscripten bindings complain if there
   * is a field undefined and it was expecting a float (for example).
   * @param ts
   */
  constructor(style: CKTextStyle) {
    super("TextStyle");
    this.backgroundColor = style.backgroundColor
    this.color = style.color
    this.decoration = style.decoration
    this.decorationColor = style.decorationColor
    this.decorationThickness = style.decorationThickness
    this.decorationStyle = style.decorationStyle
    this.fontFamilies = style.fontFamilies
    this.fontFeatures = style.fontFeatures
    this.fontSize = style.fontSize
    this.fontStyle = style.fontStyle
    this.fontVariations = style.fontVariations
    this.foregroundColor = style.foregroundColor
    this.heightMultiplier = style.heightMultiplier
    this.halfLeading = style.halfLeading
    this.letterSpacing = style.letterSpacing
    this.locale = style.locale
    this.shadows = style.shadows
    this.textBaseline = style.textBaseline;
    this.wordSpacing = style.wordSpacing
  }

  backgroundColor?: InputColor;
  color?: InputColor;
  decoration?: number;
  decorationColor?: InputColor;
  decorationThickness?: number;
  decorationStyle?: DecorationStyle;
  fontFamilies?: string[];
  fontFeatures?: TextFontFeatures[];
  fontSize?: number;
  fontStyle?: FontStyle;
  fontVariations?: TextFontVariations[];
  foregroundColor?: InputColor;
  heightMultiplier?: number;
  halfLeading?: boolean;
  letterSpacing?: number;
  locale?: string;
  shadows?: TextShadow[];
  textBaseline?: TextBaseline;
  wordSpacing?: number;
}

export class ParagraphStyleJS
  extends HostObject<"ParagraphStyle">
  implements CKParagraphStyle {

  /**
   * Fills out all optional fields with defaults. The emscripten bindings complain if there
   * is a field undefined and it was expecting a float (for example).
   * @param ps
   */
  constructor(style: CKParagraphStyle) {
    super("ParagraphStyle");
    this.disableHinting = style.disableHinting
    this.ellipsis = style.ellipsis
    this.heightMultiplier = style.heightMultiplier
    this.maxLines = style.maxLines
    this.replaceTabCharacters = style.replaceTabCharacters
    this.strutStyle = style.strutStyle
    this.textAlign = style.textAlign
    this.textDirection = style.textDirection
    this.textHeightBehavior = style.textHeightBehavior
    this.textStyle = style.textStyle
    this.applyRoundingHack = style.applyRoundingHack
  }
  disableHinting?: boolean;
  ellipsis?: string;
  heightMultiplier?: number;
  maxLines?: number;
  replaceTabCharacters?: boolean;
  strutStyle?: CKStrutStyle;
  textAlign?: TextAlign;
  textDirection?: TextDirection;
  textHeightBehavior?: TextHeightBehavior;
  textStyle?: CKTextStyle;
  applyRoundingHack?: boolean;
}


export class StrutStyleJS
  extends HostObject<"StrutStyle">
  implements CKStrutStyle {
  constructor() {
    super("StrutStyle");
  }
  strutEnabled?: boolean;
  fontFamilies?: string[];
  fontStyle?: FontStyle;
  fontSize?: number;
  heightMultiplier?: number;
  halfLeading?: boolean;
  leading?: number;
  forceStrutHeight?: boolean;
}

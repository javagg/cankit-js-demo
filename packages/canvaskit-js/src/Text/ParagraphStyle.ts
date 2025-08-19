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
import { TextHeightStyle } from "./ruler";
import { StyleManager } from "./style_manager";

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

  height?: number;


  private _heightStyle?: TextHeightStyle;
  get heightStyle(): TextHeightStyle {
    return this._heightStyle ??=  this._createHeightStyle();
  }
  private _createHeightStyle(): TextHeightStyle {
    return new TextHeightStyle(
      this.effectiveFontFamily,
      this.fontSize ?? StyleManager.defaultFontSize,
      this.height,
      // TODO(mdebbar): Pass the actual value when font features become supported
      //                https://github.com/flutter/flutter/issues/64595
      null,
      null,
    );
  }

  private static readonly _testFonts: string[] = ['FlutterTest', 'Ahem'];

  get effectiveFontFamily(): string {
    let result = this.fontFamilies[0] || StyleManager.defaultFontFamily;
    // 只在开发模式下执行断言逻辑（模拟 Dart 的 assert(() { ... }()) 行为）
    // (() => {
    //   if (
    //     (window as any).ui_web?.debugEmulateFlutterTesterEnvironment &&
    //     !YourClass._testFonts.includes(result)
    //   ) {
    //     result = YourClass._testFonts[0]; // 使用第一个测试字体
    //   }
    //   return true;
    // })();

    return result;
  }
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

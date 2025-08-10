import type {
  ParagraphStyle as CKParagraphStyle,
  TextStyle as CKTextStyle,
} from "canvaskit-wasm";
import { HostObject } from "../HostObject";

// export function TextStyle(style: CKTextStyle) {
//   return style;
// }

// export const ParagraphStyle = (style: CKParagraphStyle) => {
//   return style;
// };

export class TextStyle extends HostObject<"TextStyle"> implements CKTextStyle {
  constructor(readonly style: CKTextStyle) {
    super("TextStyle");
  }
}

export class ParagraphStyle extends HostObject<"ParagraphStyle"> implements CKParagraphStyle {
  constructor(readonly style: CKParagraphStyle) {
    super("ParagraphStyle");
  }
}

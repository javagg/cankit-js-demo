import { LineMetrics } from "canvaskit-wasm";
import { HostObject } from "../HostObject";

export class LineMetricsJS extends HostObject<"LineMetrics"> implements LineMetrics {
    constructor(
        readonly startIndex: number,
        readonly endIndex: number,
        readonly endExcludingWhitespaces: number,
        readonly endIncludingNewline: number,
        readonly isHardBreak: boolean, /* hardBreak */
        readonly ascent: number,
        readonly descent: number,
        readonly unscaledAscent: number,
        readonly height: number,
        readonly width: number,
        readonly left: number,
        readonly baseline: number,
        readonly lineNumber: number,
    ) {
        super("LineMetrics")
     }



    // /**
    //  * Creates a copy of this metrics with the given fields replaced.
    //  */
    // copyWith(fields: Partial<LineMetrics>): LineMetricsJS {
    //     return new LineMetricsJS(
    //         fields.startIndex ?? this.startIndex,
    //         fields.endIndex ?? this.endIndex,
    //         fields.hardBreak ?? this.hardBreak,
    //         fields.ascent ?? this.ascent,
    //         fields.descent ?? this.descent,
    //         fields.unscaledAscent ?? this.unscaledAscent,
    //         fields.height ?? this.height,
    //         fields.width ?? this.width,
    //         fields.left ?? this.left,
    //         fields.baseline ?? this.baseline,
    //         fields.lineNumber ?? this.lineNumber,
    //     );
    // }
}

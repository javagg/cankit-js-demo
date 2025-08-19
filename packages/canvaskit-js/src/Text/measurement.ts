// TODO(yjbanov): this is a hack we use to compute ideographic baseline; this
//                number is the ratio ideographic/alphabetic for font Ahem,
//                which matches the Flutter number. It may be completely wrong
//                for any other font. We'll need to eventually fix this. That
//                said Flutter doesn't seem to use ideographic baseline for
//                anything as of this writing.
export const baselineRatioHack = 1.1662499904632568;

/// Hosts ruler DOM elements in a hidden container under [DomManager.renderingHost].
export class RulerHost {
    /// Hosts a cache of rulers that measure text.
    ///
    /// This element exists purely for organizational purposes. Otherwise the
    /// rulers would be attached to the `<body>` element polluting the element
    /// tree and making it hard to navigate. It does not serve any functional
    /// purpose.
    private _rulerHost: HTMLElement;
    
    renderingHost: HTMLElement;
    
    private _isDisposed: boolean = false;

    constructor() {
        this._rulerHost = document.createElement('flt-ruler-host');

        const style = (this._rulerHost as HTMLElement).style;
        style.position = 'fixed';
        style.visibility = 'hidden';
        style.overflow = 'hidden';
        style.top = '0';
        style.left = '0';
        style.width = '0';
        style.height = '0';

        this.renderingHost = document.querySelector('flt-rendering-host') as HTMLElement;
        if (this.renderingHost) {
            this.renderingHost.appendChild(this._rulerHost);
        }

        // TODO(mdebbar): 可能存在多个视图和多个渲染宿主。
        //                https://github.com/flutter/flutter/issues/137344
        // 注意：需要处理 EnginePlatformDispatcher.instance,
        // implicitView 或 renderingHost 为 null 的情况
        // const instance = EnginePlatformDispatcher.instance;
        // if (instance && instance.implicitView && instance.implicitView.dom && instance.implicitView.dom.renderingHost) {
        //     const renderingHost: DomNode = instance.implicitView.dom.renderingHost;
        //     renderingHost.appendChild(this._rulerHost);
        // } else {
        //     // 降级处理：如果无法找到 renderingHost，可以附加到 document.body
        //     // 或者抛出错误，取决于应用策略
        //     console.warn('Rendering host not found, appending RulerHost to document.body');
        //     document.body.appendChild(this._rulerHost);
        //     // throw new Error('Rendering host not available');
        // }

        // // 注册热重启监听器，以便在热重启时清理资源
        // registerHotRestartListener(() => this.dispose());
    }

    /// Releases the resources used by this [RulerHost].
    ///
    /// After this is called, this object is no longer usable.
    dispose(): void {
       this._rulerHost.remove(); 
        // if (!this._isDisposed) {
        //     this._rulerHost.remove(); // 从 DOM 中移除
        //     this._isDisposed = true;
        // }
    }

    /// Adds an element used for measuring text as a child of [_rulerHost].
    addElement(element: HTMLElement): void {
        // // 检查是否已被 dispose
        // if (this._isDisposed) {
        //     throw new Error('RulerHost has been disposed and is no longer usable.');
        // }
        this._rulerHost.appendChild(element);
    }
}

// These global variables are used to memoize calls to [measureSubstring]. They
// are used to remember the last arguments passed to it, and the last return
// value.
// They are being initialized so that the compiler knows they'll never be null.
let _lastStart = -1;
let _lastEnd = -1;
let _lastText = '';
let _lastCssFont = '';
let _lastWidth = -1;

/// Measures the width of the substring of [text] starting from the index
/// [start] (inclusive) to [end] (exclusive).
///
/// This method assumes that the correct font has already been set on
/// [canvasContext].
export function measureSubstring(
    canvasContext: CanvasRenderingContext2D,
    text: string,
    start: number,
    end: number,
    letterSpacing?: number,
): number {
    if (start < 0 || start > end || end > text.length) {
        throw new Error('Invalid start or end index');
    }

    if (start === end) {
        return 0;
    }

    const cssFont = canvasContext.font;
    let width: number;

    // TODO(mdebbar): Explore caching all widths in a map, not only the last one.
    if (
        start === _lastStart &&
        end === _lastEnd &&
        text === _lastText &&
        cssFont === _lastCssFont
    ) {
        // Reuse the previously calculated width if all factors that affect width
        // are unchanged. The only exception is letter-spacing. We always add
        // letter-spacing to the width later below.
        width = _lastWidth;
    } else {
        const sub = start === 0 && end === text.length ? text : text.substring(start, end);
        width = canvasContext.measureText(sub).width;
    }

    _lastStart = start;
    _lastEnd = end;
    _lastText = text;
    _lastCssFont = cssFont;
    _lastWidth = width;

    // Now add letter spacing to the width.
    letterSpacing = letterSpacing || 0.0;
    if (letterSpacing !== 0.0) {
        width += letterSpacing * (end - start);
    }

    // What we are doing here is we are rounding to the nearest 2nd decimal
    // point. So 39.999423 becomes 40, and 11.243982 becomes 11.24.
    // The reason we are doing this is because we noticed that canvas API has a
    // ±0.001 error margin.
    return _roundWidth(width);
}

function _roundWidth(width: number): number {
    return Math.round(width * 100) / 100;
}
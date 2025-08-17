import { TextFontVariations, TextFontFeatures} from "canvaskit-wasm";

function buildCssFontString(
    fontStyle?: FontStyle,
    fontWeight?: FontWeight,
    fontSize?: number,
    fontFamily: string,
): string {
    // 使用辅助函数或直接映射
    const cssFontStyle: string = fontStyle ? ui.fontStyleToCssString(fontStyle) : StyleManager.defaultFontStyle;
    const cssFontWeight: string = fontWeight ? ui.fontWeightToCssString(fontWeight) : StyleManager.defaultFontWeight;
    const cssFontSize: number = Math.floor(fontSize ?? StyleManager.defaultFontSize);
    // 假设 canonicalizeFontFamily 返回一个非空字符串或 null
    const cssFontFamily: string = canonicalizeFontFamily(fontFamily) ?? 'sans-serif'; // 提供默认值以防万一

    return `${cssFontStyle} ${cssFontWeight} ${cssFontSize}px ${cssFontFamily}`;
}


/// Contains all styles that have an effect on the height of text.
///
/// This is useful as a cache key for [TextHeightRuler].
class TextHeightStyle {
    fontFamily: string;
    fontSize: number;
    height: number | null; // Dart 中是 double?，TS 中用 number | null
    fontFeatures: TextFontFeatures[] | null; // ui.FontFeature[] | null; // 假设 any[] 代表 FontFeature
    fontVariations: TextFontVariations[] | null; // ui.FontVariation[] | null; // 假设 any[] 代表 FontVariation

    constructor(
        fontFamily: string,
        fontSize: number,
        height?: number,
        fontFeatures?: TextFontFeatures[],
        fontVariations?: TextFontVariations[],
    ) {
        this.fontFamily = fontFamily;
        this.fontSize = fontSize;
        this.height = height;
        this.fontFeatures = fontFeatures;
        this.fontVariations = fontVariations;
    }

    equals(other: any): boolean {
        if (this === other) {
            return true;
        }
        if (!(other instanceof TextHeightStyle)) {
            return false;
        }
        // 注意：Dart 的原始代码使用了 hashCode 比较，这在 JS 中不推荐且不可靠。
        // 应该进行深度比较。
        return (
            this.fontFamily === other.fontFamily &&
            this.fontSize === other.fontSize &&
            this.height === other.height &&
            this._arraysEqual(this.fontFeatures, other.fontFeatures) &&
            this._arraysEqual(this.fontVariations, other.fontVariations)
        );
    }

    /**
     * 辅助函数：比较两个数组（或 null）是否深度相等。
     * @param a 数组 a
     * @param b 数组 b
     * @returns 如果相等则返回 true，否则返回 false。
     */
    private _arraysEqual(a: any[] | null, b: any[] | null): boolean {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            // 这里假设数组元素有正确的 equals 方法，或者可以直接用 === 比较
            // 如果 FontFeature/FontVariation 是对象，需要更复杂的比较
            if (a[i] !== b[i] && !(a[i] && typeof a[i].equals === 'function' && a[i].equals(b[i]))) {
                return false;
            }
        }
        return true;
    }

    get hashCode(): number {
        // 简化哈希计算，实际应用中可能需要更健壮的算法
        let hash = 0;
        hash = ((hash << 5) - hash) + this.fontFamily.hashCode || 0; // String.hashCode 需要模拟
        hash = ((hash << 5) - hash) + this.fontSize;
        hash = ((hash << 5) - hash) + (this.height?.toString().hashCode || 0); // Number.hashCode 需要模拟或转换
        
        // 处理数组哈希 (简化)
        if (this.fontFeatures) {
             // Object.hashAll 等效? 需要自定义实现或使用库
             // 这里简化处理
             let featuresHash = 0;
             for(const feature of this.fontFeatures) {
                 // featuresHash ^= feature.hashCode; // 需要 feature 有 hashCode
             }
             hash = ((hash << 5) - hash) + featuresHash;
        }
        if (this.fontVariations) {
             // 同上
             let variationsHash = 0;
             for(const variation of this.fontVariations) {
                 // variationsHash ^= variation.hashCode;
             }
             hash = ((hash << 5) - hash) + variationsHash;
        }
        
        return hash | 0; // 转换为 32 位整数
    }
    
    // 为了完整性，添加一个简单的 String.hashCode 模拟 (JS 没有内置)
    // 可以添加到 String 的原型上 (注意: 修改原生原型有风险)
    /*
    private _stringHashCode(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // 转换为 32bit integer
        }
        return hash;
    }
    */
}

/// Provides text dimensions found on [_element]. The idea behind this class is
/// to allow the [ParagraphRuler] to mutate multiple dom elements and allow
/// consumers to lazily read the measurements.
///
/// The [ParagraphRuler] would have multiple instances of [TextDimensions] with
/// different backing elements for different types of measurements. When a
/// measurement is needed, the [ParagraphRuler] would mutate all the backing
/// elements at once. The consumer of the ruler can later read those
/// measurements.
///
/// The rationale behind this is to minimize browser reflows by batching dom
/// writes first, then performing all the reads.
class TextDimensions {
    private _element: HTMLElement;
    private _cachedBoundingClientRect?: DOMRect;

    constructor(element: HTMLElement) {
        this._element = element;
    }

    private _invalidateBoundsCache(): void {
        this._cachedBoundingClientRect = null;
    }

    /// Sets text of contents to a single space character to measure empty text.
    updateTextToSpace(): void {
        this._invalidateBoundsCache();
        // 假设 DomElement 有 text 或 innerText/innerHTML 属性
        if ('textContent' in this._element) {
            (this._element as any).textContent = ' ';
        } else {
            this._element.innerText = ' ';
        }
    }

    /**
     * 将指定的高度样式应用到元素。
     * @param textHeightStyle 要应用的样式。
     */
    applyHeightStyle(textHeightStyle: TextHeightStyle): void {
        const fontFamily: string = textHeightStyle.fontFamily;
        const fontSize: number = textHeightStyle.fontSize;
        const style: DomCSSStyleDeclaration = this._element.style;

        style.fontSize = `${Math.floor(fontSize)}px`;
        // 假设 canonicalizeFontFamily 返回非空值
        const canonFontFamily = canonicalizeFontFamily(fontFamily);
        if (canonFontFamily) {
            style.fontFamily = canonFontFamily;
        }

        let height: number | null = textHeightStyle.height;
        // 针对测试环境的变通方法
        const effectiveLineHeight: number | null = height ?? (fontFamily === 'FlutterTest' ? 1.0 : null);
        if (effectiveLineHeight != null) {
            style.lineHeight = effectiveLineHeight.toString();
        }
        this._invalidateBoundsCache();
    }

    /// Appends element and probe to hostElement that is set up for a specific
    /// TextStyle.
    appendToHost(hostElement: HTMLElement): void {
        hostElement.appendChild(this._element);
        this._invalidateBoundsCache();
    }

    /**
     * 读取并缓存元素的边界矩形。
     * @returns 元素的 DomRect。
     */
    private _readAndCacheMetrics(): DOMRect {
        if (!this._cachedBoundingClientRect) {
            this._cachedBoundingClientRect = this._element.getBoundingClientRect();
        }
        return this._cachedBoundingClientRect;
    }

    /**
     * 获取被测量段落的高度。
     */
    get height(): number {
        let cachedHeight: number = this._readAndCacheMetrics().height;
        // Firefox 子像素舍入错误的变通方法
        if (ui_web.browser.browserEngine === ui_web.BrowserEngine.firefox &&
            !ui_web.debugEmulateFlutterTesterEnvironment) {
            cachedHeight += 1.0;
        }
        return cachedHeight;
    }
}

/// Performs height measurement for the given [textHeightStyle].
///
/// The two results of this ruler's measurement are:
///
/// 1. [alphabeticBaseline].
/// 2. [height].
class TextHeightRuler {
    textHeightStyle: TextHeightStyle;
    rulerHost: RulerHost;

    // 用于测量行高指标的元素
    private _probe: HTMLElement;
    private _host: HTMLElement;
    private _dimensions: TextDimensions;

    // 测量结果
    private _alphabeticBaseline: number | null = null;
    private _height: number | null = null;
    private _isDisposed: boolean = false;

    constructor(textHeightStyle: TextHeightStyle, rulerHost: RulerHost) {
        this.textHeightStyle = textHeightStyle;
        this.rulerHost = rulerHost;

        // 初始化元素
        this._host = this._createHost();
        this._probe = this._createProbe();
        // 假设 domDocument.createElement 创建的是 HTMLElement
        this._dimensions = new TextDimensions(domDocument.createElement('flt-paragraph') as unknown as DomElement);
        
        // 注意：在 Dart 中，这些是 `late final`，意味着它们在第一次访问时计算。
        // 在 TS 中，我们可以在构造函数末尾或通过 getter 实现惰性初始化。
        // 这里选择在构造函数中初始化，假设依赖项 (_probe, _dimensions) 已正确设置。
        // 如果需要严格的惰性加载，应使用 getter。
        this._dimensions.applyHeightStyle(this.textHeightStyle);
        this._dimensions._element.style.whiteSpace = 'pre'; // Force single-line, preserve whitespaces
        this._dimensions.updateTextToSpace();
        this._dimensions.appendToHost(this._host);
        
        // 在所有设置完成后计算值
        this._alphabeticBaseline = this._probe.getBoundingClientRect().bottom;
        this._height = this._dimensions.height;
    }

    /**
     * 获取此测量器的字母基线。
     */
    get alphabeticBaseline(): number {
        if (this._alphabeticBaseline === null) {
            throw new Error("Alphabetic baseline not initialized");
        }
        return this._alphabeticBaseline;
    }

    /**
     * 获取此测量器的高度。
     */
    get height(): number {
        if (this._height === null) {
            throw new Error("Height not initialized");
        }
        return this._height;
    }

    /**
     * 释放此测量器并将其从 DOM 树中分离。
     */
    dispose(): void {
        if (!this._isDisposed) {
            this._host.remove();
            this._isDisposed = true;
        }
    }

    private _createHost(): HTMLElement {
        const host: HTMLDivElement = createDomHTMLDivElement(); // 假设返回 HTMLDivElement
        const style: DomCSSStyleDeclaration = host.style;
        
        style.visibility = 'hidden';
        style.position = 'absolute';
        style.top = '0';
        style.left = '0';
        style.display = 'flex';
        style.flexDirection = 'row';
        style.alignItems = 'baseline';
        style.margin = '0';
        style.border = '0';
        style.padding = '0';

        // 添加调试属性 (可选)
        host.setAttribute('data-ruler', 'line-height');

        // _dimensions 的样式已在构造函数中应用
        
        this.rulerHost.addElement(host);
        return host;
    }

    private _createProbe(): HTMLElement {
        const probe: HTMLElement = document.createElement('div') as HTMLElement;
        this._host.appendChild(probe);
        return probe;
    }
}
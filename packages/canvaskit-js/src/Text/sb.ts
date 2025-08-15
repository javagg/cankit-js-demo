/**
 * 一个简单的 StringBuffer 实现，用于高效拼接字符串。
 * 内部使用数组存储片段，最后通过 join('') 合并，避免频繁创建新字符串。
 */
export class StringBuffer {
    /**
     * 构造函数
     */
    constructor() {
        // 内部数组用于存储待拼接的字符串片段
        this._buffer = [];
        // 记录当前总长度（字符数）
        this._length = 0;
    }

    /**
     * 向缓冲区末尾添加一个字符串。
     * @param {string} str 要添加的字符串。
     * @returns {StringBuffer} 返回 this，支持链式调用。
     */
    append(str) {
        if (str != null) { // 检查 null 或 undefined
            const s = String(str); // 确保是字符串
            this._buffer.push(s);
            this._length += s.length;
        }
        return this; // 支持链式调用
    }

    /**
     * 向缓冲区指定位置插入一个字符串。
     * 注意：此操作涉及数组的 splice，对于大数组可能开销较大。
     * @param {number} index 插入位置的索引。
     * @param {string} str 要插入的字符串。
     * @returns {StringBuffer} 返回 this，支持链式调用。
     */
    insert(index, str) {
        if (index < 0 || index > this._buffer.length) {
             throw new Error("Index out of bounds");
        }
        if (str != null) {
            const s = String(str);
            // 为了简化，我们按片段插入。更精确的实现需要拆分片段。
            // 这里假设 index 是指片段索引
            this._buffer.splice(index, 0, s);
            this._length += s.length;
        }
        return this;
    }

    /**
     * 从缓冲区末尾移除最后一个字符串片段。
     * @returns {StringBuffer} 返回 this，支持链式调用。
     */
    removeLast() {
        if (this._buffer.length > 0) {
            const removed = this._buffer.pop();
            if (removed !== undefined) {
                this._length -= removed.length;
            }
        }
        return this;
    }

    /**
     * 清空缓冲区。
     * @returns {StringBuffer} 返回 this，支持链式调用。
     */
    clear() {
        this._buffer.length = 0; // 清空数组
        this._length = 0;
        return this;
    }

    /**
     * 获取当前缓冲区中所有字符串拼接后的总长度。
     * @returns {number} 字符总数。
     */
    length() {
        return this._length;
    }

    /**
     * 检查缓冲区是否为空。
     * @returns {boolean} 如果为空则返回 true，否则返回 false。
     */
    isEmpty() {
        return this._buffer.length === 0;
    }

    /**
     * 将缓冲区中的所有字符串片段拼接成一个最终字符串。
     * 这是核心方法，将数组内容连接起来。
     * @returns {string} 拼接后的完整字符串。
     */
    toString() {
        return this._buffer.join('');
    }

    /**
     * 返回缓冲区的字符串表示形式（用于调试）。
     * @returns {string} 包含内部状态的字符串。
     */
    valueOf() {
        // 可以自定义，这里简单返回 toString() 的结果
        return this.toString();
    }
}
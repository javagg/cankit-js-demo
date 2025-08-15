// Copyright 2013 The Flutter Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export const kChar_0 = 48;
export const kChar_9 = kChar_0 + 9;
export const kChar_A = 65;
export const kChar_Z = 90;
export const kChar_a = 97;
export const kChar_z = 122;
export const kCharBang = 33;
export const kMashriqi_0 = 0x660;
export const kMashriqi_9 = kMashriqi_0 + 9;

enum _ComparisonResult {
    inside,
    higher,
    lower,
}

/// Each instance of [UnicodeRange] represents a range of unicode characters
/// that are assigned a [CharProperty]. For example, the following snippet:
///
/// ```dart
/// UnicodeRange(0x0041, 0x005A, CharProperty.ALetter);
/// ```
///
/// is saying that all characters between 0x0041 ("A") and 0x005A ("Z") are
/// assigned the property [CharProperty.ALetter].
///
/// Note that the Unicode spec uses inclusive ranges and we are doing the
/// same here.
export class UnicodeRange<P> {
    constructor(
        readonly start: number,
        readonly end: number,
        readonly property: P
    ) { }

    /**
     * Compare a value to this range.
     * 
     * The return value is either:
     * - lower: The value is lower than the range.
     * - higher: The value is higher than the range
     * - inside: The value is within the range.
     */
    compare(value: number): _ComparisonResult {
        if (value < this.start) {
            return _ComparisonResult.lower;
        }
        if (value > this.end) {
            return _ComparisonResult.higher;
        }
        return _ComparisonResult.inside;
    }
}

/// Checks whether the given char code is a UTF-16 surrogate.
///
/// See:
/// - http://www.unicode.org/faq//utf_bom.html#utf16-2
function isUtf16Surrogate(charCode: number): boolean {
    return (charCode & 0xF800) === 0xD800;
}

/// Combines a pair of UTF-16 surrogate into a single character code point.
///
/// The surrogate pair is expected to start at [index] in the [text].
///
/// See:
/// - http://www.unicode.org/faq//utf_bom.html#utf16-3
function combineSurrogatePair(text: string, index: number): number {
    const hi: number = text.charCodeAt(index);
    const lo: number = text.charCodeAt(index + 1);
    const x: number = ((hi & ((1 << 6) - 1)) << 10) | (lo & ((1 << 10) - 1));
    const w: number = (hi >> 6) & ((1 << 5) - 1);
    const u: number = w + 1;
    return (u << 16) | x;

}


/// Returns the code point from [text] at [index] and handles surrogate pairs
/// for cases that involve two UTF-16 codes.
export function getCodePoint(text: string | null, index: number): number | null {
    if (!text || index < 0 || index >= text.length) {
        return null;
    }

    const charCode = text.charCodeAt(index);
    if (isUtf16Surrogate(charCode) && index < text.length - 1) {
        return combineSurrogatePair(text, index);
    }
    return charCode;
}


/// Given a list of [UnicodeRange]s, this class performs efficient lookup
/// to find which range a value falls into.
///
/// The lookup algorithm expects the ranges to have the following constraints:
/// - Be sorted.
/// - No overlap between the ranges.
/// - Gaps between ranges are ok.
///
/// This is used in the context of unicode to find out what property a letter
/// has. The properties are then used to decide word boundaries, line break
/// opportunities, etc.
export class UnicodePropertyLookup<P> {
    private readonly _cache = new Map<number, P>();

    constructor(
        readonly ranges: UnicodeRange<P>[],
        readonly defaultProperty: P
    ) { }

    /**
     * Creates a UnicodePropertyLookup from packed data.
     */
    static fromPackedData<P>(
        packedData: string,
        singleRangesCount: number,
        propertyEnumValues: P[],
        defaultProperty: P
    ): UnicodePropertyLookup<P> {
        const ranges = unpackProperties(
            packedData,
            singleRangesCount,
            propertyEnumValues
        );
        return new UnicodePropertyLookup(ranges, defaultProperty);
    }

    /// Take a [text] and an [index], and returns the property of the character
    /// located at that [index].
    ///
    /// If the [index] is out of range, null will be returned.
    find(text: string, index: number): P {
        const codePoint = getCodePoint(text, index);
        return codePoint === null ? this.defaultProperty : this.findForChar(codePoint);
    }

    /// Takes one character as an integer code unit and returns its property.
    ///
    /// If a property can't be found for the given character, then the default
    /// property will be returned.
    findForChar(char: number | null): P {
        if (!char) return this.defaultProperty

        const cacheHit = this._cache.get(char);
        if (cacheHit !== undefined) {
            return cacheHit;
        }

        const rangeIndex = this._binarySearch(char);
        const result = rangeIndex === -1 ? this.defaultProperty : this.ranges[rangeIndex].property;

        // Cache the result
        this._cache.set(char, result);
        return result;
    }

    private _binarySearch(value: number): number {
        let min = 0;
        let max = this.ranges.length;
        while (min < max) {
            const mid = min + ((max - min) >> 1);
            const range = this.ranges[mid];
            switch (range.compare(value)) {
                case _ComparisonResult.higher:
                    min = mid + 1;
                    break;
                case _ComparisonResult.lower:
                    max = mid;
                    break;
                case _ComparisonResult.inside:
                    return mid;
            }
        }
        return -1;
    }
}

/**
 * Unpacks properties from a packed string format.
 */
function unpackProperties<P>(
    packedData: string,
    singleRangesCount: number,
    propertyEnumValues: P[]
): UnicodeRange<P>[] {
    // Packed data is mostly structured in chunks of 9 characters each:
    //
    // * [0..3]: Range start, encoded as a base36 integer.
    // * [4..7]: Range end, encoded as a base36 integer.
    // * [8]: Index of the property enum value, encoded as a single letter.
    //
    // When the range is a single number (i.e. range start == range end), it gets
    // packed more efficiently in a chunk of 6 characters:
    //
    // * [0..3]: Range start (and range end), encoded as a base 36 integer.
    // * [4]: "!" to indicate that there's no range end.
    // * [5]: Index of the property enum value, encoded as a single letter.

    // `packedData.length + singleRangesCount * 3` would have been the size of the
    // packed data if the efficient packing of single-range items wasn't applied.
  if ((packedData.length + singleRangesCount * 3) % 9 !== 0) {
        throw new Error("Assertion failed: Invalid packed data length");
    }

    const ranges: UnicodeRange<P>[] = [];
    const dataLength: number = packedData.length;
    let i: number = 0;

    while (i < dataLength) {
        const rangeStart: number = _consumeInt(packedData, i);
        i += 4; 

        let rangeEnd: number;

        if (packedData.charCodeAt(i) === kCharBang) {
            rangeEnd = rangeStart;
            i++;
        } else {
            rangeEnd = _consumeInt(packedData, i);
            i += 4;
        }

        const charCode: number = packedData.charCodeAt(i);
        const property: P = propertyEnumValues[_getEnumIndexFromPackedValue(charCode)];
        i++; 

        ranges.push(new UnicodeRange<P>(rangeStart, rangeEnd, property));
    }

    return ranges;
}

function _consumeInt(packedData: string, index: number): number {
    const digit0: number = getIntFromCharCode(packedData.charCodeAt(index + 3));
    const digit1: number = getIntFromCharCode(packedData.charCodeAt(index + 2));
    const digit2: number = getIntFromCharCode(packedData.charCodeAt(index + 1));
    const digit3: number = getIntFromCharCode(packedData.charCodeAt(index));

    return digit0 +
        (digit1 * 36) +
        (digit2 * 36 * 36) +
        (digit3 * 36 * 36 * 36);

}


function _getEnumIndexFromPackedValue(charCode: number): number {
    if (!((charCode >= kChar_A && charCode <= kChar_Z) || (charCode >= kChar_a && charCode <= kChar_z))) {
        throw new Error(`Assertion failed: charCode ${charCode} is not a letter A-Z or a-z`);
    }

    // Uppercase letters were assigned to the first 26 enum values.
    if (charCode <= kChar_Z) {
        return charCode - kChar_A;
    }
    // Lowercase letters were assigned to enum values above 26.
    return 26 + charCode - kChar_a;
}

/// Does the same thing as [int.parse(str, 36)] but takes only a single
/// character as a [charCode] integer.
function getIntFromCharCode(charCode: number): number {
    // assert(
    //     (charCode >= kChar_0 && charCode <= kChar_9) || (charCode >= kChar_a && charCode <= kChar_z),
    // );
    if (charCode <= kChar_9) {
        return charCode - kChar_0;
    }
    // "a" starts from 10 and remaining letters go up from there.
    return charCode - kChar_a + 10;
} 
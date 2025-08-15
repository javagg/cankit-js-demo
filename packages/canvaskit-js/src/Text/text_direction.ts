// Copyright 2013 The Flutter Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { TextDirection as TextDirectionType } from 'canvaskit-wasm';
import { TextDirection } from '../Core';
import { TextFragmenter, TextFragment } from './fragmenter';
import {
    UnicodePropertyLookup, UnicodeRange, getCodePoint,
    kChar_0, kChar_9,
    kMashriqi_0, kMashriqi_9
} from './unicode_range';

export enum FragmentFlow {
    /** The fragment flows from left to right regardless of its surroundings. */
    ltr,

    /** The fragment flows from right to left regardless of its surroundings. */
    rtl,

    /**
     * The fragment flows the same as the previous fragment.
     * If it's the first fragment in a line, then it flows the same as the
     * paragraph direction.
     * E.g. digits.
     */
    previous,

    /**
     * If the previous and next fragments flow in the same direction, then this
     * fragment flows in that same direction. Otherwise, it flows the same as the
     * paragraph direction.
     * E.g. spaces, symbols.
     */
    sandwich,
}

/**
 * Splits text into fragments based on directionality.
 */
export class BidiFragmenter extends TextFragmenter {
    constructor(text: string) {
        super(text);
    }

    fragment(): BidiFragment[] {
        return _computeBidiFragments(this.text);
    }
}

export class BidiFragment extends TextFragment {
    constructor(
        start: number,
        end: number,
        readonly textDirection: TextDirectionType | null,
        readonly fragmentFlow: FragmentFlow
    ) {
        super(start, end);
    }
    get hashCode(): number {
        throw new Error("need implement")
    }

    compare(other: BidiFragment): boolean {
        throw new Error("need implement")
    }

    toString(): string {
        return `BidiFragment(${this.start}, ${this.end}, ${this.textDirection})`;
    }
}

// This data was taken from the source code of the Closure library:
//
// - https://github.com/google/closure-library/blob/9d24a6c1809a671c2e54c328897ebeae15a6d172/closure/goog/i18n/bidi.js#L203-L234
const _textDirectionLookup = new UnicodePropertyLookup<TextDirectionType | null>(
    [
        // LTR
        new UnicodeRange(0x0041, 0x005A, TextDirection.LTR), // A-Z
        new UnicodeRange(0x0061, 0x007A, TextDirection.LTR), // a-z
        new UnicodeRange(0x00C0, 0x00D6, TextDirection.LTR),
        new UnicodeRange(0x00D8, 0x00F6, TextDirection.LTR),
        new UnicodeRange(0x00F8, 0x02B8, TextDirection.LTR),
        new UnicodeRange(0x0300, 0x0590, TextDirection.LTR),
        // RTL
        new UnicodeRange(0x0591, 0x06EF, TextDirection.RTL),
        new UnicodeRange(0x06FA, 0x08FF, TextDirection.RTL),
        // LTR
        new UnicodeRange(0x0900, 0x1FFF, TextDirection.LTR),
        new UnicodeRange(0x200E, 0x200E, TextDirection.LTR),
        // RTL
        new UnicodeRange(0x200F, 0x200F, TextDirection.RTL),
        // LTR
        new UnicodeRange(0x2C00, 0xD801, TextDirection.LTR),
        // RTL
        new UnicodeRange(0xD802, 0xD803, TextDirection.RTL),
        // LTR
        new UnicodeRange(0xD804, 0xD839, TextDirection.LTR),
        // RTL
        new UnicodeRange(0xD83A, 0xD83B, TextDirection.RTL),
        // LTR
        new UnicodeRange(0xD83C, 0xDBFF, TextDirection.LTR),
        new UnicodeRange(0xF900, 0xFB1C, TextDirection.LTR),
        // RTL
        new UnicodeRange(0xFB1D, 0xFDFF, TextDirection.RTL),
        // LTR
        new UnicodeRange(0xFE00, 0xFE6F, TextDirection.LTR),
        // RTL
        new UnicodeRange(0xFE70, 0xFEFC, TextDirection.RTL),
        // LTR
        new UnicodeRange(0xFEFD, 0xFFFF, TextDirection.LTR),
    ],
    null
);

function _computeBidiFragments(text: string): BidiFragment[] {
    const fragments: BidiFragment[] = [];

    if (text.length === 0) {
        fragments.push(new BidiFragment(0, 0, null, FragmentFlow.previous));
        return fragments;
    }

    let fragmentStart = 0;
    let textDirection = _getTextDirection(text, 0);
    let fragmentFlow = _getFragmentFlow(text, 0);

    for (let i = 1; i < text.length; i++) {
        const charTextDirection = _getTextDirection(text, i);

        if (charTextDirection !== textDirection) {
            // We've reached the end of a text direction fragment.
            fragments.push(new BidiFragment(fragmentStart, i, textDirection, fragmentFlow));
            fragmentStart = i;
            textDirection = charTextDirection;
            fragmentFlow = _getFragmentFlow(text, i);
        } else if (fragmentFlow === FragmentFlow.previous) {
            // This code handles the case of a sequence of digits followed by a sequence
            // of LTR characters with no space in between.
            fragmentFlow = _getFragmentFlow(text, i);
        }
    }

    fragments.push(new BidiFragment(fragmentStart, text.length, textDirection, fragmentFlow));
    return fragments;
}

function _getTextDirection(text: string, i: number): TextDirectionType | null {
    const codePoint = getCodePoint(text, i);
    if (!codePoint) return null;

    if (_isDigit(codePoint) || _isMashriqiDigit(codePoint)) {
        // A sequence of regular digits or Mashriqi digits always goes from left to
        // regardless of their fragment flow direction.
        return TextDirection.LTR;
    }

    return _textDirectionLookup.findForChar(codePoint);
}

function _getFragmentFlow(text: string, i: number): FragmentFlow {
    const codePoint = getCodePoint(text, i);
    if (!codePoint) return FragmentFlow.sandwich;

    if (_isDigit(codePoint)) {
        return FragmentFlow.previous;
    }
    if (_isMashriqiDigit(codePoint)) {
        return FragmentFlow.rtl;
    }

    const textDirection = _textDirectionLookup.findForChar(codePoint);
    switch (textDirection) {
        case TextDirection.LTR:
            return FragmentFlow.rtl;
        case TextDirection.RTL:
            return FragmentFlow.rtl;
        default:
            return FragmentFlow.sandwich;
    }
}

function _isDigit(codePoint: number): boolean {
    return codePoint >= kChar_0 && codePoint <= kChar_9; // 0-9
}

function _isMashriqiDigit(codePoint: number): boolean {
    return codePoint >= kMashriqi_0 && codePoint <= kMashriqi_9;
} 
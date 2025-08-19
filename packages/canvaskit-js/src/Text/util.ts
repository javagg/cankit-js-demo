/// From: https://developer.mozilla.org/en-US/docs/Web/CSS/font-family#Syntax
///
/// Generic font families are a fallback mechanism, a means of preserving some
/// of the style sheet author's intent when none of the specified fonts are
/// available. Generic family names are keywords and must not be quoted. A
/// generic font family should be the last item in the list of font family
/// names.
const _genericFontFamilies = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'math',
  'emoji',
  'fangsong',
]);

const isMacOrIOS = false
const isIOS15 = false
/// A default fallback font family in case an unloaded font has been requested.
///
/// -apple-system targets San Francisco in Safari (on Mac OS X and iOS),
/// and it targets Neue Helvetica and Lucida Grande on older versions of
/// Mac OS X. It properly selects between San Francisco Text and
/// San Francisco Display depending on the text’s size.
///
/// For iOS, default to -apple-system, where it should be available, otherwise
/// default to Arial. BlinkMacSystemFont is used for Chrome on iOS.
const _fallbackFontFamily = (() => {
  if (isIOS15) {
    // Remove the "-apple-system" fallback font because it causes a crash in
    // iOS 15.
    //
    // See github issue: https://github.com/flutter/flutter/issues/90705
    // See webkit bug: https://bugs.webkit.org/show_bug.cgi?id=231686
    return 'BlinkMacSystemFont';
  }
  if (isMacOrIOS) {
    return '-apple-system, BlinkMacSystemFont';
  }
  return 'Arial';
})();



/// Create a font-family string appropriate for CSS.
///
/// If the given [fontFamily] is a generic font-family, then just return it.
/// Otherwise, wrap the family name in quotes and add a fallback font family.
export function canonicalizeFontFamily(fontFamily: string | null): string | null {
  if (fontFamily === null) {
    return null;
  }
  
  if (_genericFontFamilies.has(fontFamily)) {
    return fontFamily;
  }
  
  if (isMacOrIOS) {
    // Unlike Safari, Chrome on iOS does not correctly fallback to cupertino
    // on sans-serif.
    // Map to San Francisco Text/Display fonts, use -apple-system,
    // BlinkMacSystemFont.
    if (fontFamily === '.SF Pro Text' ||
        fontFamily === '.SF Pro Display' ||
        fontFamily === '.SF UI Text' ||
        fontFamily === '.SF UI Display') {
      return _fallbackFontFamily;
    }
  }
  
  return `"${fontFamily}", ${_fallbackFontFamily}, sans-serif`;
}

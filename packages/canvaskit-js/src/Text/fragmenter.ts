/// Splits [text] into a list of [TextFragment]s.
///
/// Various subclasses can perform the fragmenting based on their own criteria.
///
/// See:
///
/// - [LineBreakFragmenter]: Fragments text based on line break opportunities.
/// - [BidiFragmenter]: Fragments text based on directionality.
export abstract class TextFragmenter {
    /// The text to be fragmented. 
    constructor(readonly text: string) { }

    /// Performs the fragmenting of [text] and returns a list of [TextFragment]s.
     abstract  fragment(): TextFragment[]
}

/// Represents a fragment produced by [TextFragmenter].
export abstract class TextFragment {
    constructor(readonly start: number, readonly end: number) {
    }

    /// Whether this fragment's range overlaps with the range from [start] to [end].
    overlapsWith(start: number, end: number): boolean {
        return start < this.end && this.start < end;
    }
}
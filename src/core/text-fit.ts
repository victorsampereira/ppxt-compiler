/**
 * Text-fit estimation used by the layout engine (to pick a font size) and by
 * the QA rules (to flag overflow). It is a heuristic for proportional Latin
 * text, not a font metrics engine: the average glyph is about half an em wide.
 */
const REGULAR_EM = 0.52;
const BOLD_EM = 0.56;
const LINE_SPACING = 1.2;

export interface FitOptions {
  bold?: boolean;
  /** Horizontal space taken by the bullet marker, in inches. */
  indentIn?: number;
  /** Space between paragraphs, in points. */
  paragraphGapPt?: number;
}

export function estimateLines(
  text: string,
  widthIn: number,
  fontPt: number,
  bold = false,
): number {
  const charWidthIn = (fontPt * (bold ? BOLD_EM : REGULAR_EM)) / 72;
  const charsPerLine = Math.max(1, Math.floor(widthIn / charWidthIn));
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return 0;
  }

  let lines = 1;
  let current = 0;

  for (const word of words) {
    if (word.length > charsPerLine) {
      // A single word longer than the line is broken across lines.
      lines += current === 0 ? 0 : 1;
      lines += Math.ceil(word.length / charsPerLine) - 1;
      current = word.length % charsPerLine || charsPerLine;
    } else if (current === 0) {
      current = word.length;
    } else if (current + 1 + word.length <= charsPerLine) {
      current += 1 + word.length;
    } else {
      lines += 1;
      current = word.length;
    }
  }

  return lines;
}

export function estimateHeightIn(
  paragraphs: string[],
  widthIn: number,
  fontPt: number,
  options: FitOptions = {},
): number {
  const { bold = false, indentIn = 0, paragraphGapPt = 0 } = options;
  const usableWidth = Math.max(0.1, widthIn - indentIn);

  const lines = paragraphs.reduce(
    (sum, paragraph) =>
      sum + estimateLines(paragraph, usableWidth, fontPt, bold),
    0,
  );
  const gaps = Math.max(0, paragraphs.length - 1) * paragraphGapPt;

  return (lines * fontPt * LINE_SPACING + gaps) / 72;
}

export interface FitResult {
  fontPt: number;
  fits: boolean;
}

/** Largest size in the ladder whose estimated height fits the box. */
export function fitFontPt(
  paragraphs: string[],
  box: { w: number; h: number },
  ladder: readonly number[],
  options: FitOptions = {},
): FitResult {
  const sizes = [...ladder].sort((a, b) => b - a);

  for (const fontPt of sizes) {
    if (estimateHeightIn(paragraphs, box.w, fontPt, options) <= box.h) {
      return { fontPt, fits: true };
    }
  }

  return { fontPt: sizes[sizes.length - 1], fits: false };
}

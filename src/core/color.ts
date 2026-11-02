/** Returns the color as upper-case RRGGBB without the leading "#". */
export function normalizeHex(color: string): string {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!match) {
    throw new Error(`Cor invalida: ${color}`);
  }

  const hex = match[1];
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex;

  return full.toUpperCase();
}

/** WCAG 2.x relative luminance, from 0 (black) to 1 (white). */
export function relativeLuminance(color: string): number {
  const hex = normalizeHex(color);
  const [r, g, b] = [0, 2, 4].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio, from 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );

  return (lighter + 0.05) / (darker + 0.05);
}

/** Picks the candidate with the highest contrast against the background. */
export function pickReadable(background: string, candidates: string[]): string {
  return candidates.reduce((best, candidate) =>
    contrastRatio(background, candidate) > contrastRatio(background, best)
      ? candidate
      : best,
  );
}

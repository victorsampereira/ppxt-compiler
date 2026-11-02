import { describe, expect, it } from "vitest";

import {
  contrastRatio,
  normalizeHex,
  pickReadable,
  relativeLuminance,
} from "../src/core/color.js";
import {
  estimateHeightIn,
  estimateLines,
  fitFontPt,
} from "../src/core/text-fit.js";

describe("color", () => {
  it("normalizes #RGB, #RRGGBB and bare hex", () => {
    expect(normalizeHex("#abc")).toBe("AABBCC");
    expect(normalizeHex("c96f3b")).toBe("C96F3B");
    expect(normalizeHex(" #171717 ")).toBe("171717");
  });

  it("rejects values that are not hex colors", () => {
    expect(() => normalizeHex("tomato")).toThrow(/Cor invalida/);
    expect(() => normalizeHex("#12345")).toThrow(/Cor invalida/);
  });

  it("matches the WCAG reference values", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#336699", "#336699")).toBe(1);
    // #767676 on white is the lightest grey that still passes 4.5:1.
    expect(contrastRatio("#767676", "#FFFFFF")).toBeCloseTo(4.54, 1);
    expect(contrastRatio("#777777", "#FFFFFF")).toBeLessThan(4.5);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#C96F3B", "#171717")).toBeCloseTo(
      contrastRatio("#171717", "#C96F3B"),
      10,
    );
  });

  it("picks the more readable candidate for a background", () => {
    expect(pickReadable("#171717", ["#171717", "#FFFFFF"])).toBe("#FFFFFF");
    expect(pickReadable("#F4EFE6", ["#171717", "#FFFFFF"])).toBe("#171717");
  });
});

describe("text fit", () => {
  it("counts no lines for empty text and one line for short text", () => {
    expect(estimateLines("   ", 5, 18)).toBe(0);
    expect(estimateLines("Ola", 5, 18)).toBe(1);
  });

  it("wraps more as the text gets longer or the font bigger", () => {
    const text = "uma frase razoavelmente longa para forcar quebra de linha no slide";
    const small = estimateLines(text, 4, 14);
    const large = estimateLines(text, 4, 28);

    expect(small).toBeGreaterThan(1);
    expect(large).toBeGreaterThan(small);
    expect(estimateLines(`${text} ${text}`, 4, 14)).toBeGreaterThan(small);
  });

  it("breaks a single word that is longer than the line", () => {
    expect(estimateLines("a".repeat(200), 2, 20)).toBeGreaterThan(5);
  });

  it("adds paragraph gaps between paragraphs but not after the last", () => {
    const one = estimateHeightIn(["a"], 5, 20, { paragraphGapPt: 10 });
    const two = estimateHeightIn(["a", "a"], 5, 20, { paragraphGapPt: 10 });

    expect(two).toBeCloseTo(one * 2 + 10 / 72, 6);
  });

  it("a narrower box needs at least as much height", () => {
    const text = "texto de teste com varias palavras para medir a altura necessaria";
    expect(estimateHeightIn([text], 3, 18)).toBeGreaterThanOrEqual(
      estimateHeightIn([text], 6, 18),
    );
  });

  it("picks the largest size that fits and reports when nothing does", () => {
    const text = "Titulo que cabe em uma linha";
    const roomy = fitFontPt([text], { w: 12, h: 2 }, [40, 32, 24]);
    expect(roomy).toEqual({ fontPt: 40, fits: true });

    const tight = fitFontPt([text], { w: 4, h: 0.6 }, [40, 32, 24]);
    expect(tight.fontPt).toBeLessThan(40);

    const impossible = fitFontPt([text.repeat(10)], { w: 2, h: 0.3 }, [40, 32, 24]);
    expect(impossible).toEqual({ fontPt: 24, fits: false });
  });
});

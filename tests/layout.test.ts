import { describe, expect, it } from "vitest";

import { SLIDE, buildSlideLayout, textFor } from "../src/core/layout.js";
import { LIMITS } from "../src/core/limits.js";
import { LayoutElement } from "../src/core/types.js";
import { ARCHETYPES, content, design } from "./helpers.js";

const VARIANTS = {
  full: content({
    subtitle: "Um subtitulo curto",
    callout: "Uma frase de destaque para o slide",
    bullets: ["Ponto um", "Ponto dois", "Ponto tres", "Ponto quatro"],
  }),
  noCallout: content({ bullets: ["Ponto um", "Ponto dois", "Ponto tres"] }),
  titleOnly: content({ bullets: [] }),
};

function overlaps(a: LayoutElement, b: LayoutElement): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

describe("layout engine", () => {
  for (const archetype of ARCHETYPES) {
    for (const [name, slide] of Object.entries(VARIANTS)) {
      describe(`${archetype} / ${name}`, () => {
        const layout = buildSlideLayout(slide, design(archetype));

        it("keeps every element inside the slide", () => {
          for (const element of layout.elements) {
            expect(element.x).toBeGreaterThanOrEqual(0);
            expect(element.y).toBeGreaterThanOrEqual(0);
            expect(element.x + element.w).toBeLessThanOrEqual(SLIDE.w);
            expect(element.y + element.h).toBeLessThanOrEqual(SLIDE.h);
          }
        });

        it("never lets two text elements overlap", () => {
          const texts = layout.elements.filter((element) => element.type !== "shape");
          for (let i = 0; i < texts.length; i += 1) {
            for (let j = i + 1; j < texts.length; j += 1) {
              expect(
                overlaps(texts[i], texts[j]),
                `${texts[i].id} overlaps ${texts[j].id}`,
              ).toBe(false);
            }
          }
        });

        it("draws only text the slide actually has, at a readable size", () => {
          for (const element of layout.elements) {
            if (element.type === "shape") {
              continue;
            }
            expect(textFor(element, slide).length).toBeGreaterThan(0);
            expect(element.fontPt).toBeGreaterThanOrEqual(LIMITS.minTextPt);
          }
        });
      });
    }
  }

  it("uses different compositions for different archetypes", () => {
    const signatures = new Set(
      ARCHETYPES.map((archetype) =>
        buildSlideLayout(VARIANTS.full, design(archetype))
          .elements.map((element) => `${element.id}@${element.x},${element.y},${element.w}`)
          .join("|"),
      ),
    );

    expect(signatures.size).toBe(ARCHETYPES.length);
  });

  it("adds the callout panel only when there is a callout", () => {
    const withCallout = buildSlideLayout(VARIANTS.full, design("2_col_argument"));
    const without = buildSlideLayout(VARIANTS.noCallout, design("2_col_argument"));

    expect(withCallout.elements.some((element) => element.role === "panel")).toBe(true);
    expect(without.elements.some((element) => element.role === "panel")).toBe(false);
    expect(without.elements.find((element) => element.id === "bullets")?.w).toBeGreaterThan(
      withCallout.elements.find((element) => element.id === "bullets")?.w ?? 0,
    );
  });

  it("splits comparison bullets across two columns without losing any", () => {
    const layout = buildSlideLayout(VARIANTS.full, design("comparison_matrix"));
    const columns = layout.elements.filter((element) => element.role === "bullets");

    expect(columns).toHaveLength(2);
    const drawn = columns.flatMap((column) => textFor(column, VARIANTS.full));
    expect(drawn).toEqual(VARIANTS.full.bullets);
  });

  it("shrinks the title font for a long title", () => {
    const short = buildSlideLayout(content({ title: "Curto" }), design("2_col_argument"));
    // About 150 characters: three lines at 30 pt do not fit the 1.15 in title box.
    const long = buildSlideLayout(
      content({ title: "Um titulo muito mais longo que precisa de varias palavras para dizer a tese do slide e que por isso exige uma fonte menor para caber na caixa do titulo" }),
      design("2_col_argument"),
    );
    const titleSize = (layout: typeof short) =>
      layout.elements.find((element) => element.role === "title")?.fontPt ?? 0;

    expect(titleSize(long)).toBeLessThan(titleSize(short));
  });

  it("marks the callout of a metric slide as a metric", () => {
    const layout = buildSlideLayout(VARIANTS.full, design("metric_highlight"));
    expect(layout.elements.find((element) => element.role === "callout")?.type).toBe("metric");
  });
});

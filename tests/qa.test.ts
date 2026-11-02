import { describe, expect, it } from "vitest";

import { buildSlideLayout } from "../src/core/layout.js";
import {
  SLIDE_RULES,
  SlideContext,
  buildQualityReport,
  evaluateDeck,
  layoutRepetition,
  mergeQualityResults,
  openingIsDistinct,
  scoreIssues,
} from "../src/core/qa.js";
import { buildThemeTokens } from "../src/core/theme.js";
import {
  DesignedSlide,
  QualityIssue,
  SlideArchetype,
  SlideContent,
  SlideLayout,
  SlideQualityResult,
} from "../src/core/types.js";
import { THEME, content, design } from "./helpers.js";

function codesFor(
  slide: SlideContent,
  archetype: SlideArchetype,
  edit: (layout: SlideLayout) => void = () => {},
  theme = THEME,
  designOverrides: Partial<DesignedSlide> = {},
): string[] {
  const slideDesign = design(archetype, designOverrides);
  const layout = buildSlideLayout(slide, slideDesign);
  edit(layout);
  const context: SlideContext = { content: slide, design: slideDesign, layout, theme };

  return SLIDE_RULES.flatMap((rule) => rule(context)).map((issue) => issue.code);
}

describe("slide rules: known defects are reported", () => {
  it("passes a clean slide", () => {
    expect(codesFor(content(), "2_col_argument")).toEqual([]);
  });

  const defects: Array<{
    name: string;
    code: string;
    slide: SlideContent;
    archetype?: SlideArchetype;
    edit?: (layout: SlideLayout) => void;
    theme?: typeof THEME;
    designOverrides?: Partial<DesignedSlide>;
  }> = [
    {
      name: "a slide without a title",
      code: "MISSING_TITLE",
      slide: content({ title: "   " }),
    },
    {
      name: "a title over the character limit",
      code: "TITLE_TOO_LONG",
      slide: content({ title: "x".repeat(73) }),
    },
    {
      name: "more bullets than an executive slide allows",
      code: "TOO_MANY_BULLETS",
      slide: content({ bullets: ["a", "b", "c", "d", "e"] }),
    },
    {
      name: "a bullet that reads like a paragraph",
      code: "BULLET_TOO_LONG",
      slide: content({ bullets: ["y".repeat(91)] }),
    },
    {
      name: "text that needs more room than its box has",
      code: "TEXT_OVERFLOW",
      slide: content({ bullets: Array.from({ length: 4 }, () => "um ponto que ocupa espaco na caixa") }),
      edit: (layout) => {
        const bullets = layout.elements.find((element) => element.role === "bullets");
        if (bullets) {
          bullets.h = 0.3;
        }
      },
    },
    {
      name: "text set below the readable size",
      code: "TEXT_TOO_SMALL",
      slide: content(),
      edit: (layout) => {
        const bullets = layout.elements.find((element) => element.role === "bullets");
        if (bullets) {
          bullets.fontPt = 10;
        }
      },
    },
    {
      name: "a palette whose text color is nearly the background color",
      code: "LOW_CONTRAST",
      slide: content(),
      theme: buildThemeTokens(["#EEEEEE", "#F4EFE6", "#C96F3B"], {
        headline: "Aptos Display",
        body: "Aptos",
      }),
    },
  ];

  for (const defect of defects) {
    it(`flags ${defect.name} as ${defect.code}`, () => {
      const codes = codesFor(
        defect.slide,
        defect.archetype ?? "2_col_argument",
        defect.edit,
        defect.theme,
        defect.designOverrides,
      );

      expect(codes).toContain(defect.code);
    });
  }

  it("uses the 3:1 large-text threshold only for large text", () => {
    // Grey #8A8A8A on white is about 3.5:1: too low for body text, fine for large text.
    const greyTheme = buildThemeTokens(["#8A8A8A", "#FFFFFF", "#C96F3B"], {
      headline: "Aptos Display",
      body: "Aptos",
    });
    const setBulletSize = (fontPt: number) => (layout: SlideLayout) => {
      const bullets = layout.elements.find((element) => element.role === "bullets");
      if (bullets) {
        bullets.fontPt = fontPt;
      }
    };
    const slide = content({ title: "Titulo", bullets: ["Ponto"] });

    const regular = codesFor(slide, "2_col_argument", setBulletSize(14), greyTheme);
    const large = codesFor(slide, "2_col_argument", setBulletSize(24), greyTheme);

    expect(regular).toContain("LOW_CONTRAST");
    expect(large).not.toContain("LOW_CONTRAST");
  });
});

describe("deck rules", () => {
  const archetypes = (list: SlideArchetype[]): DesignedSlide[] =>
    list.map((archetype, index) =>
      design(archetype, { slideId: `s${String(index + 1).padStart(2, "0")}` }),
    );

  it("requires the opening slide to be a hero statement", () => {
    expect(openingIsDistinct(archetypes(["hero_statement", "agenda"]))).toEqual([]);
    expect(openingIsDistinct(archetypes(["agenda", "hero_statement"]))[0]?.code).toBe(
      "OPENING_NOT_DISTINCT",
    );
  });

  it("allows a layout twice in a row and flags it from the third", () => {
    expect(
      layoutRepetition(archetypes(["hero_statement", "agenda", "agenda", "recommendation"])),
    ).toEqual([]);

    const repeated = layoutRepetition(
      archetypes(["hero_statement", "agenda", "agenda", "agenda", "closing_cta"]),
    );
    expect(repeated).toHaveLength(1);
    expect(repeated[0].code).toBe("LAYOUT_REPEATED");
    expect(repeated[0].message).toContain("s02 a s04");
  });

  it("catches a repeated layout at the end of the deck", () => {
    const issues = layoutRepetition(
      archetypes(["hero_statement", "recommendation", "recommendation", "recommendation"]),
    );
    expect(issues).toHaveLength(1);
  });
});

describe("scoring", () => {
  const issue = (severity: QualityIssue["severity"], code = "X"): QualityIssue => ({
    code,
    severity,
    message: "m",
  });

  it("scores 5 and passes without issues", () => {
    expect(scoreIssues("s01", [])).toMatchObject({ score: 5, status: "pass" });
  });

  it("subtracts 2 / 1 / 0.5 for high / medium / low", () => {
    expect(scoreIssues("s01", [issue("low")]).score).toBe(4.5);
    expect(scoreIssues("s01", [issue("medium")]).score).toBe(4);
    expect(scoreIssues("s01", [issue("high")]).score).toBe(3);
  });

  it("warns below 4 and fails on any high-severity issue", () => {
    expect(scoreIssues("s01", [issue("medium"), issue("medium")]).status).toBe("warn");
    expect(scoreIssues("s01", [issue("high")]).status).toBe("fail");
  });

  it("never goes below 1", () => {
    const many = Array.from({ length: 6 }, () => issue("high"));
    expect(scoreIssues("s01", many).score).toBe(1);
  });
});

describe("merging the model critic", () => {
  const objective: SlideQualityResult = {
    slideId: "s01",
    status: "warn",
    score: 3.5,
    issues: [{ code: "TOO_MANY_BULLETS", severity: "medium", message: "m" }],
  };

  it("keeps the objective result when there is no critic", () => {
    expect(mergeQualityResults(objective, null)).toEqual(objective);
  });

  it("cannot erase an objective issue even when the critic gives a perfect score", () => {
    const merged = mergeQualityResults(objective, {
      slideId: "s01",
      status: "pass",
      score: 5,
      issues: [],
    });

    expect(merged.issues.map((issue) => issue.code)).toContain("TOO_MANY_BULLETS");
    expect(merged.score).toBe(3.5);
    expect(merged.status).toBe("warn");
  });

  it("adds new critic issues, takes the lower score and the worse status", () => {
    const merged = mergeQualityResults(objective, {
      slideId: "s01",
      status: "fail",
      score: 2,
      issues: [
        { code: "VAGUE_TITLE", severity: "high", message: "titulo vago" },
        { code: "TOO_MANY_BULLETS", severity: "medium", message: "duplicada" },
      ],
    });

    expect(merged.issues.map((issue) => issue.code)).toEqual(["TOO_MANY_BULLETS", "VAGUE_TITLE"]);
    expect(merged.score).toBe(2);
    expect(merged.status).toBe("fail");
  });
});

describe("report verdict", () => {
  const pass = (slideId: string, score = 5): SlideQualityResult => ({
    slideId,
    status: "pass",
    score,
    issues: [],
  });

  it("is ready when the average is at least 4 and nothing fails", () => {
    expect(buildQualityReport([pass("s01"), pass("s02", 4)]).verdict).toBe("ready");
  });

  it("needs work when the average is under 4", () => {
    expect(buildQualityReport([pass("s01", 4), pass("s02", 3)]).verdict).toBe("needs_work");
  });

  it("needs work when one slide fails, even with a high average", () => {
    const failing: SlideQualityResult = { slideId: "s03", status: "fail", score: 4, issues: [] };
    expect(buildQualityReport([pass("s01"), pass("s02"), failing]).verdict).toBe("needs_work");
  });

  it("needs work on a high-severity deck issue", () => {
    const deckIssue: QualityIssue = { code: "OPENING_NOT_DISTINCT", severity: "high", message: "m" };
    expect(buildQualityReport([pass("s01")], [deckIssue]).verdict).toBe("needs_work");
  });
});

describe("evaluateDeck", () => {
  it("reports a deck whose slides share one layout and has no hero opening", () => {
    const slides = ["s01", "s02", "s03"].map((slideId) => content({ slideId }));
    const designs = slides.map((slide) => design("2_col_argument", { slideId: slide.slideId }));
    const layouts = slides.map((slide, index) => buildSlideLayout(slide, designs[index]));

    const report = evaluateDeck({ contents: slides, designs, layouts, theme: THEME });

    expect(report.deckIssues.map((issue) => issue.code).sort()).toEqual([
      "LAYOUT_REPEATED",
      "OPENING_NOT_DISTINCT",
    ]);
    expect(report.verdict).toBe("needs_work");
  });
});

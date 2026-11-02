import { readFileSync } from "node:fs";
import path from "node:path";

import { buildThemeTokens } from "../src/core/theme.js";
import { normalizeBrief } from "../src/core/normalize.js";
import { validatePresentationInput } from "../src/core/validation.js";
import {
  DesignedSlide,
  NormalizedBrief,
  SlideArchetype,
  SlideContent,
} from "../src/core/types.js";

export const ARCHETYPES: SlideArchetype[] = [
  "hero_statement",
  "agenda",
  "section_break",
  "2_col_argument",
  "metric_highlight",
  "comparison_matrix",
  "recommendation",
  "closing_cta",
];

export const SAMPLE_BRIEF_PATH = path.resolve("data/examples/briefing.sample.json");

export const THEME = buildThemeTokens(["#171717", "#F4EFE6", "#C96F3B"], {
  headline: "Aptos Display",
  body: "Aptos",
});

export function content(overrides: Partial<SlideContent> = {}): SlideContent {
  return {
    slideId: "s01",
    title: "Titulo curto e claro",
    bullets: ["Primeiro ponto claro", "Segundo ponto claro", "Terceiro ponto claro"],
    speakerNote: "nota",
    ...overrides,
  };
}

export function design(
  archetype: SlideArchetype,
  overrides: Partial<DesignedSlide> = {},
): DesignedSlide {
  return {
    slideId: "s01",
    archetype,
    visualPriority: "text-first",
    backgroundStyle: "light",
    accentColor: "#C96F3B",
    ...overrides,
  };
}

export function sampleBrief(): NormalizedBrief {
  const raw = JSON.parse(readFileSync(SAMPLE_BRIEF_PATH, "utf8"));
  return normalizeBrief(validatePresentationInput(raw));
}

import {
  PlannedSlide,
  PresentationPlan,
  QualityIssue,
  SlideArchetype,
  SlideContent,
  SlidePurpose,
  SlideQualityResult,
} from "../core/types.js";

/**
 * Structural guardrails for model output. Models return JSON that is valid
 * but not necessarily in the shape the pipeline expects, so every response is
 * checked here and anything malformed is rejected (the caller then falls back
 * to the deterministic stage). Content quality is judged later by the QA
 * rules, not here: a long bullet is kept and flagged, a missing field is not.
 */
const ARCHETYPES: readonly SlideArchetype[] = [
  "hero_statement",
  "agenda",
  "section_break",
  "2_col_argument",
  "metric_highlight",
  "comparison_matrix",
  "recommendation",
  "closing_cta",
];

const PURPOSES: readonly SlidePurpose[] = [
  "title",
  "section",
  "argument",
  "data",
  "comparison",
  "closing",
];

const SEVERITIES: ReadonlyArray<QualityIssue["severity"]> = ["low", "medium", "high"];
const STATUSES: ReadonlyArray<SlideQualityResult["status"]> = ["pass", "warn", "fail"];

const MIN_SLIDES = 2;
const MAX_SLIDES = 30;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

export function parsePlan(value: unknown): PresentationPlan | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.slides) ||
    value.slides.length < MIN_SLIDES ||
    value.slides.length > MAX_SLIDES
  ) {
    return null;
  }

  const seen = new Set<string>();
  const slides: PlannedSlide[] = [];

  for (const raw of value.slides) {
    if (!isRecord(raw)) {
      return null;
    }

    const slideId = text(raw.slideId);
    const keyMessage = text(raw.keyMessage);
    const purpose = oneOf(raw.purpose, PURPOSES);
    const recommendedArchetype = oneOf(raw.recommendedArchetype, ARCHETYPES);

    if (!slideId || !keyMessage || !purpose || !recommendedArchetype || seen.has(slideId)) {
      return null;
    }

    seen.add(slideId);
    slides.push({
      slideId,
      section: text(raw.section) ?? "body",
      purpose,
      topic: text(raw.topic),
      keyMessage,
      speakerIntent: text(raw.speakerIntent) ?? "",
      recommendedArchetype,
    });
  }

  return {
    title: text(value.title) ?? "",
    openingStrategy: text(value.openingStrategy) ?? "",
    flowLogic: text(value.flowLogic) ?? "",
    closingStrategy: text(value.closingStrategy) ?? "",
    slides,
  };
}

export function parseSlideContent(
  value: unknown,
  slideId: string,
): SlideContent | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = text(value.title);
  if (!title) {
    return null;
  }

  const rawBullets = value.bullets ?? [];
  if (!Array.isArray(rawBullets) || rawBullets.some((item) => typeof item !== "string")) {
    return null;
  }

  return {
    // The plan owns the id; a model that renames it must not break the layout mapping.
    slideId,
    title,
    subtitle: text(value.subtitle),
    bullets: (rawBullets as string[]).map((item) => item.trim()).filter(Boolean),
    callout: text(value.callout),
    speakerNote: text(value.speakerNote) ?? "",
  };
}

export function parseCriticResult(
  value: unknown,
  slideId: string,
): SlideQualityResult | null {
  if (!isRecord(value) || typeof value.score !== "number" || !Number.isFinite(value.score)) {
    return null;
  }

  const issues: QualityIssue[] = [];
  if (Array.isArray(value.issues)) {
    for (const raw of value.issues) {
      if (!isRecord(raw)) {
        continue;
      }

      const code = text(raw.code);
      const message = text(raw.message);
      const severity = oneOf(raw.severity, SEVERITIES);
      if (code && message && severity) {
        issues.push({ code, severity, message });
      }
    }
  }

  const score = Math.min(5, Math.max(1, value.score));
  const status =
    oneOf(value.status, STATUSES) ?? (score <= 2 ? "fail" : score < 4 ? "warn" : "pass");

  return { slideId, status, score, issues };
}

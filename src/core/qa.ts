import { contrastRatio } from "./color.js";
import { LIMITS } from "./limits.js";
import { fitOptionsFor, textFor } from "./layout.js";
import { surfaceColor, textColor } from "./style.js";
import { ThemeTokens } from "./theme.js";
import { estimateHeightIn } from "./text-fit.js";
import {
  DesignedSlide,
  QualityIssue,
  QualityReport,
  SlideContent,
  SlideLayout,
  SlideQualityResult,
} from "./types.js";

/**
 * Objective checks from docs/05-slide-quality-rubric.md. Each rule is a small
 * pure function so it can be tested on its own. Subjective judgement (does the
 * title state the thesis?) is left to the model critic and merged afterwards.
 */
export interface SlideContext {
  content: SlideContent;
  design: DesignedSlide;
  layout: SlideLayout;
  theme: ThemeTokens;
}

export type SlideRule = (context: SlideContext) => QualityIssue[];
export type DeckRule = (designs: DesignedSlide[]) => QualityIssue[];

const OVERFLOW_TOLERANCE_IN = 0.02;

export const missingTitle: SlideRule = ({ content }) =>
  content.title.trim() === ""
    ? [{ code: "MISSING_TITLE", severity: "high", message: "O slide nao tem titulo." }]
    : [];

export const titleLength: SlideRule = ({ content }) =>
  content.title.length > LIMITS.maxTitleChars
    ? [
        {
          code: "TITLE_TOO_LONG",
          severity: "medium",
          message: `Titulo com ${content.title.length} caracteres; o limite para leitura rapida e ${LIMITS.maxTitleChars}.`,
        },
      ]
    : [];

export const bulletCount: SlideRule = ({ content }) =>
  content.bullets.length > LIMITS.maxBullets
    ? [
        {
          code: "TOO_MANY_BULLETS",
          severity: "medium",
          message: `${content.bullets.length} bullets; o maximo para um slide executivo e ${LIMITS.maxBullets}.`,
        },
      ]
    : [];

export const bulletLength: SlideRule = ({ content }) =>
  content.bullets.some((bullet) => bullet.length > LIMITS.maxBulletChars)
    ? [
        {
          code: "BULLET_TOO_LONG",
          severity: "low",
          message: `Ha bullet com mais de ${LIMITS.maxBulletChars} caracteres.`,
        },
      ]
    : [];

export const textOverflow: SlideRule = ({ content, layout }) =>
  layout.elements.flatMap((element) => {
    if (element.type === "shape" || element.fontPt === undefined) {
      return [];
    }

    const needed = estimateHeightIn(
      textFor(element, content),
      element.w,
      element.fontPt,
      fitOptionsFor(element),
    );

    return needed > element.h + OVERFLOW_TOLERANCE_IN
      ? [
          {
            code: "TEXT_OVERFLOW",
            severity: "high" as const,
            message: `O texto de "${element.id}" precisa de cerca de ${needed.toFixed(2)} in e a caixa tem ${element.h.toFixed(2)} in.`,
          },
        ]
      : [];
  });

export const smallText: SlideRule = ({ layout }) =>
  layout.elements
    .filter(
      (element) =>
        element.type !== "shape" &&
        element.fontPt !== undefined &&
        element.fontPt < LIMITS.minTextPt,
    )
    .map((element) => ({
      code: "TEXT_TOO_SMALL",
      severity: "medium" as const,
      message: `"${element.id}" usa ${element.fontPt} pt; o minimo para leitura confortavel e ${LIMITS.minTextPt} pt.`,
    }));

/** WCAG: text is "large" from 18 pt regular or 14 pt bold. */
function isLargeText(fontPt: number, bold: boolean): boolean {
  return fontPt >= 18 || (bold && fontPt >= 14);
}

export const lowContrast: SlideRule = ({ content, design, layout, theme }) =>
  layout.elements.flatMap((element) => {
    if (
      element.type === "shape" ||
      element.fontPt === undefined ||
      textFor(element, content).length === 0
    ) {
      return [];
    }

    const ratio = contrastRatio(
      textColor(element, design, theme),
      surfaceColor(element, design, theme),
    );
    const required = isLargeText(element.fontPt, element.bold ?? false)
      ? LIMITS.minContrastLarge
      : LIMITS.minContrastNormal;

    return ratio < required
      ? [
          {
            code: "LOW_CONTRAST",
            severity: "high" as const,
            message: `Contraste ${ratio.toFixed(2)}:1 em "${element.id}"; o minimo e ${required}:1.`,
          },
        ]
      : [];
  });

export const SLIDE_RULES: SlideRule[] = [
  missingTitle,
  titleLength,
  bulletCount,
  bulletLength,
  textOverflow,
  smallText,
  lowContrast,
];

export const openingIsDistinct: DeckRule = (designs) =>
  designs.length > 0 && designs[0].archetype !== "hero_statement"
    ? [
        {
          code: "OPENING_NOT_DISTINCT",
          severity: "high",
          message: "O slide de abertura parece um slide de conteudo comum.",
        },
      ]
    : [];

export const layoutRepetition: DeckRule = (designs) => {
  const issues: QualityIssue[] = [];
  let runStart = 0;

  for (let index = 1; index <= designs.length; index += 1) {
    const sameAsPrevious =
      index < designs.length &&
      designs[index].archetype === designs[runStart].archetype;
    if (sameAsPrevious) {
      continue;
    }

    const runLength = index - runStart;
    if (runLength > LIMITS.maxSameArchetypeInRow) {
      issues.push({
        code: "LAYOUT_REPEATED",
        severity: "medium",
        message: `O layout "${designs[runStart].archetype}" se repete por ${runLength} slides seguidos (${designs[runStart].slideId} a ${designs[index - 1].slideId}).`,
      });
    }
    runStart = index;
  }

  return issues;
};

export const DECK_RULES: DeckRule[] = [openingIsDistinct, layoutRepetition];

const PENALTY: Record<QualityIssue["severity"], number> = {
  high: 2,
  medium: 1,
  low: 0.5,
};

export function scoreIssues(
  slideId: string,
  issues: QualityIssue[],
): SlideQualityResult {
  const penalty = issues.reduce((sum, issue) => sum + PENALTY[issue.severity], 0);
  const score = Math.max(1, 5 - penalty);
  const hasHigh = issues.some((issue) => issue.severity === "high");

  return {
    slideId,
    status:
      hasHigh || score <= 2 ? "fail" : score < LIMITS.readyScore ? "warn" : "pass",
    score,
    issues,
  };
}

const STATUS_ORDER: SlideQualityResult["status"][] = ["pass", "warn", "fail"];

/**
 * Combines the objective result with the model critic's. The objective issues
 * always survive: the model can add problems, never remove them.
 */
export function mergeQualityResults(
  objective: SlideQualityResult,
  critic: SlideQualityResult | null,
): SlideQualityResult {
  if (!critic) {
    return objective;
  }

  const seen = new Set(objective.issues.map((issue) => issue.code));
  const extra = critic.issues.filter((issue) => !seen.has(issue.code));
  const worstStatus = [objective.status, critic.status].sort(
    (a, b) => STATUS_ORDER.indexOf(b) - STATUS_ORDER.indexOf(a),
  )[0];

  return {
    slideId: objective.slideId,
    status: worstStatus,
    score: Math.min(objective.score, critic.score),
    issues: [...objective.issues, ...extra],
  };
}

export function buildQualityReport(
  slideResults: SlideQualityResult[],
  deckIssues: QualityIssue[] = [],
): QualityReport {
  const total = slideResults.reduce((sum, result) => sum + result.score, 0);
  const averageScore =
    slideResults.length === 0 ? 0 : Number((total / slideResults.length).toFixed(2));

  const ready =
    averageScore >= LIMITS.readyScore &&
    slideResults.every((result) => result.status !== "fail") &&
    deckIssues.every((issue) => issue.severity !== "high");

  return {
    generatedAt: new Date().toISOString(),
    averageScore,
    slideResults,
    deckIssues,
    verdict: ready ? "ready" : "needs_work",
  };
}

export interface EvaluateDeckInput {
  contents: SlideContent[];
  designs: DesignedSlide[];
  layouts: SlideLayout[];
  theme: ThemeTokens;
  /** Optional model critic results, one per slide (null where the call failed). */
  critics?: Array<SlideQualityResult | null>;
}

export function evaluateDeck({
  contents,
  designs,
  layouts,
  theme,
  critics = [],
}: EvaluateDeckInput): QualityReport {
  const slideResults = contents.map((content, index) => {
    const context: SlideContext = {
      content,
      design: designs[index],
      layout: layouts[index],
      theme,
    };
    const issues = SLIDE_RULES.flatMap((rule) => rule(context));

    return mergeQualityResults(
      scoreIssues(content.slideId, issues),
      critics[index] ?? null,
    );
  });

  const deckIssues = DECK_RULES.flatMap((rule) => rule(designs));
  return buildQualityReport(slideResults, deckIssues);
}

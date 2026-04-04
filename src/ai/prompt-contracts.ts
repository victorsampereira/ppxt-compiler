import {
  NormalizedBrief,
  PresentationPlan,
  SlideContent,
  SlideQualityResult,
} from "../core/types.js";

export interface PromptSpec {
  id: string;
  version: string;
  instructions: string;
  input: string;
}

export function buildPlannerPrompt(brief: NormalizedBrief): PromptSpec {
  return {
    id: "planner.presentation-plan",
    version: "1.0.0",
    instructions:
      "Voce e o planejador narrativo de uma apresentacao profissional. Gere apenas JSON valido. Nao inclua markdown. Cada slide deve ter exatamente uma mensagem principal.",
    input: JSON.stringify(
      {
        task: "Create a presentation plan",
        output_schema: {
          title: "string",
          openingStrategy: "string",
          flowLogic: "string",
          closingStrategy: "string",
          slides: [
            {
              slideId: "s01",
              section: "opening|body|closing",
              purpose: "title|section|argument|data|comparison|closing",
              keyMessage: "string",
              speakerIntent: "string",
              recommendedArchetype:
                "hero_statement|agenda|section_break|2_col_argument|metric_highlight|comparison_matrix|recommendation|closing_cta",
            },
          ],
        },
        normalized_brief: brief,
      },
      null,
      2,
    ),
  };
}

export function buildWriterPrompt(
  brief: NormalizedBrief,
  plan: PresentationPlan,
  slideIndex: number,
): PromptSpec {
  const slide = plan.slides[slideIndex];
  const previousSlide = slideIndex > 0 ? plan.slides[slideIndex - 1] : null;
  const nextSlide =
    slideIndex < plan.slides.length - 1 ? plan.slides[slideIndex + 1] : null;

  return {
    id: "writer.slide-content",
    version: "1.0.0",
    instructions:
      "Voce escreve o conteudo de um unico slide para uma apresentacao executiva. Gere apenas JSON valido. O texto deve ser curto, claro e proprio para slide, nao para documento.",
    input: JSON.stringify(
      {
        task: "Write content for one slide",
        output_schema: {
          slideId: slide.slideId,
          title: "string",
          subtitle: "string | undefined",
          bullets: ["string"],
          callout: "string | undefined",
          speakerNote: "string",
        },
        normalized_brief: {
          title: brief.title,
          goal: brief.goal,
          audience: brief.audience,
          tone: brief.tone,
          designKeywords: brief.designKeywords,
          forbiddenPatterns: brief.forbiddenPatterns,
        },
        slide_packet: {
          current: slide,
          previousSlide,
          nextSlide,
          constraints: {
            maxBullets: 4,
            maxWordsPerBullet: 12,
          },
        },
      },
      null,
      2,
    ),
  };
}

export function buildCriticPrompt(
  brief: NormalizedBrief,
  slide: SlideContent,
): PromptSpec {
  return {
    id: "critic.slide-quality",
    version: "1.0.0",
    instructions:
      "Voce e um critic de qualidade de slides. Gere apenas JSON valido. Identifique falhas objetivas e devolva score de 1 a 5.",
    input: JSON.stringify(
      {
        task: "Evaluate one slide",
        output_schema: {
          slideId: slide.slideId,
          status: "pass|warn|fail",
          score: "number",
          issues: [
            {
              code: "string",
              severity: "low|medium|high",
              message: "string",
            },
          ],
        },
        presentation_context: {
          goal: brief.goal,
          audience: brief.audience,
          tone: brief.tone,
        },
        slide,
      },
      null,
      2,
    ),
  };
}

export function mergeCriticResults(
  fallback: SlideQualityResult,
  modelResult: SlideQualityResult | null,
): SlideQualityResult {
  if (!modelResult) {
    return fallback;
  }

  return {
    slideId: fallback.slideId,
    status: modelResult.status,
    score: modelResult.score,
    issues: modelResult.issues,
  };
}


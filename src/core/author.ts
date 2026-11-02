import { LIMITS } from "./limits.js";
import {
  NormalizedBrief,
  PlannedSlide,
  PresentationPlan,
  SlideContent,
} from "./types.js";

/**
 * Deterministic fallback writer. Its copy is placeholder text built from the
 * brief; it exists so the layout, render and QA stages can run offline and in
 * CI. Real slide copy comes from the model (see src/ai/pipeline-ai.ts).
 */
function capitalize(text: string): string {
  const trimmed = text.trim();
  return trimmed === "" ? trimmed : trimmed[0].toUpperCase() + trimmed.slice(1);
}

function topicOf(slide: PlannedSlide): string {
  return (
    slide.topic ?? capitalize(slide.keyMessage.split(":")[0].split(" deve ")[0])
  );
}

function scriptClauses(script: string): string[] {
  return script
    .split(/[,;.]| e /i)
    .map((clause) => clause.trim())
    .filter((clause) => clause.length > 3);
}

function matchClause(topic: string, clauses: string[]): string | undefined {
  const needle = topic.toLowerCase();
  return clauses.find((clause) => clause.toLowerCase().includes(needle));
}

export function writeSlides(
  brief: NormalizedBrief,
  plan: PresentationPlan,
): SlideContent[] {
  const clauses = scriptClauses(brief.sourceScript);

  return plan.slides.map((slide): SlideContent => {
    const topic = topicOf(slide);

    if (slide.purpose === "title") {
      return {
        slideId: slide.slideId,
        title: brief.title,
        subtitle: capitalize(brief.goal),
        bullets: [
          `Publico: ${brief.audience}`,
          `Tom: ${brief.tone}`,
          `Duracao: ${brief.durationMinutes} min`,
        ],
        speakerNote: slide.speakerIntent,
      };
    }

    if (slide.purpose === "closing") {
      return {
        slideId: slide.slideId,
        title: capitalize(topic),
        bullets: brief.contentPriority
          .slice(0, LIMITS.maxBullets)
          .map((item) => `Retomar: ${item}`),
        callout: capitalize(brief.goal),
        speakerNote: slide.speakerIntent,
      };
    }

    const clause = matchClause(topic, clauses);
    return {
      slideId: slide.slideId,
      title: capitalize(topic),
      bullets: [
        `Publico: ${brief.audience}`,
        ...brief.forbiddenPatterns.slice(0, 2).map((item) => `Evitar: ${item}`),
      ].slice(0, LIMITS.maxBullets),
      callout: clause ? capitalize(clause) : undefined,
      speakerNote: slide.speakerIntent,
    };
  });
}

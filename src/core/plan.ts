import {
  NormalizedBrief,
  PlannedSlide,
  PresentationPlan,
  SlideArchetype,
  SlidePurpose,
} from "./types.js";

function inferArchetype(index: number, purpose: SlidePurpose): SlideArchetype {
  if (purpose === "title") {
    return "hero_statement";
  }

  if (purpose === "closing") {
    return "closing_cta";
  }

  if (purpose === "section") {
    return "section_break";
  }

  if (purpose === "comparison") {
    return "comparison_matrix";
  }

  if (purpose === "data") {
    return "metric_highlight";
  }

  return index % 2 === 0 ? "2_col_argument" : "recommendation";
}

function inferPurpose(topic: string, index: number, total: number): SlidePurpose {
  if (index === 0) {
    return "title";
  }

  if (index === total - 1) {
    return "closing";
  }

  const lowerTopic = topic.toLowerCase();
  if (lowerTopic.includes("agenda") || lowerTopic.includes("visao geral")) {
    return "section";
  }

  if (
    lowerTopic.includes("mvp") ||
    lowerTopic.includes("roadmap") ||
    lowerTopic.includes("proximos passos")
  ) {
    return "comparison";
  }

  if (
    lowerTopic.includes("numero") ||
    lowerTopic.includes("impacto") ||
    lowerTopic.includes("resultado")
  ) {
    return "data";
  }

  return "argument";
}

function buildKeyMessage(topic: string, brief: NormalizedBrief): string {
  return `${topic} deve reforcar o objetivo central: ${brief.goal}`;
}

export function createPresentationPlan(
  brief: NormalizedBrief,
): PresentationPlan {
  const topics = [
    "Abertura",
    ...brief.contentPriority,
    "Recomendacao final",
  ];

  const slides: PlannedSlide[] = topics.map((topic, index) => {
    const purpose = inferPurpose(topic, index, topics.length);

    return {
      slideId: `s${String(index + 1).padStart(2, "0")}`,
      section: index < 2 ? "opening" : index === topics.length - 1 ? "closing" : "body",
      purpose,
      keyMessage: buildKeyMessage(topic, brief),
      speakerIntent:
        purpose === "closing"
          ? "encerrar com decisao clara e proximo passo"
          : `explicar ${topic.toLowerCase()} com foco em clareza executiva`,
      recommendedArchetype: inferArchetype(index, purpose),
    };
  });

  return {
    title: brief.title,
    openingStrategy: "abrir com uma tese forte e orientada ao valor",
    flowLogic: "problema, abordagem, arquitetura, MVP e recomendacao",
    closingStrategy: "encerrar com decisao e proximo passo",
    slides,
  };
}


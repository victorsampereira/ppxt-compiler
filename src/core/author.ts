import {
  NormalizedBrief,
  PresentationPlan,
  SlideContent,
  SlidePurpose,
} from "./types.js";

function buildTitle(purpose: SlidePurpose, keyMessage: string): string {
  if (purpose === "title") {
    return keyMessage.replace("deve reforcar o objetivo central: ", "");
  }

  if (purpose === "closing") {
    return "Proximo passo recomendado";
  }

  return keyMessage.split(":")[0];
}

function buildBullets(
  purpose: SlidePurpose,
  topic: string,
  brief: NormalizedBrief,
): string[] {
  if (purpose === "title") {
    return [
      `Objetivo: ${brief.goal}`,
      `Publico: ${brief.audience}`,
      `Tom: ${brief.tone}`,
    ];
  }

  if (purpose === "closing") {
    return [
      "Construir o MVP local com pipeline rastreavel",
      "Padronizar layouts e rubrica de qualidade",
      "Integrar IA primeiro no planejamento e na critica",
    ];
  }

  return [
    `${topic} precisa ser comunicado com clareza imediata`,
    "O slide deve ter uma hierarquia visual dominante",
    "A composicao precisa evitar cara de template generico",
  ];
}

export function writeSlides(
  brief: NormalizedBrief,
  plan: PresentationPlan,
): SlideContent[] {
  return plan.slides.map((slide) => ({
    slideId: slide.slideId,
    title: buildTitle(slide.purpose, slide.keyMessage),
    subtitle:
      slide.purpose === "title"
        ? brief.title
        : slide.section === "body"
          ? "Estrutura do MVP orientada a qualidade"
          : undefined,
    bullets: buildBullets(slide.purpose, slide.keyMessage, brief),
    callout:
      slide.purpose === "comparison"
        ? "Comparar opcoes tecnicas com impacto em qualidade e custo"
        : undefined,
    speakerNote: slide.speakerIntent,
  }));
}


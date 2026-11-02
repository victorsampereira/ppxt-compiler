import {
  DesignedSlide,
  PresentationPlan,
  SlideArchetype,
} from "./types.js";

const DEFAULT_ACCENT = "#C96F3B";

function backgroundFor(archetype: SlideArchetype): DesignedSlide["backgroundStyle"] {
  switch (archetype) {
    case "hero_statement":
    case "closing_cta":
      return "dark";
    case "section_break":
      return "accent";
    default:
      return "light";
  }
}

export function resolveDesignPlan(
  plan: PresentationPlan,
  brandColors: string[],
): DesignedSlide[] {
  // Same accent the theme uses (third brand color), so the deck stays cohesive.
  const accentColor = brandColors[2] ?? DEFAULT_ACCENT;

  return plan.slides.map((slide) => ({
    slideId: slide.slideId,
    archetype: slide.recommendedArchetype,
    visualPriority:
      slide.purpose === "data"
        ? "number-first"
        : slide.purpose === "title"
          ? "balanced"
          : "text-first",
    backgroundStyle: backgroundFor(slide.recommendedArchetype),
    accentColor,
  }));
}

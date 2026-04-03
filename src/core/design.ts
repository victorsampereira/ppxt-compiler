import { DesignedSlide, PresentationPlan } from "./types.js";

const FALLBACK_COLORS = ["#1E1E1E", "#C96F3B", "#1F5E5B", "#E9E2D3"];

export function resolveDesignPlan(
  plan: PresentationPlan,
  brandColors: string[],
): DesignedSlide[] {
  const palette = brandColors.length > 0 ? brandColors : FALLBACK_COLORS;

  return plan.slides.map((slide, index) => ({
    slideId: slide.slideId,
    archetype: slide.recommendedArchetype,
    visualPriority:
      slide.purpose === "data"
        ? "number-first"
        : slide.purpose === "title"
          ? "balanced"
          : "text-first",
    backgroundStyle:
      slide.purpose === "title"
        ? "dark"
        : index % 3 === 0
          ? "accent"
          : "light",
    accentColor: palette[index % palette.length],
  }));
}


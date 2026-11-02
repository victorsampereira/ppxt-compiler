import { pickReadable } from "./color.js";
import { DesignedSlide, LayoutElement } from "./types.js";
import { ThemeTokens } from "./theme.js";

/**
 * Colors are resolved here, once, and used by both the renderer and the QA
 * contrast rule, so the check always judges the colors that are drawn.
 */
export function slideBackground(
  design: DesignedSlide,
  theme: ThemeTokens,
): string {
  switch (design.backgroundStyle) {
    case "dark":
      return theme.background.dark;
    case "accent":
      return design.accentColor;
    default:
      return theme.background.light;
  }
}

/** Color the element's text sits on: the light card or the slide background. */
export function surfaceColor(
  element: LayoutElement,
  design: DesignedSlide,
  theme: ThemeTokens,
): string {
  return element.surface === "panel"
    ? theme.background.light
    : slideBackground(design, theme);
}

/** Picks the more readable of the theme's text colors for this surface. */
export function textColor(
  element: LayoutElement,
  design: DesignedSlide,
  theme: ThemeTokens,
): string {
  const surface = surfaceColor(element, design, theme);
  const candidates =
    element.role === "meta"
      ? [theme.text.muted, theme.text.mutedInverted]
      : [theme.text.primary, theme.text.inverted];

  return pickReadable(surface, candidates);
}

/** Accent rules disappear on an accent background, so they take the text color there. */
export function ruleColor(design: DesignedSlide, theme: ThemeTokens): string {
  return design.backgroundStyle === "accent"
    ? pickReadable(design.accentColor, [theme.text.primary, theme.text.inverted])
    : design.accentColor;
}

export interface ThemeTokens {
  background: {
    light: string;
    dark: string;
    accent: string;
  };
  text: {
    primary: string;
    inverted: string;
    muted: string;
  };
  accent: string;
  fontFace: {
    headline: string;
    body: string;
  };
}

export function buildThemeTokens(
  colors: string[],
  fonts: { headline: string; body: string },
): ThemeTokens {
  return {
    background: {
      light: colors[1] ?? "#F3F0E8",
      dark: colors[0] ?? "#161616",
      accent: colors[2] ?? "#C96F3B",
    },
    text: {
      primary: colors[0] ?? "#161616",
      inverted: "#FFFFFF",
      muted: "#5E5A55",
    },
    accent: colors[2] ?? "#C96F3B",
    fontFace: {
      headline: fonts.headline || "Aptos Display",
      body: fonts.body || "Aptos",
    },
  };
}


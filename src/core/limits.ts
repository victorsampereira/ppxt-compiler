/**
 * Objective limits taken from docs/05-slide-quality-rubric.md.
 * The writer prompt contract and the QA rules share these numbers so the
 * model is asked for exactly what the rubric later checks.
 */
export const LIMITS = {
  maxTitleChars: 72,
  maxBullets: 4,
  maxWordsPerBullet: 12,
  maxBulletChars: 90,
  minTextPt: 12,
  /** WCAG 2.x contrast for normal and large text. */
  minContrastNormal: 4.5,
  minContrastLarge: 3,
  /** Rubric: "repeticao de um mesmo layout por muitas paginas seguidas". */
  maxSameArchetypeInRow: 2,
  /** Rubric: "media geral minima de 4 para considerar pronto". */
  readyScore: 4,
} as const;

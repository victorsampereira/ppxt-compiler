import { QualityReport, SlideContent, SlideQualityResult } from "./types.js";

function scoreSlide(content: SlideContent): SlideQualityResult {
  const issues = [];
  let score = 5;

  if (content.title.length > 72) {
    score -= 1;
    issues.push({
      code: "TITLE_TOO_LONG",
      severity: "medium" as const,
      message: "Titulo acima do limite recomendado para leitura rapida.",
    });
  }

  if (content.bullets.length > 4) {
    score -= 1;
    issues.push({
      code: "TOO_MANY_BULLETS",
      severity: "medium" as const,
      message: "Quantidade de bullets acima do ideal para um slide executivo.",
    });
  }

  if (content.bullets.some((bullet) => bullet.length > 90)) {
    score -= 1;
    issues.push({
      code: "BULLET_TOO_LONG",
      severity: "low" as const,
      message: "Ha bullet com comprimento excessivo.",
    });
  }

  return {
    slideId: content.slideId,
    status: score <= 2 ? "fail" : score === 3 ? "warn" : "pass",
    score,
    issues,
  };
}

export function evaluateSlides(contents: SlideContent[]): QualityReport {
  const slideResults = contents.map(scoreSlide);
  const totalScore = slideResults.reduce((sum, item) => sum + item.score, 0);

  return {
    generatedAt: new Date().toISOString(),
    averageScore: Number((totalScore / slideResults.length).toFixed(2)),
    slideResults,
  };
}


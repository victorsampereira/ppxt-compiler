import { NormalizedBrief, PresentationInput } from "./types.js";

function inferIntent(goal: string): NormalizedBrief["presentationIntent"] {
  const lowerGoal = goal.toLowerCase();

  if (lowerGoal.includes("convencer") || lowerGoal.includes("aprovar")) {
    return "persuasion";
  }

  if (lowerGoal.includes("atualizar") || lowerGoal.includes("status")) {
    return "update";
  }

  return "explanation";
}

function extractKeywords(value: string): string[] {
  return value
    .split(/[,.]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function normalizeBrief(input: PresentationInput): NormalizedBrief {
  return {
    projectId: input.project_id,
    title: input.presentation.title,
    goal: input.presentation.goal,
    audience: input.presentation.audience,
    tone: input.presentation.tone,
    language: input.presentation.language,
    durationMinutes: input.presentation.duration_minutes,
    presentationIntent: inferIntent(input.presentation.goal),
    designKeywords: extractKeywords(input.briefing.design_direction),
    contentPriority: input.briefing.must_include,
    forbiddenPatterns: input.briefing.must_avoid,
    sourceScript: input.briefing.script,
    brandKit: input.brand_kit,
  };
}


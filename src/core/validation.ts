import {
  PresentationInput,
  PresentationAudience,
  PresentationTone,
} from "./types.js";

const AUDIENCES: PresentationAudience[] = [
  "executive",
  "sales",
  "investor",
  "training",
  "academic",
];

const TONES: PresentationTone[] = ["premium", "formal", "bold", "minimal"];

function assertString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Campo invalido: ${field}`);
  }

  return value.trim();
}

function assertStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Campo invalido: ${field}`);
  }

  return value.map((item) => item.trim()).filter(Boolean);
}

export function validatePresentationInput(value: unknown): PresentationInput {
  if (typeof value !== "object" || value === null) {
    throw new Error("O briefing precisa ser um objeto JSON valido.");
  }

  const input = value as Record<string, unknown>;
  const presentation = input.presentation as Record<string, unknown>;
  const briefing = input.briefing as Record<string, unknown>;
  const brandKit = input.brand_kit as Record<string, unknown>;
  const fonts = brandKit.fonts as Record<string, unknown>;

  const audience = assertString(presentation.audience, "presentation.audience");
  if (!AUDIENCES.includes(audience as PresentationAudience)) {
    throw new Error("Audience invalida.");
  }

  const tone = assertString(presentation.tone, "presentation.tone");
  if (!TONES.includes(tone as PresentationTone)) {
    throw new Error("Tone invalido.");
  }

  return {
    project_id: assertString(input.project_id, "project_id"),
    presentation: {
      title: assertString(presentation.title, "presentation.title"),
      goal: assertString(presentation.goal, "presentation.goal"),
      audience: audience as PresentationAudience,
      tone: tone as PresentationTone,
      language: assertString(presentation.language, "presentation.language"),
      duration_minutes: Number(presentation.duration_minutes),
    },
    briefing: {
      script: assertString(briefing.script, "briefing.script"),
      design_direction: assertString(
        briefing.design_direction,
        "briefing.design_direction",
      ),
      must_include: assertStringArray(
        briefing.must_include,
        "briefing.must_include",
      ),
      must_avoid: assertStringArray(briefing.must_avoid, "briefing.must_avoid"),
    },
    brand_kit: {
      brand_name: assertString(brandKit.brand_name, "brand_kit.brand_name"),
      logo_path:
        typeof brandKit.logo_path === "string" ? brandKit.logo_path.trim() : "",
      colors: assertStringArray(brandKit.colors, "brand_kit.colors"),
      fonts: {
        headline: assertString(fonts.headline, "brand_kit.fonts.headline"),
        body: assertString(fonts.body, "brand_kit.fonts.body"),
      },
    },
    data_sources: assertStringArray(input.data_sources, "data_sources"),
    assets: assertStringArray(input.assets, "assets"),
  };
}


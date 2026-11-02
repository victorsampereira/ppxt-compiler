import path from "node:path";

import { JsonModelClient, runAiAwareContentPipeline } from "../ai/pipeline-ai.js";
import { resolveDesignPlan } from "../core/design.js";
import { readJson, writeJson } from "../core/fs.js";
import { buildLayouts } from "../core/layout.js";
import { normalizeBrief } from "../core/normalize.js";
import { evaluateDeck } from "../core/qa.js";
import { renderPresentation } from "../core/render.js";
import { buildThemeTokens } from "../core/theme.js";
import {
  PipelineArtifacts,
  PresentationInput,
  QualityReport,
} from "../core/types.js";
import { validatePresentationInput } from "../core/validation.js";

interface RunPipelineOptions {
  inputPath: string;
  outputDir: string;
  /** Injected in tests; by default the model client comes from the environment. */
  client?: JsonModelClient;
}

interface RunPipelineResult {
  pptxPath: string;
  manifestPath: string;
  qualityReportPath: string;
  qualityReport: QualityReport;
  generationMode: PipelineArtifacts["generationMode"];
}

export async function runPresentationPipeline({
  inputPath,
  outputDir,
  client,
}: RunPipelineOptions): Promise<RunPipelineResult> {
  const rawInput = await readJson<PresentationInput>(inputPath);
  const input = validatePresentationInput(rawInput);

  const normalizedBrief = normalizeBrief(input);
  const aiResult = await runAiAwareContentPipeline(normalizedBrief, { client });
  const plan = aiResult.plan;
  const slideContents = aiResult.slideContents;
  const designedSlides = resolveDesignPlan(plan, normalizedBrief.brandKit.colors);
  const layouts = buildLayouts(slideContents, designedSlides);
  const theme = buildThemeTokens(
    normalizedBrief.brandKit.colors,
    normalizedBrief.brandKit.fonts,
  );
  const qualityReport = evaluateDeck({
    contents: slideContents,
    designs: designedSlides,
    layouts,
    theme,
    critics: aiResult.criticResults,
  });

  const artifacts: PipelineArtifacts = {
    input,
    normalizedBrief,
    plan,
    slideContents,
    designedSlides,
    layouts,
    qualityReport,
    promptTraces: aiResult.promptTraces,
    generationMode: aiResult.generationMode,
  };

  const projectDir = path.join(outputDir, normalizedBrief.projectId);
  const manifestPath = path.join(projectDir, "artifacts.json");
  const qualityReportPath = path.join(projectDir, "quality-report.json");

  await writeJson(manifestPath, artifacts);
  await writeJson(qualityReportPath, qualityReport);

  const pptxPath = await renderPresentation({
    brief: normalizedBrief,
    plan,
    contents: slideContents,
    designedSlides,
    layouts,
    outputDir: projectDir,
  });

  return {
    pptxPath,
    manifestPath,
    qualityReportPath,
    qualityReport,
    generationMode: aiResult.generationMode,
  };
}

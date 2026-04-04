import path from "node:path";

import { runAiAwareContentPipeline } from "../ai/pipeline-ai.js";
import { resolveDesignPlan } from "../core/design.js";
import { readJson, writeJson } from "../core/fs.js";
import { buildLayouts } from "../core/layout.js";
import { normalizeBrief } from "../core/normalize.js";
import { buildQualityReport } from "../core/qa.js";
import { renderPresentation } from "../core/render.js";
import { PipelineArtifacts, PresentationInput } from "../core/types.js";
import { validatePresentationInput } from "../core/validation.js";

interface RunPipelineOptions {
  inputPath: string;
  outputDir: string;
}

interface RunPipelineResult {
  pptxPath: string;
  manifestPath: string;
  qualityReportPath: string;
}

export async function runPresentationPipeline({
  inputPath,
  outputDir,
}: RunPipelineOptions): Promise<RunPipelineResult> {
  const rawInput = await readJson<PresentationInput>(inputPath);
  const input = validatePresentationInput(rawInput);

  const normalizedBrief = normalizeBrief(input);
  const aiResult = await runAiAwareContentPipeline(normalizedBrief);
  const plan = aiResult.plan;
  const slideContents = aiResult.slideContents;
  const designedSlides = resolveDesignPlan(plan, normalizedBrief.brandKit.colors);
  const layouts = buildLayouts(slideContents, designedSlides);
  const qualityReport = buildQualityReport(aiResult.qualityResults);

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
    outputDir: projectDir,
  });

  return {
    pptxPath,
    manifestPath,
    qualityReportPath,
  };
}

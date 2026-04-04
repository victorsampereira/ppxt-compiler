import { getAppEnv } from "../core/env.js";
import {
  NormalizedBrief,
  PresentationPlan,
  PromptTrace,
  SlideContent,
  SlideQualityResult,
} from "../core/types.js";
import { createPresentationPlan } from "../core/plan.js";
import { writeSlides } from "../core/author.js";
import { evaluateSlides } from "../core/qa.js";
import {
  buildCriticPrompt,
  buildPlannerPrompt,
  buildWriterPrompt,
  mergeCriticResults,
} from "./prompt-contracts.js";
import { OpenAIClient } from "./openai-client.js";

export interface PipelineAiResult {
  plan: PresentationPlan;
  slideContents: SlideContent[];
  qualityResults: SlideQualityResult[];
  promptTraces: PromptTrace[];
  generationMode: "deterministic" | "hybrid-ai";
}

export async function runAiAwareContentPipeline(
  brief: NormalizedBrief,
): Promise<PipelineAiResult> {
  const fallbackPlan = createPresentationPlan(brief);
  const fallbackSlides = writeSlides(brief, fallbackPlan);
  const fallbackQuality = evaluateSlides(fallbackSlides).slideResults;

  const env = getAppEnv();
  if (!env.openaiApiKey) {
    return {
      plan: fallbackPlan,
      slideContents: fallbackSlides,
      qualityResults: fallbackQuality,
      promptTraces: [],
      generationMode: "deterministic",
    };
  }

  const client = new OpenAIClient({
    apiKey: env.openaiApiKey,
    model: env.openaiModel,
  });

  const promptTraces: PromptTrace[] = [];

  const plannerPrompt = buildPlannerPrompt(brief);
  let plan = fallbackPlan;
  try {
    plan = await client.generateJson<PresentationPlan>(plannerPrompt);
    promptTraces.push({
      promptId: plannerPrompt.id,
      version: plannerPrompt.version,
      model: env.openaiModel,
      usedAi: true,
    });
  } catch {
    promptTraces.push({
      promptId: plannerPrompt.id,
      version: plannerPrompt.version,
      model: env.openaiModel,
      usedAi: false,
    });
  }

  const fallbackSlidesForPlan = writeSlides(brief, plan);
  const slideContents: SlideContent[] = [];

  for (let index = 0; index < plan.slides.length; index += 1) {
    const writerPrompt = buildWriterPrompt(brief, plan, index);

    try {
      const generated = await client.generateJson<SlideContent>(writerPrompt);
      slideContents.push({
        ...generated,
        slideId: plan.slides[index]?.slideId ?? generated.slideId,
      });
      promptTraces.push({
        promptId: writerPrompt.id,
        version: writerPrompt.version,
        model: env.openaiModel,
        usedAi: true,
      });
    } catch {
      slideContents.push(fallbackSlidesForPlan[index]);
      promptTraces.push({
        promptId: writerPrompt.id,
        version: writerPrompt.version,
        model: env.openaiModel,
        usedAi: false,
      });
    }
  }

  const fallbackQualityForPlan = evaluateSlides(slideContents).slideResults;
  const qualityResults: SlideQualityResult[] = [];

  for (let index = 0; index < slideContents.length; index += 1) {
    const criticPrompt = buildCriticPrompt(brief, slideContents[index]);
    const fallbackResult = fallbackQualityForPlan[index];

    try {
      const generated = await client.generateJson<SlideQualityResult>(criticPrompt);
      qualityResults.push(mergeCriticResults(fallbackResult, generated));
      promptTraces.push({
        promptId: criticPrompt.id,
        version: criticPrompt.version,
        model: env.openaiModel,
        usedAi: true,
      });
    } catch {
      qualityResults.push(fallbackResult);
      promptTraces.push({
        promptId: criticPrompt.id,
        version: criticPrompt.version,
        model: env.openaiModel,
        usedAi: false,
      });
    }
  }

  return {
    plan,
    slideContents,
    qualityResults,
    promptTraces,
    generationMode: "hybrid-ai",
  };
}


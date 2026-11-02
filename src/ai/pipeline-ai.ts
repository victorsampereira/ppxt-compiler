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
import {
  PromptSpec,
  buildCriticPrompt,
  buildPlannerPrompt,
  buildWriterPrompt,
} from "./prompt-contracts.js";
import { OpenAIClient } from "./openai-client.js";
import { parseCriticResult, parsePlan, parseSlideContent } from "./validate.js";

/** What the pipeline needs from a model: a JSON answer for a prompt. */
export interface JsonModelClient {
  generateJson<T>(prompt: PromptSpec): Promise<T>;
}

export interface AiPipelineOptions {
  /** Injected in tests; by default the OpenAI client is built from the environment. */
  client?: JsonModelClient;
  model?: string;
}

export interface PipelineAiResult {
  plan: PresentationPlan;
  slideContents: SlideContent[];
  /** Model critic output per slide; null where the call failed or was invalid. */
  criticResults: Array<SlideQualityResult | null>;
  promptTraces: PromptTrace[];
  generationMode: "deterministic" | "hybrid-ai";
}

/**
 * Calls the model and validates the answer. Any API error or malformed answer
 * returns null and is recorded in the trace, so the caller can fall back to the
 * deterministic result for just that step.
 */
async function callModel<T>(
  client: JsonModelClient,
  model: string,
  prompt: PromptSpec,
  parse: (value: unknown) => T | null,
  traces: PromptTrace[],
): Promise<T | null> {
  const startedAt = Date.now();
  const trace = { promptId: prompt.id, version: prompt.version, model };

  try {
    const parsed = parse(await client.generateJson<unknown>(prompt));
    traces.push({
      ...trace,
      usedAi: parsed !== null,
      ...(parsed === null ? { fallbackReason: "invalid_output" as const } : {}),
      latencyMs: Date.now() - startedAt,
    });
    return parsed;
  } catch {
    traces.push({
      ...trace,
      usedAi: false,
      fallbackReason: "api_error",
      latencyMs: Date.now() - startedAt,
    });
    return null;
  }
}

export async function runAiAwareContentPipeline(
  brief: NormalizedBrief,
  options: AiPipelineOptions = {},
): Promise<PipelineAiResult> {
  const fallbackPlan = createPresentationPlan(brief);
  const env = getAppEnv();

  const client =
    options.client ??
    (env.openaiApiKey
      ? new OpenAIClient({ apiKey: env.openaiApiKey, model: env.openaiModel })
      : undefined);

  if (!client) {
    const slideContents = writeSlides(brief, fallbackPlan);
    return {
      plan: fallbackPlan,
      slideContents,
      criticResults: slideContents.map(() => null),
      promptTraces: [],
      generationMode: "deterministic",
    };
  }

  const model = options.model ?? env.openaiModel;
  const promptTraces: PromptTrace[] = [];

  const modelPlan = await callModel(
    client,
    model,
    buildPlannerPrompt(brief),
    parsePlan,
    promptTraces,
  );
  const plan: PresentationPlan = modelPlan
    ? { ...modelPlan, title: modelPlan.title || brief.title }
    : fallbackPlan;

  const fallbackSlides = writeSlides(brief, plan);
  const slideContents: SlideContent[] = [];

  for (let index = 0; index < plan.slides.length; index += 1) {
    const slideId = plan.slides[index].slideId;
    const written = await callModel(
      client,
      model,
      buildWriterPrompt(brief, plan, index),
      (value) => parseSlideContent(value, slideId),
      promptTraces,
    );
    slideContents.push(written ?? fallbackSlides[index]);
  }

  const criticResults: Array<SlideQualityResult | null> = [];
  for (const content of slideContents) {
    criticResults.push(
      await callModel(
        client,
        model,
        buildCriticPrompt(brief, content),
        (value) => parseCriticResult(value, content.slideId),
        promptTraces,
      ),
    );
  }

  return {
    plan,
    slideContents,
    criticResults,
    promptTraces,
    generationMode: "hybrid-ai",
  };
}

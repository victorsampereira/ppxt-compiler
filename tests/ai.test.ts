import { afterEach, describe, expect, it, vi } from "vitest";

import { PromptSpec } from "../src/ai/prompt-contracts.js";
import { JsonModelClient, runAiAwareContentPipeline } from "../src/ai/pipeline-ai.js";
import {
  parseCriticResult,
  parsePlan,
  parseSlideContent,
} from "../src/ai/validate.js";
import { createPresentationPlan } from "../src/core/plan.js";
import { sampleBrief } from "./helpers.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

const PLANNER = "planner.presentation-plan";
const WRITER = "writer.slide-content";
const CRITIC = "critic.slide-quality";

function fakeClient(
  handlers: Partial<Record<string, (prompt: PromptSpec) => unknown>>,
): JsonModelClient {
  return {
    async generateJson<T>(prompt: PromptSpec): Promise<T> {
      const handler = handlers[prompt.id];
      if (!handler) {
        throw new Error(`sem handler para ${prompt.id}`);
      }
      return handler(prompt) as T;
    },
  };
}

function slideIdOf(prompt: PromptSpec): string {
  return JSON.parse(prompt.input).output_schema.slideId as string;
}

describe("parsePlan", () => {
  const valid = () => JSON.parse(JSON.stringify(createPresentationPlan(sampleBrief())));

  it("accepts a well-formed plan", () => {
    const plan = parsePlan(valid());
    expect(plan?.slides).toHaveLength(6);
    expect(plan?.slides[0].recommendedArchetype).toBe("hero_statement");
  });

  it("rejects anything that is not an object with enough slides", () => {
    expect(parsePlan(null)).toBeNull();
    expect(parsePlan("plano")).toBeNull();
    expect(parsePlan({})).toBeNull();
    expect(parsePlan({ slides: [] })).toBeNull();
    expect(parsePlan({ slides: [valid().slides[0]] })).toBeNull();
  });

  it("rejects an unknown archetype or purpose", () => {
    const badArchetype = valid();
    badArchetype.slides[1].recommendedArchetype = "pie_chart";
    expect(parsePlan(badArchetype)).toBeNull();

    const badPurpose = valid();
    badPurpose.slides[1].purpose = "intermission";
    expect(parsePlan(badPurpose)).toBeNull();
  });

  it("rejects duplicate slide ids and slides without a key message", () => {
    const duplicate = valid();
    duplicate.slides[1].slideId = duplicate.slides[0].slideId;
    expect(parsePlan(duplicate)).toBeNull();

    const noMessage = valid();
    noMessage.slides[2].keyMessage = "   ";
    expect(parsePlan(noMessage)).toBeNull();
  });
});

describe("parseSlideContent", () => {
  it("keeps the slide id from the plan, whatever the model says", () => {
    const parsed = parseSlideContent({ slideId: "zzz", title: "Titulo", bullets: ["a"] }, "s03");
    expect(parsed?.slideId).toBe("s03");
  });

  it("rejects a missing title or bullets that are not strings", () => {
    expect(parseSlideContent({ bullets: ["a"] }, "s01")).toBeNull();
    expect(parseSlideContent({ title: "T", bullets: "a, b" }, "s01")).toBeNull();
    expect(parseSlideContent({ title: "T", bullets: [1, 2] }, "s01")).toBeNull();
    expect(parseSlideContent(["T"], "s01")).toBeNull();
  });

  it("trims bullets and drops empty ones, but keeps too-long content for QA to flag", () => {
    const parsed = parseSlideContent(
      { title: "T", bullets: ["  a  ", "", "b", "c", "d", "e"] },
      "s01",
    );
    expect(parsed?.bullets).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("parseCriticResult", () => {
  it("clamps the score to 1-5 and derives a missing status", () => {
    expect(parseCriticResult({ score: 9 }, "s01")).toMatchObject({ score: 5, status: "pass" });
    expect(parseCriticResult({ score: -3 }, "s01")).toMatchObject({ score: 1, status: "fail" });
    expect(parseCriticResult({ score: 3 }, "s01")).toMatchObject({ status: "warn" });
  });

  it("drops malformed issues and keeps valid ones", () => {
    const parsed = parseCriticResult(
      {
        score: 3,
        issues: [
          { code: "VAGUE_TITLE", severity: "medium", message: "titulo vago" },
          { code: "X", severity: "catastrophic", message: "m" },
          { severity: "low", message: "sem codigo" },
          "texto",
        ],
      },
      "s01",
    );
    expect(parsed?.issues).toEqual([
      { code: "VAGUE_TITLE", severity: "medium", message: "titulo vago" },
    ]);
  });

  it("rejects a result without a numeric score", () => {
    expect(parseCriticResult({ status: "pass" }, "s01")).toBeNull();
    expect(parseCriticResult({ score: "5" }, "s01")).toBeNull();
    expect(parseCriticResult({ score: Number.NaN }, "s01")).toBeNull();
  });
});

describe("runAiAwareContentPipeline", () => {
  const goodClient = () =>
    fakeClient({
      [PLANNER]: () => createPresentationPlan(sampleBrief()),
      [WRITER]: (prompt) => ({
        slideId: slideIdOf(prompt),
        title: `Titulo ${slideIdOf(prompt)}`,
        bullets: ["Um ponto", "Outro ponto"],
        speakerNote: "nota",
      }),
      [CRITIC]: (prompt) => ({ slideId: slideIdOf(prompt), status: "pass", score: 5, issues: [] }),
    });

  it("runs deterministically, with no traces, when there is no client or API key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const result = await runAiAwareContentPipeline(sampleBrief());

    expect(result.generationMode).toBe("deterministic");
    expect(result.promptTraces).toEqual([]);
    expect(result.slideContents).toHaveLength(6);
  });

  it("uses the model for every step when the answers are valid, and records latency", async () => {
    const result = await runAiAwareContentPipeline(sampleBrief(), { client: goodClient(), model: "test-model" });

    expect(result.generationMode).toBe("hybrid-ai");
    // 1 planner + 6 writers + 6 critics
    expect(result.promptTraces).toHaveLength(13);
    expect(result.promptTraces.every((trace) => trace.usedAi)).toBe(true);
    expect(result.promptTraces.every((trace) => trace.model === "test-model")).toBe(true);
    expect(result.promptTraces.every((trace) => typeof trace.latencyMs === "number")).toBe(true);
    expect(result.slideContents[1].title).toBe("Titulo s02");
    expect(result.criticResults.every((critic) => critic !== null)).toBe(true);
  });

  it("falls back to the deterministic plan when the planner answer is malformed", async () => {
    const client = fakeClient({
      [PLANNER]: () => ({ slides: "nao e uma lista" }),
      [WRITER]: (prompt) => ({ slideId: slideIdOf(prompt), title: "T", bullets: [] }),
      [CRITIC]: () => null,
    });
    const result = await runAiAwareContentPipeline(sampleBrief(), { client });

    const plannerTrace = result.promptTraces.find((trace) => trace.promptId === PLANNER);
    expect(plannerTrace).toMatchObject({ usedAi: false, fallbackReason: "invalid_output" });
    expect(result.plan.slides).toHaveLength(6);
  });

  it("falls back per step when the API throws", async () => {
    const client = fakeClient({
      [PLANNER]: () => createPresentationPlan(sampleBrief()),
      // The writer and critic handlers are missing, so every call throws.
    });
    const result = await runAiAwareContentPipeline(sampleBrief(), { client });

    const writerTraces = result.promptTraces.filter((trace) => trace.promptId === WRITER);
    expect(writerTraces).toHaveLength(6);
    expect(writerTraces.every((trace) => trace.fallbackReason === "api_error")).toBe(true);
    // Deterministic copy still fills every slide.
    expect(result.slideContents.every((slide) => slide.title.length > 0)).toBe(true);
    expect(result.criticResults.every((critic) => critic === null)).toBe(true);
  });

  it("replaces only the slides whose answer is invalid", async () => {
    const client = fakeClient({
      [PLANNER]: () => createPresentationPlan(sampleBrief()),
      [WRITER]: (prompt) =>
        slideIdOf(prompt) === "s03"
          ? { title: "", bullets: [] }
          : { slideId: slideIdOf(prompt), title: "Do modelo", bullets: ["a"] },
      [CRITIC]: () => null,
    });
    const result = await runAiAwareContentPipeline(sampleBrief(), { client });

    expect(result.slideContents[1].title).toBe("Do modelo");
    expect(result.slideContents[2].title).toBe("Arquitetura");
  });
});

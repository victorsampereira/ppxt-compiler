import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import JSZip from "jszip";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PromptSpec } from "../src/ai/prompt-contracts.js";
import { JsonModelClient } from "../src/ai/pipeline-ai.js";
import { createPresentationPlan } from "../src/core/plan.js";
import { runPresentationPipeline } from "../src/pipeline/run-presentation-pipeline.js";
import { SAMPLE_BRIEF_PATH, sampleBrief } from "./helpers.js";

let outputDir: string;

beforeEach(async () => {
  vi.stubEnv("OPENAI_API_KEY", "");
  outputDir = await mkdtemp(path.join(os.tmpdir(), "ppxt-test-"));
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(outputDir, { recursive: true, force: true });
});

async function openDeck(pptxPath: string) {
  return JSZip.loadAsync(await readFile(pptxPath));
}

describe("pipeline, offline", () => {
  it("writes a pptx with one slide and one speaker note per planned slide", async () => {
    const result = await runPresentationPipeline({ inputPath: SAMPLE_BRIEF_PATH, outputDir });
    const zip = await openDeck(result.pptxPath);
    const names = Object.keys(zip.files);

    expect(names.filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))).toHaveLength(6);
    expect(names.filter((name) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(name))).toHaveLength(6);
  });

  it("puts the slide titles and copy into the file", async () => {
    const result = await runPresentationPipeline({ inputPath: SAMPLE_BRIEF_PATH, outputDir });
    const zip = await openDeck(result.pptxPath);
    const xml = await zip.file("ppt/slides/slide3.xml")?.async("string");

    expect(xml).toContain("Arquitetura");
  });

  it("writes the manifest and a quality report that agree", async () => {
    const result = await runPresentationPipeline({ inputPath: SAMPLE_BRIEF_PATH, outputDir });
    const manifest = JSON.parse(await readFile(result.manifestPath, "utf8"));
    const report = JSON.parse(await readFile(result.qualityReportPath, "utf8"));

    expect(manifest.generationMode).toBe("deterministic");
    expect(manifest.layouts).toHaveLength(manifest.slideContents.length);
    expect(manifest.qualityReport.averageScore).toBe(report.averageScore);
    expect(report.verdict).toBe("ready");
  });

  it("gives the sample deck five different layouts", async () => {
    const result = await runPresentationPipeline({ inputPath: SAMPLE_BRIEF_PATH, outputDir });
    const manifest = JSON.parse(await readFile(result.manifestPath, "utf8"));
    const archetypes = new Set(manifest.designedSlides.map((slide: { archetype: string }) => slide.archetype));

    expect(archetypes.size).toBeGreaterThanOrEqual(5);
  });

  it("rejects an invalid briefing before doing any work", async () => {
    const badPath = path.join(outputDir, "bad.json");
    await writeFile(badPath, JSON.stringify({ project_id: "x", presentation: {}, briefing: {}, brand_kit: { fonts: {} } }));

    await expect(runPresentationPipeline({ inputPath: badPath, outputDir })).rejects.toThrow();
  });
});

describe("pipeline, with a model client", () => {
  function clientWithOverlongSlides(): JsonModelClient {
    return {
      async generateJson<T>(prompt: PromptSpec): Promise<T> {
        const slideId = JSON.parse(prompt.input).output_schema.slideId as string;
        switch (prompt.id) {
          case "planner.presentation-plan":
            return createPresentationPlan(sampleBrief()) as T;
          case "writer.slide-content":
            return {
              slideId,
              title: "Titulo",
              bullets: ["a", "b", "c", "d", "e", "f"],
              speakerNote: "nota",
            } as T;
          default:
            // A critic that approves everything.
            return { slideId, status: "pass", score: 5, issues: [] } as T;
        }
      },
    };
  }

  it("still flags a model that ignores the bullet limit, even if its own critic approves", async () => {
    const result = await runPresentationPipeline({
      inputPath: SAMPLE_BRIEF_PATH,
      outputDir,
      client: clientWithOverlongSlides(),
    });

    expect(result.generationMode).toBe("hybrid-ai");
    const codes = result.qualityReport.slideResults.flatMap((slide) => slide.issues.map((issue) => issue.code));
    expect(codes).toContain("TOO_MANY_BULLETS");
    expect(result.qualityReport.averageScore).toBeLessThan(5);
  });
});

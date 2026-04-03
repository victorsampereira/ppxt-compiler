import path from "node:path";

import { runPresentationPipeline } from "./pipeline/run-presentation-pipeline.js";

async function main(): Promise<void> {
  const inputArg = process.argv[2] ?? "data/examples/briefing.sample.json";
  const inputPath = path.resolve(process.cwd(), inputArg);

  const result = await runPresentationPipeline({
    inputPath,
    outputDir: path.resolve(process.cwd(), "output", "generated"),
  });

  console.log(`PPTX gerado em: ${result.pptxPath}`);
  console.log(`Manifesto gerado em: ${result.manifestPath}`);
  console.log(`Relatorio de QA gerado em: ${result.qualityReportPath}`);
}

main().catch((error: unknown) => {
  console.error("Falha ao executar o pipeline.");
  console.error(error);
  process.exitCode = 1;
});


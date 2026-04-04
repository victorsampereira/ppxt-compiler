import { PromptSpec } from "./prompt-contracts.js";

interface ResponsesApiOutputMessage {
  type?: string;
  content?: Array<{
    type?: string;
    text?: string;
  }>;
}

interface ResponsesApiResult {
  output_text?: string;
  output?: ResponsesApiOutputMessage[];
}

export interface OpenAIClientOptions {
  apiKey: string;
  model: string;
}

export class OpenAIClient {
  constructor(private readonly options: OpenAIClientOptions) {}

  async generateJson<T>(prompt: PromptSpec): Promise<T> {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify({
        model: this.options.model,
        instructions: prompt.instructions,
        input: prompt.input,
        text: {
          format: {
            type: "json_object",
          },
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${body}`);
    }

    const payload = (await response.json()) as ResponsesApiResult;
    const rawText = extractOutputText(payload);
    return JSON.parse(rawText) as T;
  }
}

function extractOutputText(payload: ResponsesApiResult): string {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const message = payload.output?.find((item) => item.type === "message");
  const textBlock = message?.content?.find((item) => item.type?.includes("text"));
  if (textBlock?.text) {
    return textBlock.text;
  }

  throw new Error("Nao foi possivel extrair texto JSON da resposta da OpenAI.");
}


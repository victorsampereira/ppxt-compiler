export interface AppEnv {
  openaiApiKey?: string;
  openaiModel: string;
}

export function getAppEnv(): AppEnv {
  return {
    openaiApiKey: process.env.OPENAI_API_KEY?.trim() || undefined,
    openaiModel: process.env.OPENAI_MODEL?.trim() || "gpt-5-mini",
  };
}


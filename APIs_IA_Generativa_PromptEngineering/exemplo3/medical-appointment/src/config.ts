export type ModelConfig = {
  apiKey: string;
  httpReferer: string;
  xTitle: string;

  provider: {
    sort: {
      by: string;
      partition: string;
    };
  };

  models: string[];
  temperature: number;
  maxTokens: number;
};

console.assert(process.env.OPENROUTER_API_KEY, 'OPENROUTER_API_KEY is not set in environment variables');

export const config: ModelConfig = {
  apiKey: process.env.OPENROUTER_API_KEY!,
  httpReferer: 'http://jmslasher.com',
  xTitle: 'IA Devs - Prompt Chaining Article Generator',
  models: [
    "qwen/qwen3.8-27b",
    "inclusionai/ling-3.2-flash",
    "google/gemma-4-31b-it"
  ],
  provider: {
    sort: {
      by: 'throughput', 
      partition: 'none',
    },
  },
  temperature: 0.7,
  maxTokens: 3000
};

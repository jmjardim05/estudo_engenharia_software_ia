import { env } from "process";

export class ModelConfig {
    apiKey: string;
    httpReferer: string;
    xTitle: string;
    models: string[];
    port: number;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    provider: {
        sort: {
            by: string,
            partition: string,
        }
    }
}


export const CONFIG: ModelConfig = {
    apiKey: env.OPENROUTER_API_KEY!,
    httpReferer: "http://jmslasher.com",
    xTitle: "AulaOpenRouter",
    models: [
        "qwen/qwen3.8-27b",
        "stealth/space-bunny-alpha",
        "google/gemma-4-31b-it"
    ],
    port: 3030,
    temperature: .5,
    maxTokens: 3000,
    systemPrompt: "Você é um excelente assistente",
    provider: {
        sort: {
            by: "price",
            partition: "none"
        }
    }
}
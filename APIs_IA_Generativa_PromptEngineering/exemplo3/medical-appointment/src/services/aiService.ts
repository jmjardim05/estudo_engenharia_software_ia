import { ChatOpenAI } from "@langchain/openai";
import { config, type ModelConfig } from "../config.ts";
import { z } from "zod/v4";
import { createAgent, providerStrategy } from "langchain";

export class AIResponse {
    model?: string;
    content?: any;
}

export class AIService {
    private config: ModelConfig;
    private llmClient: ChatOpenAI;

    constructor(customConfig: ModelConfig) {
        this.config = customConfig ?? config;
        this.llmClient = new ChatOpenAI({
            modelName: this.config.models.at(0)!, // Use the first model in the list
            temperature: this.config.temperature,
            apiKey: this.config.apiKey,
            configuration: {
                baseURL: "https://openrouter.ai/api/v1/",
                defaultHeaders: {
                    "X-Title": this.config.xTitle,
                    "HTTP-Referer": this.config.httpReferer,
                },
            },

            // config do openroputer
            modelKwargs: {
                models: this.config.models,
                provider: this.config.provider,
            },
        });
    }

    async generateStructured<T>(systemPrompt: string, userPrompt: string, 
        schema: z.ZodSchema<T>) {
        const agent = createAgent({
            model: this.llmClient,
            tools: [],
            responseFormat: providerStrategy(schema),
        });

        const response = await agent.invoke({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }],
        });

        return response.structuredResponse;
    }
}
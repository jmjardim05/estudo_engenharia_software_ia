import { OpenRouter } from '@openrouter/sdk';
import { type ModelConfig, config } from './config.ts';
import { type ChatGenerationParams, type ProviderPreferences } from '@openrouter/sdk/models';
import { IntentSchema } from './prompts/v1/identifyIntent.ts';
import { MessageSchema } from './prompts/v1/messageGenerator.ts';
import * as z from 'zod/v4';

export class LLMResponse {
    model?: string;
    content?: any;
}

function getLLMResponse(schema: typeof IntentSchema | typeof MessageSchema, model: string, content: any): LLMResponse {
    if (schema === IntentSchema) {
        // safeParse() => Validates the content against the IntentSchema and returns a result indicating success or failure.
        const parsedIntent = IntentSchema.safeParse(content);
        if (!parsedIntent.success) {
            throw new Error('Failed to parse intent');
        }
        const intent = parsedIntent.data;
        return { model, content: intent };
    }

    if (schema === MessageSchema) {
        // safeParse() => Validates the content against the MessageSchema and returns a result indicating success or failure.
        const parsedMessage = MessageSchema.safeParse(content);
        if (!parsedMessage.success) {
            throw new Error('Failed to parse message');
        }
        const message = parsedMessage.data;
        return { model, content: message };
    }

    return { model, content: undefined };
}

export class OpenRouterService {
    private client: OpenRouter
    private routerConfig: ModelConfig
    
    constructor(customConfig: ModelConfig) {
        this.routerConfig = customConfig ?? config
        this.client = new OpenRouter({
            apiKey: this.routerConfig.apiKey,
            httpReferer: this.routerConfig.httpReferer, // Optional. Site URL for rankings on openrouter.ai.
            xTitle: this.routerConfig.xTitle, // Optional. Site title for rankings on openrouter.ai.
            timeoutMs: 60_000,
        });
    }

    async generate(systemPrompt: string, userPrompt: string, responseSchema: typeof IntentSchema | typeof MessageSchema): Promise<LLMResponse> {
        const request: ChatGenerationParams = {            
            models: this.routerConfig.models,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userPrompt,
                },
            ],
            temperature: this.routerConfig.temperature ?? config.temperature,
            maxCompletionTokens: this.routerConfig.maxTokens ?? config.maxTokens,
            provider: this.routerConfig.provider as ProviderPreferences,
            responseFormat: { type: 'json_schema', jsonSchema: { name: 'response', strict: true, schema: z.toJSONSchema(responseSchema) } }, // Use the JSON schema for structured output
        }

        const completion = await this.client.chat.send(request);

        if (completion instanceof ReadableStream) {
            throw new Error('Expected a non-streaming response');
        }

        const content = JSON.parse(completion.choices[0]?.message?.content?.toString() ?? '{}');
        return getLLMResponse(responseSchema, completion.model, content);
    }
}

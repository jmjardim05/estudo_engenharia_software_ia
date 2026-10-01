import { OpenRouter } from '@openrouter/sdk';
import { ModelConfig, CONFIG } from './config.ts';

export class LLMResponse {
    model: string;
    content: string;
}

export class OpenRouterService {
    private client: OpenRouter
    private routerConfig: ModelConfig
    
    constructor(config: ModelConfig) {
        this.routerConfig = config ?? CONFIG
        this.client = new OpenRouter({
            apiKey: this.routerConfig.apiKey,
            httpReferer: this.routerConfig.httpReferer, // Optional. Site URL for rankings on openrouter.ai.
            appTitle: this.routerConfig.xTitle, // Optional. Site title for rankings on openrouter.ai.
        });
    }

    async generate(prompt: string): Promise<LLMResponse> {
        const request = {
            chatRequest: {
                models: this.routerConfig.models,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: this.routerConfig.temperature,
                maxTokens: this.routerConfig.maxTokens,
                provider: this.routerConfig.provider
            }
        }

        if (this.routerConfig.systemPrompt)
            request.chatRequest.messages.push(
                {
                    role: 'system',
                    content: this.routerConfig.systemPrompt,
                })

        const completion = await this.client.chat.send(request);

        if (completion instanceof ReadableStream) {
            throw new Error('Expected a non-streaming response');
        }
        const content = completion.choices[0]?.message.content?.toString() ?? "";
        completion.model;

        return {
            model: completion.model,
            content
        }
    }
}


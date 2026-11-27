import { ChatOpenAI } from '@langchain/openai';
import { config, prompts, type ModelConfig } from '../config.ts';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { createAgent } from 'langchain';
import { getMCPTools } from './mcpService.ts';
import { PromptTemplate } from '@langchain/core/prompts';

export type GuardrailResult = {
    safe: boolean;
    reason?: string;
    score?: number;
    analysis?: string;
};

export class OpenRouterService {
    private config: ModelConfig;
    private llmClient: ChatOpenAI;
    private guardrailClient: ChatOpenAI;
    private fsAgent: ReturnType<typeof createAgent> | null = null;
    private grAgent: ReturnType<typeof createAgent> | null = null;

    constructor(configOverride?: ModelConfig) {
        this.config = configOverride ?? config;
        this.llmClient = this.#createChatModel(this.config.models[0]);
        this.guardrailClient = this.#createChatModel(this.config.guardrailsModel);
    }

    #createChatModel(modelName: string): ChatOpenAI {
        return new ChatOpenAI({
            apiKey: this.config.apiKey,
            modelName: modelName,
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
            configuration: {
                baseURL: 'https://openrouter.ai/api/v1',
                defaultHeaders: {
                    'HTTP-Referer': this.config.httpReferer,
                    'X-Title': this.config.xTitle,
                },
            },
            modelKwargs: {
                models: this.config.models,
                provider: this.config.provider,
            },
        });
    }

    async generate(
        systemPrompt: string,
        userPrompt: string,
    ): Promise<string> {

        if (!this.fsAgent) {
            this.fsAgent = createAgent({
                model: this.llmClient,
                tools: await getMCPTools(),
            });
        }

        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt),
        ];

        const response = await this.fsAgent.invoke({ messages });
        const content = String(response.messages.at(-1)?.text ?? '');

        return content;
    }

    async checkGuardrails(userInput: string,
        enabled: boolean = true
    ): Promise<GuardrailResult> {
        if (!enabled) {
            return { safe: true, reason: 'Guardrails check is disabled.' };
        }

        const template = PromptTemplate.fromTemplate(prompts.guardrails);
        const formattedPrompt = await template.format({ USER_INPUT: userInput });

        if (!this.grAgent) {
            this.grAgent = createAgent({
                model: this.guardrailClient,
                tools: [],
            });
        }

        const messages = [
            new SystemMessage(formattedPrompt),
            new HumanMessage(userInput),
        ];

        const response = await this.grAgent.invoke({ messages });
        const analysis = response.messages.at(-1)?.text.trim();
        const isUnsafe = analysis.toLowerCase().startsWith('unsafe');

        if (isUnsafe)
            return { 
                safe: false, 
                reason: "Tentativa de burlar a segurança das regras detectada!",
                analysis
            };

        return {
            safe: true,
            analysis
        }
    }
}

import { PromptTemplate } from '@langchain/core/prompts';
import { prompts } from '../../config.ts';
import { OpenRouterService } from '../../services/openrouterService.ts';
import type { GraphState } from '../state.ts';

export const createGuardrailsCheckNode = (openRouterService: OpenRouterService) => {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        try {
            const userPrompt = state.messages.at(-1)?.text || '';
            const prompt = PromptTemplate.fromTemplate(prompts.system);
            const systemPrompt = await prompt.format({
                USER_ROLE: state.user?.role || 'member',
                USER_NAME: state.user?.username || 'unknown'
            });

            const message = systemPrompt.concat('\n', userPrompt);

            const guardrailCheck = await openRouterService.checkGuardrails(message, state.guardrailsEnabled);

            return {
                guardrailCheck
            };
        } catch (error) {
            console.error('Guardrails check failed:', error);

            return {
                guardrailCheck: {
                    safe: false,
                    reason: 'Guardrails check failed due to an internal error.',
                }
            };
        }
    }
}

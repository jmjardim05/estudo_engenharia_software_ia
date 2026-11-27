import type { GraphState } from '../state.ts';
import { AIMessage } from '@langchain/core/messages';
import { OpenRouterService } from '../../services/openrouterService.ts';
import { PromptTemplate } from '@langchain/core/prompts';
import { prompts } from '../../config.ts';

export const createChatNode = (openRouterService: OpenRouterService) => {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        try {
            const userPrompt = state.messages.at(-1)?.text || '';
            const prompt = PromptTemplate.fromTemplate(prompts.system);
            const systemPrompt = await prompt.format({ 
                USER_ROLE: state.user?.role || 'member',
                USER_NAME: state.user?.username || 'unknown' 
            });

            const response = await openRouterService.generate(
                systemPrompt, 
                userPrompt);
            
            return {
                ...state,
                messages: [...state.messages, new AIMessage(response)]
            };
        } catch (error) {
            console.error('Chat node error:', error);
            return {
                messages: [new AIMessage('I apologize, but I encountered an error processing your request. Please try again later.')],
            };
        }
    }
}

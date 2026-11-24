import { HumanMessage, RemoveMessage } from '@langchain/core/messages';
import { OpenRouterService } from '../../services/openrouterService.ts';
import type { GraphState } from '../graph.ts';
import { type ConversationSummary, getSummarizationSystemPrompt, getSummarizationUserPrompt, SummarySchema } from '../../prompts/v1/summarization.ts';
import { PreferencesService } from '../../services/preferencesService.ts';
import type { Runtime } from '@langchain/langgraph';

export function createSummarizationNode(llmClient: OpenRouterService, preferencesService: PreferencesService) {
    return async (state: GraphState, runtime?: Runtime): Promise<Partial<GraphState>> => {
        const conversationHistory = state.messages.map((msg) => ({ 
            role: HumanMessage.isInstance(msg) ? 'User' : 'AI',
            content: msg.text,
        }));

        const previousHistory = state.conversationSummary as ConversationSummary | undefined;

        const systemPrompt = getSummarizationSystemPrompt();        
        const userPrompt = getSummarizationUserPrompt(
            conversationHistory,
            previousHistory,
        );

        const response = await llmClient.generateStructured(
            systemPrompt,
            userPrompt,
            SummarySchema,
        );

        if (!response.success || !response.data) {
            console.log(`Error generating structured response: ${response.error}`);
            return {
                needsSummarization: false,
            };
        }

        const userId = (String(runtime?.context?.userId) || state.userId || 'unknown');
        await preferencesService.storeSummary(userId, response.data);

        const removedMessages = state.messages.slice(0, -2)
            .map(m => new RemoveMessage({ id: m.id as string })); // Keep the last two messages for context

        return {
          messages: removedMessages,
          needsSummarization: false,
          conversationSummary: response.data,
        };
    };
}

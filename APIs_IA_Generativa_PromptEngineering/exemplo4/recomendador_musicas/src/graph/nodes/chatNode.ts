import type { Runtime } from '@langchain/langgraph';
import { OpenRouterService } from '../../services/openrouterService.ts';
import type { GraphState } from '../graph.ts';
import { ChatResponseSchema, getSystemPrompt, getUserPromptTemplate } from '../../prompts/v1/chatResponse.ts';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { PreferencesService } from '../../services/preferencesService.ts';
import { config } from '../../config.ts';

export function createChatNode(llmClient: OpenRouterService, preferencesService: PreferencesService) {
  return async (state: GraphState, runtime?: Runtime): Promise<Partial<GraphState>> => {

    const userId = (String(runtime?.context?.userId) || state.userId || 'unknown');
    const userContext = state.userContext ?? await preferencesService.getBasicInfo(userId);

    const conversationHistory = state.messages.map((msg) => `${HumanMessage.isInstance(msg) ? 'Human' : 'AI'}: ${msg.text}`).join('\n');

    const systemPrompt = getSystemPrompt(userContext);

    const userMessage = state.messages.at(-1)?.text ?? '';
    const userPrompt = getUserPromptTemplate(
      userMessage,
      conversationHistory,
    );
    
    const response = await llmClient.generateStructured(
      systemPrompt,
      userPrompt,      
      ChatResponseSchema,
    );

    if (!response.success || !response.data) {
      console.log(`Error generating structured response: ${response.error}`);
      return {
        messages: [
          new AIMessage(' Encontrei um erro. Por favor, tente novamente.'),
        ],
      };
    }
    const aiMessage = new AIMessage(response.data?.message ?? 'No response from AI');

    const needsSummarization = state.messages.length >= config.maxMessagesToSummary;

    return { 
      messages: [
        ...state.messages, 
        aiMessage
      ],
      extractedPreferences: response.data.shouldSavePreferences ? response.data?.preferences : undefined,
      needsSummarization,
    };
  } 
}

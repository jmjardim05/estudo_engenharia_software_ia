import type { Runtime } from '@langchain/langgraph';
import { OpenRouterService } from '../../services/openrouterService.ts';
import type { GraphState } from '../graph.ts';
import { ChatResponseSchema, getSystemPrompt, getUserPromptTemplate } from '../../prompts/v1/chatResponse.ts';
import { AIMessage } from '@langchain/core/messages';

export function createChatNode(llmClient: OpenRouterService) {
  return async (state: GraphState, runtime?: Runtime): Promise<Partial<GraphState>> => {

    const userContext = ''
    const systemPrompt = getSystemPrompt(userContext)

    const userMessage = state.messages.at(-1)?.text ?? '';
    const userPrompt = getUserPromptTemplate(
      userMessage,
      userContext
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

    return { 
      messages: [
        ...state.messages, 
        aiMessage
      ],
      extractedPreferences: response.data.shouldSavePreferences ? response.data?.preferences : undefined,
      needsSummarization: false,
    };
  } 
}

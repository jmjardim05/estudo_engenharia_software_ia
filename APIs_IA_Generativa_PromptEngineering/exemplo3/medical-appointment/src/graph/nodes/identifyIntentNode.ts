import type { GraphState } from '../graph.ts';
import { getSystemPrompt, getUserPromptTemplate, IntentSchema } from '../../prompts/v1/identifyIntent.ts';
import { professionals } from '../../services/appointmentService.ts';
import { AIService } from '../../services/aiService.ts';

export function createIdentifyIntentNode(aiService: AIService) {
  return async (state: GraphState): Promise<GraphState> => {
    console.log(`🔍 Identifying intent...`);
   const input = state.messages.at(-1)!.text;
   
   const systemPrompt = getSystemPrompt(professionals);
   const userPrompt = getUserPromptTemplate(input);

    try {      
      const response = await aiService.generateStructured(systemPrompt, userPrompt, IntentSchema);

      return {
        ...state,
        ...response, // response.content should contain the parsed intent data (IntentSchema)
      };
    } catch (error) {
      console.error('❌ Error in identifyIntent node:', error);
      return {
        ...state,
        intent: 'unknown',
        error: error instanceof Error ? error.message : 'Intent identification failed',
      };
    }
  };
}

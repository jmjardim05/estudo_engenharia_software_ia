import { config } from '../../config.ts';
import type { GraphState } from '../graph.ts';
import { OpenRouterService } from '../../openrouterService.ts';
import { getSystemPrompt, getUserPromptTemplate, IntentSchema } from '../../prompts/v1/identifyIntent.ts';
import { professionals } from '../../services/appointmentService.ts';

export function createIdentifyIntentNode() {
  return async (state: GraphState): Promise<GraphState> => {
    console.log(`🔍 Identifying intent...`);
   const input = state.messages.at(-1)!.text;

   const ai = new OpenRouterService(config);
   const systemPrompt = getSystemPrompt(professionals);
   const userPrompt = getUserPromptTemplate(input);

    try {

      const response = await ai.generate(systemPrompt, userPrompt, IntentSchema);

      return {
        ...state,
        ...response.content, // response.content should contain the parsed intent data (IntentSchema)
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

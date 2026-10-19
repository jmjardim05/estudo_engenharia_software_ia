import type { GraphState } from '../graph.ts';
import { AIMessage } from 'langchain';
import { MessageSchema, getSystemPrompt, getUserPromptTemplate } from '../../prompts/v1/messageGenerator.ts';
import { OpenRouterService } from '../../openrouterService.ts';
import { config } from '../../config.ts';

export function createMessageGeneratorNode() {
    return async (state: GraphState): Promise<GraphState> => {
        console.log(`💬 Generating response message...`);

        try { 
            const scenario = state.intent === 'schedule' && state.actionSuccess ? 'schedule_success' :
                state.intent === 'schedule' && !state.actionSuccess ? 'schedule_error' :
                state.intent === 'cancel' && state.actionSuccess ? 'cancel_success' :
                state.intent === 'cancel' && !state.actionSuccess ? 'cancel_error' :
                'unknown';

            const details = {
                intent: state.intent,
                professionalName: state.professionalName,
                datetime: state.datetime,
                reason: state.reason,
                actionSuccess: state.actionSuccess,
                actionError: state.actionError,
                appointmentData: state.appointmentData,
            }    

            const systemPrompt = getSystemPrompt();
            const userPrompt = getUserPromptTemplate({
                scenario,
                details,
            });

            const ai = new OpenRouterService(config);
            const response = await ai.generate(systemPrompt, userPrompt, MessageSchema);
            const aiMessage = new AIMessage(response.content.message);

            console.log(`✅ Response message generated successfully: ${aiMessage.text}`);
            return {
                ...state,
                messages: [
                    ...state.messages,
                    aiMessage,
                ],
            };
        } catch (error) {
            console.error('❌ Error in messageGenerator node:', error);
            return {
                ...state,
                messages: [
                    ...state.messages,
                    new AIMessage('An error occurred while processing your request.')
                ],
            };
        }
    };
}

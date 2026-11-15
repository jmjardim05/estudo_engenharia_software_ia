import type { GraphState } from '../graph.ts';
import { AIMessage } from 'langchain';
import { MessageSchema, getSystemPrompt, getUserPromptTemplate } from '../../prompts/v1/messageGenerator.ts';
import { AIService } from '../../services/aiService.ts';

export function createMessageGeneratorNode(aiService: AIService) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        console.log(`💬 Generating response message...`);

        try {
            const hasSucceded = state.actionSuccess ? 'succeeded' : 'error'; 
            const scenario = `${state.intent ?? 'unknown'}_${hasSucceded}`; // This will be replaced with the actual scenario based on the intent and action success

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

            const response = await aiService.generateStructured(systemPrompt, userPrompt, MessageSchema);
            const aiMessage = new AIMessage(response.message);

            console.log(`✅ Response message generated successfully: ${aiMessage.text}`);
            return {
                actionSuccess: true,
                messages: [
                    ...state.messages,
                    aiMessage,
                ],
            };
        } catch (error) {
            console.error('❌ Error in messageGenerator node:', error);
            return {
                actionSuccess: false,
                messages: [
                    ...state.messages,
                    new AIMessage('An error occurred while processing your request.')
                ],
            };
        }
    };
}

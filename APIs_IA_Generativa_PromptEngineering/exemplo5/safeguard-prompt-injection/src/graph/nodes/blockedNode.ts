import { AIMessage } from 'langchain';
import type { GraphState } from '../state.ts';

export async function blockedNode(state: GraphState): Promise<Partial<GraphState>> {
  const reason = state.guardrailCheck?.reason || 'Unknown reason';
  console.warn(`Guardrails check failed: ${reason}`);

  const blockedMessage = new AIMessage('Sua solicitação foi bloqueada por motivo de segurança! Por favor tente novamente'); 

  return {
    messages: [
      blockedMessage
    ]
  };
}

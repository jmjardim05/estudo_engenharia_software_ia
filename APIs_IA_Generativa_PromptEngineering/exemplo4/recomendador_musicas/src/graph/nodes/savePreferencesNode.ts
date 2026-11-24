import type { Runtime } from '@langchain/langgraph';
import type { GraphState } from '../graph.ts';
import { PreferencesService } from '../../services/preferencesService.ts';

export function createSavePreferencesNode(preferencesService: PreferencesService) {
  return async (state: GraphState, runtime?: Runtime): Promise<Partial<GraphState>> => {
    const userId = String(runtime?.context?.userId) || state.userId || 'unknown';

    if (state.userId && state.extractedPreferences) {
      await preferencesService.mergePreferences(userId, state.extractedPreferences);
    }

    return {
      ...state
    };
  };
}

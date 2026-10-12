import { type GraphState } from "../graph.ts";

export function lowercase(state: GraphState): GraphState {
    const output = state.output.toLowerCase()

    return {
        ...state,
        output
    }
}
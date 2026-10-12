import { type GraphState } from "../graph.ts";

export function uppercase(state: GraphState): GraphState {
    const output = state.output.toUpperCase()

    return {
        ...state,
        output
    }
}
import { AIMessage } from "langchain";
import { type GraphState } from "../graph.ts";

export function fallback(state: GraphState): GraphState {
    const fallbackMessage = "Unknown command. Try 'make this uppercase' or 'convert to lowercase'"
    // const response = new AIMessage(fallbackMessage)

    return {
        ...state,
        output: fallbackMessage
    }
}
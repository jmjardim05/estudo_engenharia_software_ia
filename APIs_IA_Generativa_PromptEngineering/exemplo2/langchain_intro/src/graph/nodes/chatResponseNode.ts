import { AIMessage } from "langchain";
import { type GraphState } from "../graph.ts";

export function chatResponse(state: GraphState): GraphState {
    const input = state.output
    const responseMessage = new AIMessage(input)

    return {
        ...state,
        messages: [
            ...state.messages,
            responseMessage
        ]
    }
}
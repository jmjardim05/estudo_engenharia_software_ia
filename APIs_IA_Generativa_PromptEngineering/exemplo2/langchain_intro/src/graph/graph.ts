import { type ConditionalEdgeRouter, END, MessagesZodMeta, START, StateGraph } from "@langchain/langgraph"
import { withLangGraph } from "@langchain/langgraph/zod"
import { BaseMessage } from "langchain"
import { z } from "zod/v3"
import { identifyIntent } from "./nodes/identifyIntentNode.ts"
import { chatResponse } from "./nodes/chatResponseNode.ts"
import { lowercase } from "./nodes/lowerCaseNode.ts"
import { uppercase } from "./nodes/uppercaseNode.ts"
import { fallback } from "./nodes/fallbackNode.ts"

const GraphState = z.object({
    messages: withLangGraph(
        z.custom<BaseMessage[]>(),
         MessagesZodMeta
    ),
    output: z.string(),
    command: z.enum(["uppercase", "lowercase", "unknown"])
})

const checkCase: ConditionalEdgeRouter<{ 
        InputSchema: typeof GraphState; 
        Nodes: ["lowercase", "uppercase", "fallback"] 
    }> = (state) => {
        switch (state.command) {
            case "lowercase": return "IsLower";
            case "uppercase": return "IsUpper";
            default: return "Unknown"
        }
    };

export type GraphState = z.infer<typeof GraphState>

export function buildGraph() {
    const workflow = new StateGraph ({
        state: GraphState
    })
    .addNode("identifyIntent", identifyIntent)
    .addNode("chatResponse", chatResponse)
    .addNode("lowercase", lowercase)
    .addNode("uppercase", uppercase)    
    .addNode("fallback", fallback)
    .addEdge(START, "identifyIntent")
    .addConditionalEdges("identifyIntent", checkCase, {
        IsLower: "lowercase",
        IsUpper: "uppercase",
        Unknown: "fallback"
    }
    )
    .addEdge("lowercase", "chatResponse")
    .addEdge("uppercase", "chatResponse")
    .addEdge("fallback", "chatResponse")
    .addEdge("chatResponse", END)

    return workflow.compile()
}

export const graph = buildGraph()
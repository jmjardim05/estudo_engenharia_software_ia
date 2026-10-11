import Fastify from "fastify";
import { buildGraph } from "./graph/graph.ts";
import { HumanMessage } from "langchain";

const graph = buildGraph();

export const createServer = () => {
    const app = Fastify({})

    app.post("/chat", {
        schema: {
            body: {
                type: "object",
                required: ["question"],
                properties: {
                    question: {  
                        type: "string", 
                        minLength: 5,
                        maxLength: 1000 }
                }
            }
        },
    }, async (request, reply) => {
        try {
            const { question } = request.body as { question: string }
            const response = await graph.invoke({
                messages: [new HumanMessage(question)]
            });
            return reply.send(response.output)
        } catch (error) {
            app.log.error(error, "Error handling / chat request:")
            reply.code(500)        
        }
    })

    return app
}
import Fastify from "fastify";
import { OpenRouterService } from "./openrouterService.ts";

export const createServer = (router: OpenRouterService) => {
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
            const response = await router.generate(question)
            reply.send(response)
        } catch (error) {
            console.error("Error handling / chat request:", error)
            reply.code(500)        
        }
    })

    return app
}
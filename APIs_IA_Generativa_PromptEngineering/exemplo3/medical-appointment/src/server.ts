import { HumanMessage } from 'langchain';
import { buildGraph } from './graph/factory.ts';

import Fastify from 'fastify';

const graph = buildGraph();

export const createServer = () => {
    const app = Fastify();

    // Define a POST endpoint at '/chat' that expects a JSON body with a 'question' field.
    // The 'question' field must be a string with a minimum length of 10 characters.
    // The endpoint processes the request by invoking the graph with the user's question and returns the response.
    // If an error occurs during processing, it logs the error and returns a 500 status with an error message.
    app.post('/chat', {
        schema: {
            body: {
                type: 'object',
                required: ['question'],
                properties: {
                    question: { type: 'string', minLength: 10 },
                },
            }
        }
    }, async function (request, reply) {
        try {
            const { question } = request.body as {
                question: string;
            };

            // graph.invoke() is a method that takes an array of messages and returns a response from the graph.
            // In this case, we are sending a single HumanMessage with the user's question.
            const response = await graph.invoke({
                messages: [new HumanMessage(question)],
            });

            return response

        } catch (error) {
            console.error('❌ Error processing request:', error);
            return reply.status(500).send({
                error: 'An error occurred while processing your request.',
            });
        }
    });

    return app;
};

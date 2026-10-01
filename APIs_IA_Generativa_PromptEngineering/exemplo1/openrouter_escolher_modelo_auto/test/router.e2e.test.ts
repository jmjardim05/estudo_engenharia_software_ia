import test from "node:test"
import assert from "node:assert/strict"
import { createServer } from "../src/server.ts"
import { CONFIG } from "../src/config.ts"
import { type LLMResponse, OpenRouterService } from "../src/openrouterService.ts"

console.assert(
    process.env.OPENROUTER_API_KEY,
    "OPENROUTER_API_KEY not set in .env"
)

// test("openrouter escolhe o modelo mais barato", async () => {
//     const customConfig = {
//         ...CONFIG,
//         provider: {
//             ...CONFIG.provider,
//             sort: {
//                 ...CONFIG.provider.sort,
//                 by: "price"
//             }
//         }
//     }
//     const routerService = new OpenRouterService(customConfig)
//     const server = createServer(routerService)
//     server.listen({ port: customConfig.port })
    
//     const response = await server.inject(
//         {
//             url: "/chat",            
//             method: "POST",
//             body: {
//                 question: "o que é LLM?"
//             }
//         }
//     )
//     assert.equal(response.statusCode, 200)
//     const llmResponse = response.json() as LLMResponse
//     assert.equal(llmResponse.model, "stealth/space-bunny-alpha")
// })

test.todo("openrouter escolhe o modelo com maior saída")
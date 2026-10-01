import { createServer } from "./server.ts";
import { CONFIG } from "./config.ts";
import { OpenRouterService } from "./openrouterService.ts";

const routerService = new OpenRouterService(CONFIG)

const server = createServer(routerService)
server.listen({
    port: CONFIG.port,
})

server.inject(
    {
        url: "/chat",
        method: "POST",
        body: { question: "o que é typescript" }
    }
).then((response) => {
    console.log(response.statusCode)
    console.log(response.body)
})
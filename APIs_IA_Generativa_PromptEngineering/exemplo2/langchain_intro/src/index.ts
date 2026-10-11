import { createServer } from "./server.ts";

const server = createServer()
server.listen({
    port: 3000,
})

console.log("servidor rodadno na porta 3000")
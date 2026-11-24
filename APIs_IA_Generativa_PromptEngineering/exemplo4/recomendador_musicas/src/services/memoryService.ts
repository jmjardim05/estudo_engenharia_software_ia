import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";
import { config } from '../config.ts';

export type MemoryService = {
    // PostgersSaver is used to save the state of the graph to a PostgreSQL database
    checkpointer: PostgresSaver; 
    // PostgresStore is used to retrieve the state of the graph from a PostgreSQL database
    store: PostgresStore; 
}

export async function createMemoryService(): Promise<MemoryService> {
    const dbUri = config.memory.dbUri;
    const checkpointer = PostgresSaver.fromConnString(dbUri);
    const store = PostgresStore.fromConnString(dbUri);

    await store.setup();
    await checkpointer.setup();

    return { checkpointer, store };
}
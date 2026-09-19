import { CONFIG } from "./config.ts"
import { DocumentProcessor } from "./documentProcessor.ts"
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers"
import { type PretrainedOptions } from "@huggingface/transformers"
import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector"

let _neo4jVectorStore: Neo4jVectorStore | null = null

async function clearAll(vectorstore: Neo4jVectorStore, nodeLabel: string) {
    console.log("Removendo todos os documentos existentes...")
    try {
        await vectorstore.query(
            `MATCH (n:\`${nodeLabel}\`) DETACH DELETE n`
        )
        console.log("Documentos removidos com sucesso!")
    }
    catch (error) {
        console.error("Erro ao excluir documentos: ", error)
    }
}

try {
    console.log("Iniciando o processador de documentos")

    const documentProcessor = new DocumentProcessor(
        CONFIG.pdf.path,
        CONFIG.textSplitter
    )
    const documents = await documentProcessor.loadAndSplit()
    const embeddings = new HuggingFaceTransformersEmbeddings({
        model: CONFIG.embedding.modelName,
        pretrainedOptions: CONFIG.embedding.pretrainedOptions as PretrainedOptions
    })

    // const response = await embeddings.embedQuery("Final Fantasy")
    // console.log("Texto: 'Final Fantasy', Embeddings:", response)

    console.group("1. Carregando so documentos na base de vetores")
    // console.log("fromDocuments() => pula a etapa de realizar o laço e já inicializa carregando os documentos")
    // _neo4jVectorStore = await Neo4jVectorStore.fromDocuments(documents, embeddings, {
    //     ...CONFIG.neo4j
    // })
    _neo4jVectorStore = await Neo4jVectorStore.fromExistingGraph(embeddings, 
        CONFIG.neo4j)
    for (const [index, doc] of documents.entries()) {
        await _neo4jVectorStore.addDocuments([ doc ])
        console.log(`Adicionado documento: ${index + 1}`)
    }
    console.log("Documentos carregados com sucesso!")
    console.groupEnd()

    console.group("2. Busca por similaridade")
    const questions = [
        "o que é categorização",
        "o que significa treinar a rede?"
    ]
    for (const question of questions) {
        console.log("Pergunta:", question)
        const results = await _neo4jVectorStore.similaritySearch(
            question,
            CONFIG.similarity.topK
        )
        console.log("Respostas", results)
    }    
    console.groupEnd()
    
    await clearAll(_neo4jVectorStore, CONFIG.neo4j.nodeLabel)
}
catch (error) {
    console.error("Erro: ", error)
}
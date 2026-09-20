import { CONFIG } from "./config.ts"
import { DocumentProcessor } from "./documentProcessor.ts"
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers"
import { type PretrainedOptions } from "@huggingface/transformers"
import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector"
import { ChatOpenAI } from "@langchain/openai"
import { AI } from "./ai.ts"
import { writeFile, mkdir } from "node:fs/promises"

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

    const nlp = new ChatOpenAI({
        temperature: CONFIG.openRouter.temperature,
        maxRetries: CONFIG.openRouter.maxRetries,
        model: CONFIG.openRouter.nlpModel,
        openAIApiKey: CONFIG.openRouter.apiKey,
        configuration: {
            baseURL: CONFIG.openRouter.url,
            apiKey: CONFIG.openRouter.apiKey,
            defaultHeaders: CONFIG.openRouter.defaultHeaders,
            timeout: 60000
        }
    })
    
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

    const ai = new AI({
        debugLog: console.log,
        vectorStore: _neo4jVectorStore,
        promptConfig: CONFIG.promptConfig,
        templateText: CONFIG.templateText,
        nlpModel: nlp,
        topK: CONFIG.similarity.topK
    })

    console.group("2. Busca na base de vetores e envia o contexto para a IA responder")
    const questions = [
        "o que é categorização?",        
        "o que significa treinar a rede?"
    ]
    for (const index in questions) {
        const question = questions[index]
        console.log(`${"-".repeat(80)}`)
        console.log("Pergunta:", question)
        console.log(`${"-".repeat(80)}`)

        const result = await ai.answerQuestion(question!)
        if (result.error) continue
        
        console.log("Resposta")
        console.log(`${"-".repeat(80)}`)
        console.log(result.answer)
        console.log(`${"-".repeat(80)}`)

        await mkdir(CONFIG.output.path, { recursive: true })
        const fileName = `${CONFIG.output.path}/${CONFIG.output.fileName}_${index}_${Date.now()}.md`

        const conteudo = `**Pergunta: ${question}\n\n**Resposta:\n${result.answer!}`
        await writeFile(fileName, conteudo)
    }    
    console.groupEnd()
    
    await clearAll(_neo4jVectorStore, CONFIG.neo4j.nodeLabel)
}
catch (error) {
    console.error("Erro: ", error)
}
import { type Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector"
import { ChatMessage } from "@langchain/core/messages"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { RunnableSequence } from "@langchain/core/runnables"
import { ChatOpenAI } from "@langchain/openai"

type DebugLog = (...args: unknown[]) => void
type params = {
    debugLog: DebugLog,
    vectorStore: Neo4jVectorStore,
    nlpModel: ChatOpenAI,
    promptConfig: any,
    templateText: string,
    topK: number
}

interface ChainState {
    question: string;
    context?: string;
    topScore?: number;
    error?: string;
    answer?: string;
}

export class AI {
    private params: params
    constructor (params: params) {
        this.params = params
    }

    async retrieveVectorSearchResults(input: ChainState): Promise<ChainState> {
        const vectorResults = await this.params.vectorStore.similaritySearchWithScore(
            input.question,
            this.params.topK
        ) 
        if (!vectorResults.length)
        {
            input.error = "Não encontrado nenhuma informação relevante na base de dados"
            return input
        }
        const topScore = vectorResults[0]![1]
        // this.params.debugLog(`Encontrados ${vectorResults.length} resultados. Max score: ${topScore}`)
        const context = vectorResults.filter(([,score]) => score > 0.5)
                                     .map(([doc,]) => doc.pageContent)
                                     .join("\n---\n")  
        // this.params.debugLog("Contexto: ", context)                                   
        return {
            ...input,
            context: context,
            topScore: topScore
        }
    }

    async generateNLPRResponse(input: ChainState): Promise<ChainState> {        
        if (input.error) return input
        
        const chat = ChatPromptTemplate.fromTemplate(this.params.templateText)
        const responseChain = chat.pipe(this.params.nlpModel)
            .pipe(new StringOutputParser)
        
        const response = await responseChain.invoke({
                role: this.params.promptConfig.role,
                task: this.params.promptConfig.task,
                tone: this.params.promptConfig.constraints.tone,
                language: this.params.promptConfig.constraints.language,
                format: this.params.promptConfig.constraints.format,
                instructions: this.params.promptConfig.instructions
                    .map((instruction: string, idx: number) => 
                        `${idx + 1}. ${instruction}`).join("\n"),
                question: input.question!,
                context: input.context!
            })
        
        const answer = response
        return {
            ...input,
            answer
        }
    }

    // async generateNLPRResponse(input: ChainState): Promise<ChainState> {        
    //     const systemPrompt = this.params.templateText
    //         .replace("{role}", this.params.promptConfig.role)
    //         .replace("{task}", this.params.promptConfig.task)
    //         .replace("{tone}", this.params.promptConfig.constraints.tone)
    //         .replace("{language}", this.params.promptConfig.constraints.language)
    //         .replace("{format}", this.params.promptConfig.constraints.format)
    //         .replace("{instructions}", this.params.promptConfig.instructions
    //             .map((instruction: string, idx: number) => `${idx + 1}. ${instruction}`).join(`\n`))
    //         .replace("{question}", input.question)
    //         .replace("{context}", input.context ?? "")
    //     const result = await this.params.nlpModel.completionWithRetry(
    //         {
    //             messages: [{
    //                 role: "system",
    //                 content: systemPrompt
    //             },
    //             {
    //                 role: "user",
    //                 content: input.question
    //             }],
    //             model: "gpt-4.1-nano"
    //         }, { stream: true }
    //     )
    //     input.answer = result.choices.find(choice => choice.message.content !== "")?.message.content ?? ""
    //     return {
    //         ...input
    //     }
    // }

    async answerQuestion(question: string) {
        const chain = RunnableSequence.from([
            this.retrieveVectorSearchResults.bind(this),
            this.generateNLPRResponse.bind(this)
        ])

        const result = await chain.invoke({ question })        
        return result
    }
}
import tf from '@tensorflow/tfjs-node';

async function trainModel(inputXs, outpuYs)
{
    const model = tf.sequential();

    // criar modelo de entrada para o treinamento
    // com 7 posições
    // inuptShape: [idade_normalizada, cor.azul, cor.vermelho, cor.verde, localizacao.São Paulo, localizacao.Rio, localizacao.Curitiba]

    // units (neurônios): 80
    // como são poucos dados de entrada precisamos aumentar a quantidade de neurônios para melhorar a "inteligência" do modelo

    // activation: relu
    // descarta resultados que não precisam ser considerados (ex: valores negativos nos tensores)
    // ajuda a manter a rede neural somente com dados relevantes
    model.add(tf.layers.dense({ inputShape: [7], units: 80, activation: "relu" }))

    // adiconar o modelo de saída
    // com 3 neurônios uma para cada categoria
    // [premium, medium, basic]

    // activation: softmax
    // retorna em formato de probabilidade
    model.add(tf.layers.dense({  units: 3, activation: "softmax" }))

    // compilar o modelo
    // optimizer: adam
    // Adaptative Moment Estimation
    // é o "treinador" que aprende com os erros e acertos

    // loss: categoricalCrossentropy
    // compara os resultados que o modelo "acha" com as respostas
    // ex: [1, 0, 0] é a resposta categoria premuium, as repostas do modelo serão comparadas com essa reposta
    // Exemplos de quando usar: categorização de usuários, recomendações, classificação de imagens
    // sempre que a resposta é "uma única entre várias opções"

    // metrics: ["accuracy"]
    // quanto mais distante da previsão do modelo maior o loss
    model.compile({ optimizer: "adam", loss: "categoricalCrossentropy", metrics: ["accuracy"] })    

    // treinar o modelo
    await model.fit(inputXs, outpuYs,
        {
            epochs: 100, // quantidade de vezes que os dados de treinamento serão processados
            shuffle: true, // embaralha a ordem dos dados de treinamento em cada aepoch, para garatir que o apredizado ocorra sem "vícios"
            verbose: 0, // 0 tira os logs do treinamento
            callbacks: {
                // onEpochEnd: (epoch, logs) => console.log(`Epoch: ${epoch} Loss: ${logs.loss}`) // callback que será chama ao final de cada epoch
            }
        }
    )

    return model
}

async function predict(pessoaArray, model)
{
    // criar o Tensor
    const pessoaTensor = tf.tensor2d(pessoaArray);

    return model.predict(pessoaTensor)
} 

// Exemplo de pessoas para treino (cada pessoa com idade, cor e localização)
// const pessoas = [
//     { nome: "Erick", idade: 30, cor: "azul", localizacao: "São Paulo" },
//     { nome: "Ana", idade: 25, cor: "vermelho", localizacao: "Rio" },
//     { nome: "Carlos", idade: 40, cor: "verde", localizacao: "Curitiba" }
// ];

// Vetores de entrada com valores já normalizados e one-hot encoded
// Ordem: [idade_normalizada, azul, vermelho, verde, São Paulo, Rio, Curitiba]
// const tensorPessoas = [
//     [0.33, 1, 0, 0, 1, 0, 0], // Erick
//     [0, 0, 1, 0, 0, 1, 0],    // Ana
//     [1, 0, 0, 1, 0, 0, 1]     // Carlos
// ]

// Usamos apenas os dados numéricos, como a rede neural só entende números.
// tensorPessoasNormalizado corresponde ao dataset de entrada do modelo.
const tensorPessoasNormalizado = [
    [0.33, 1, 0, 0, 1, 0, 0], // Erick
    [0, 0, 1, 0, 0, 1, 0],    // Ana
    [1, 0, 0, 1, 0, 0, 1]     // Carlos
]

// Labels das categorias a serem previstas (one-hot encoded)
// [premium, medium, basic]
const labelsNomes = ["premium", "medium", "basic"]; // Ordem dos labels
const tensorLabels = [
    [1, 0, 0], // premium - Erick
    [0, 1, 0], // medium - Ana
    [0, 0, 1]  // basic - Carlos
];

// Criamos tensores de entrada (xs) e saída (ys) para treinar o modelo
const inputXs = tf.tensor2d(tensorPessoasNormalizado)
const outputYs = tf.tensor2d(tensorLabels)

// inputXs.print();
// outputYs.print();
const model = await trainModel(inputXs, outputYs)

// testar o modelo
const pessoa = { nome: "Joao", idade: 40, cor: "vermelho", localizacao: "Rio"}
const pessoaArray = [
    [1, 0, 1, 0, 0, 1, 0]
]

const categoriaTensor = await predict(pessoaArray, model)
const possivelCategoria = categoriaTensor.arraySync()[0].reduce((prev, max) => max = prev < max ? max : prev, 0)
// console.log(`A categooria de: ${pessoa.nome} possivelmente é ${possivelCategoria}`)
console.log(`A categooria de ${pessoa.nome} possivelmente é ${labelsNomes[categoriaTensor.arraySync()[0].indexOf(possivelCategoria)]}`)
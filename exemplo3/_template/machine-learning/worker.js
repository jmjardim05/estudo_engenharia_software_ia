importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');

const MODEL_PATH = `yolov5n_web_model/model.json`;
const LABELS_PATH = `yolov5n_web_model/labels.json`;

let _labels = []
let _model = null
const INPUTDIM = 640
const CLASS_THRESHOLD = 0.4

async function loadModelAndLabels() {
    await tf.ready()

    _labels = await fetch(LABELS_PATH).then(res => res.json())
    _model = await tf.loadGraphModel(MODEL_PATH)
    
    // warmup
    const dummyInput = tf.ones(_model.inputs[0].shape) // Cria um tensor de entrada fictício com a mesma forma que a entrada do modelo
    await _model.executeAsync(dummyInput) // Executa o modelo com a entrada fictícia para "aquecer" o modelo e otimizar a execução futura
    tf.dispose(dummyInput) // Descarta o tensor de entrada fictício para liberar memória

    postMessage({ type: "model_loaded" })
}

function preprocessImage(imageInput) {
    // Esta função pré-processa a imagem de entrada para que ela possa ser usada como entrada para o modelo YOLOv5n
    // tf.tidy é usado para gerenciar a memória automaticamente, descartando tensores intermediários que não são mais necessários
    return tf.tidy(() => {
        const image = tf.browser.fromPixels(imageInput) // Converte a imagem de entrada em um tensor
        return tf.image.resizeBilinear(image, [INPUTDIM, INPUTDIM]) // Redimensiona a imagem para as dimensões de entrada do modelo
                 .div(255) // Normaliza os valores dos pixels para o intervalo [0, 1]
                 .expandDims(0) // Adiciona uma dimensão de lote para que a forma do tensor seja [1, INPUTDIM, INPUTDIM, 3]
    })
}

async function runInference(input) {
    const output = await _model.executeAsync(input) // Executa o modelo com a entrada pré-processada
    tf.dispose(input) // Descarta o tensor de entrada para liberar memória
    
    // assumes que os três primeiros elementos são
    // as "caixas" onde as imagens estão contidas
    // a pontuação
    // e as classes dos objetos
    const [boxes, scores, classes] = output.slice(0, 3)
    const [boxesData, scoresData, classesData] = await Promise.all(
        [
            boxes.data(),
            scores.data(),
            classes.data()
        ]
    )

    output.forEach(t => t.dispose())
    return {
        boxes: boxesData,
        scores: scoresData,
        classes: classesData
    }
}

function * processPredicitons({ boxes, scores, classes }, width, height)
{
    for (let i = 0; i < scores.length; i++) 
    {
        // se não estiver dentro de um score mínimo (CLASS_THRESHOLD)
        if (scores[i] < CLASS_THRESHOLD) continue        

        // pega a classe que ele identificou
        const label = _labels[classes[i]]

        // tem que ser igual a kite (classe que identifica o pato)
        if (label !== "kite") continue
        
        // pega as coordenadas da imagem classificada (kite)
        let [x1, y1, x2, y2] = boxes.slice(i * 4, (i + 1) * 4)
        x1 *= width
        x2 *= width
        y1 *= height
        y2 *= height

        const boxWidth = x2 - x1
        const boxHeight = y2 - y1
        const centerX = x1 + boxWidth / 2
        const centerY = y1 + boxHeight / 2

        yield {
            x: centerX,
            y: centerY,
            score: (scores[i] * 100).toFixed(2)
        }        
    }
}

loadModelAndLabels()

self.onmessage = async ({ data }) => {
    if (data.type !== 'predict') return

    if (!_model)  return

    // Pré-processa a imagem de entrada, convertendo-a em um tensor adequado para o modelo
    const input = preprocessImage(data.image)
    
    const { width, height } = data.image
    
    // extrai os dados da imagem capturada
    // e retorna um objeto
    // com as "caixas" de imagens
    // a potnuação
    // e as classes inferidas
    const inferencedResult = await runInference(input)

    for (const prediction of processPredicitons(inferencedResult, width, height))
    {
        postMessage({
            type: 'prediction',
            ...prediction
        });
    }
};

console.log('🧠 YOLOv5n Web Worker initialized');

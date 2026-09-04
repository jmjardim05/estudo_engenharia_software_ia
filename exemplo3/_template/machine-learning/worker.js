importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');

const MODEL_PATH = `yolov5n_web_model/model.json`;
const LABELS_PATH = `yolov5n_web_model/labels.json`;

let _labels = []
let _model = null

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

loadModelAndLabels()

function preprocessImage(imageBitmap) {
}

self.onmessage = async ({ data }) => {
    if (data.type !== 'predict') return

    if (!_model) {
        postMessage({ type: "error", message: "Model not loaded yet" })
        return
    }

    const input = preprocessImage(data.image)

    postMessage({
        type: 'prediction',
        x: 400,
        y: 400,
        score: 0
    });


};

console.log('🧠 YOLOv5n Web Worker initialized');

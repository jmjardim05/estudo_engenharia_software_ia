import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

console.log('Model training worker initialized');
let _globalCtx = {};
let _model = null;

const WEIGHTS = {
    // Example weights for different features, these can be adjusted based on importance
    category: 0.4,
    color: 0.3,
    price: 0.3,
    age: 0.1
};

const normalize = (value, min, max) => ((value - min) / (max - min) || 1);

function makeContext(products, users) {
    // Simulate creating a context for training

    // Example: Calculate average price, average age, unique categories and colors

    //  map() devolve um array no memso tamanho da original modificada pelo callback, nesse caso pegando o preço de cada produto
    const prices = products.map(product => product.price);
    const ages = users.map(user => user.age);
    const categories = products.map(product => product.category);
    const colors = products.map(product => product.color);

    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);

    const maxAge = Math.max(...ages);
    const minAge = Math.min(...ages);

    // Computar a média de idade dos usuários
    const mediumAge = (maxAge + minAge) / 2;

    // Set() devolve um array com valores únicos, nesse caso categorias e cores únicas
    const uniqueCategories = [...new Set(categories)];
    const uniqueColors = [...new Set(colors)];

    // Criar índices para categorias e cores únicas
    const categoriesIndex = Object.fromEntries(uniqueCategories.map((cat, index) => [cat, index]));
    const colorsIndex = Object.fromEntries(uniqueColors.map((color, index) => [color, index]));

    // Criar um objeto para armazenar a soma das idades e a contagem de usuários por idade por produto, para ajudar a personalizar recomendações com base na idade do usuário
    const ageSums = {};
    const ageCounts = {};
    users.forEach(user => {
        user.purchases.forEach(purchase => {
            // Incrementar a soma das idades e a contagem de usuários por idade
            // Se a idade do usuário ainda não estiver no objeto, inicializar com 0, operador lógico OR (||) é usado para definir um valor padrão caso a chave não exista
            ageSums[purchase.name] = (ageSums[purchase.name] || 0) + user.age;
            ageCounts[purchase.name] = (ageCounts[purchase.name] || 0) + 1;
        })
    });

    // Calcular a média de idade por produto, normalizando os valores entre 0 e 1
    // Se não houver usuários que compraram o produto, usar a média geral de idade
    // Object.fromEntries() é usado para criar um objeto a partir de um array de pares chave-valor, nesse caso o nome do produto e a média de idade normalizada
    const avgAgesByProduct = Object.fromEntries(
        products.map(product => {
            const avgAge = ageCounts[product.name] ? ageSums[product.name] / ageCounts[product.name] : mediumAge;
            return [product.name, normalize(avgAge, minAge, maxAge)];
        })
    );

    return {
        catalog: products,
        users,
        categoriesIndex,
        colorsIndex,
        minPrice,
        maxPrice,
        minAge,
        maxAge,
        numCategories: uniqueCategories.length,
        numColors: uniqueColors.length,
        // 2 for price and age, plus one for each unique category and color
        dimensions: 2 + uniqueCategories.length + uniqueColors.length,
        avgAgesByProduct
    };
}

// One-hot encode a categorical feature with a given weight
// This function creates a one-hot encoded tensor for a given index and length, then multiplies it by the specified weight
const oneHotWeigthed = (index, length, weight) => tf.oneHot(index, length).cast("float32").mul(weight);

// Encode product features into a vector for model training
// Each feature is normalized and weighted according to its importance
function encodeProduct(product, ctx) {
    const price = tf.tensor1d([normalize(product.price, ctx.minPrice, ctx.maxPrice) * WEIGHTS.price]);
    const age = tf.tensor1d([ctx.avgAgesByProduct[product.name] ?? 0.5 * WEIGHTS.age]);
    const category = oneHotWeigthed(ctx.categoriesIndex[product.category] || 0, ctx.numCategories, WEIGHTS.category);
    const color = oneHotWeigthed(ctx.colorsIndex[product.color] || 0, ctx.numColors, WEIGHTS.color);

    return tf.concat1d([price, age, category, color]);
}

function encodeUsers(user, ctx) {
    if (user.purchases && user.purchases.length > 0) {
        return tf.stack(user.purchases.map(product => encodeProduct(product, ctx)))
            .mean(0) // Average the encoded vectors of purchased products
            .reshape([1, ctx.dimensions]); // Reshape to match the model input shape  
    }

    return tf.concat1d([
        tf.zeros([1]), // Placeholder for price
        tf.tensor1d([normalize(user.age, ctx.minAge, ctx.maxAge) * WEIGHTS.age]), // Normalized age
        tf.zeros([ctx.numCategories]), // Placeholder for category
        tf.zeros([ctx.numColors]) // Placeholder for color
    ]).reshape([1, ctx.dimensions]); // Reshape to match the model input shape
}

function createTrainingData(ctx) {
    const inputs = [];
    const labels = [];

    // Create training data by encoding each product and associating it with user interactions
    ctx.users
        .filter(user => user.purchases && user.purchases.length > 0)
        .forEach(user => {
            const userVector = encodeUsers(user, ctx).dataSync(); // Convert tensor to array
            ctx.catalog.forEach(product => {
                const productvector = encodeProduct(product, ctx).dataSync(); // Convert tensor to array
                const label = user.purchases.some(p => p.name === product.name) ? 1 : 0; // 1 if purchased, else 0

                inputs.push([...userVector, ...productvector]); // Combine user and product vectors
                labels.push(label); // Add label for training (1 for purchased, 0 for not purchased)
            });

        });

    return {
        xs: tf.tensor2d(inputs),
        ys: tf.tensor2d(labels, [labels.length, 1]), // Reshape labels to match the model output shape
        inputShape: [ctx.dimensions * 2] // Input shape is double the dimensions (user + product)
    };
}

async function configureNeuralNetAndTrain(trainingData) {
    // Create a simple feedforward neural network for binary classification
    // tf.sequential() creates a sequential model, which is a linear stack of layers
    const model = tf.sequential();

    // Add layers to the model
    // tf.layers.dense() creates a densely-connected layer, where each neuron is connected to every neuron in the previous layer
    // inputShape specifies the shape of the input data, units specifies the number of neurons in the layer, and activation specifies the activation function to use
    // The first layer has 128 neurons and uses the ReLU activation function, which introduces non-linearity to the model
    model.add(tf.layers.dense({ inputShape: trainingData.inputShape, units: 128, activation: 'relu' }));
    // The second layer has 64 neurons and also uses the ReLU activation function
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    // The third layer has 32 neurons and uses the ReLU activation function
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));

    // activation function for the output layer is sigmoid, which outputs a value between 0 and 1, suitable for binary classification tasks
    // example: if the output is greater than 0.5, it can be interpreted as a positive class (purchased), otherwise as a negative class (not purchased)
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // Output layer with 1 neuron and sigmoid activation for binary classification

    // Compile the model with an optimizer, loss function, and metrics
    model.compile({
        optimizer: 'adam', // Adam optimizer is an adaptive learning rate optimization algorithm that has been designed specifically for training deep neural networks
        loss: 'binaryCrossentropy', // Binary cross-entropy loss function is used for binary classification tasks, measuring the difference between predicted probabilities and actual class labels
        metrics: ['accuracy'] // Accuracy metric is used to evaluate the performance of the model during training and testing
    });

    await model.fit(trainingData.xs, trainingData.ys, {
        epochs: 125, // Number of times the model will iterate over the entire training dataset
        batchSize: 32, // Number of samples per gradient update
        shuffle: true, // Shuffle the training data before each epoch to prevent the model from learning the order of the data
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                // Log the loss and accuracy at the end of each epoch
                // Simulate training log
                postMessage({
                    type: workerEvents.trainingLog,
                    epoch: epoch,
                    loss: logs.loss,
                    accuracy: logs.acc
                });
            }
        }
    });

    return model;
}

async function trainModel({ users }) {
    console.log('Training model with users:', users)

    // Simulate training process
    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 50 } });

    // Carregar dados de treinamento (exemplo)
    const products = await fetch('/data/products.json').then(res => res.json());

    // Criar contexto de treinamento (exemplo)
    const context = makeContext(products, users);
    _globalCtx = context;

    context.productVectors = products.map(product => {
        return {
            name: product.name,
            metadata: product,
            vector: encodeProduct(product, context).dataSync() // Convert tensor to array
        }
    });

    const trainingData = createTrainingData(context);

    _model = await configureNeuralNetAndTrain(trainingData);

    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 100 } });
    postMessage({ type: workerEvents.trainingComplete });
}

function recommend(user) {
    if (!_model) {
        console.error('Model is not trained yet.');
        return;
    }

    const context = _globalCtx;
    const userVector = encodeUsers(user, context).dataSync(); // Converter tensor para array
    
    // Criar entradas combinando o vetor do usuário com os vetores de cada produto
    // Em aplicaçãoes reais, os dados devem estar armazenados em um banco de dados ou serviço de recomendação, e não em memória
    // por isso, o código abaixo é apenas um exemplo de como gerar recomendações com base no modelo treinado
    // Armazenar os vetores de produto em bases de dados vetroriais (ex: Pinecone, Weaviate, Milvus, etc.) 
    // é uma prática comum para sistemas de recomendação em produção
    
    const input = context.productVectors.map(({ vector }) => {
        return [...userVector, ...vector]; // Combinar vetores de usuário e produto
    });
    const inputTensor = tf.tensor2d(input);
    const predictions = _model.predict(inputTensor).dataSync();
    const recommendations = context.productVectors
        .map((product, index) => ({ product: product.metadata, score: predictions[index] }))
        .sort((a, b) => b.score - a.score) // Ordenar por score decrescente
    
    console.log('will recommend for user:', user)
    postMessage({
        type: workerEvents.recommend,
        user,
        recommendations: recommendations.map(r => ({ ...r.product, score: r.score })) // Retornar apenas os produtos recomendados com seus scores
    });
}


const handlers = {
    [workerEvents.trainModel]: trainModel,
    [workerEvents.recommend]: d => recommend(d.user, _globalCtx),
};

self.onmessage = e => {
    const { action, ...data } = e.data;
    if (handlers[action]) handlers[action](data);
};

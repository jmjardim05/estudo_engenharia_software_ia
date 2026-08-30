import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

console.log('Model training worker initialized');
let _globalCtx = {};

const normalize = (value, min, max) => ((value - min) / (max - min) || 1);

function makeContext(trainingData, users) {    
    // Simulate creating a context for training

    // Example: Calculate average price, average age, unique categories and colors

    //  map() devolve um array no memso tamanho da original modificada pelo callback, nesse caso pegando o preço de cada produto
    const prices = trainingData.map(product => product.price);
    const ages = users.map(user => user.age);
    const categories = trainingData.map(product => product.category);
    const colors = trainingData.map(product => product.color);

    // reduce() devolve um único valor, nesse caso a soma de todos os preços e idades
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const avgAge = ages.reduce((a, b) => a + b, 0) / ages.length;

    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);

    const maxAge = Math.max(...ages);
    const minAge = Math.min(...ages);

    // Computar a média de idade dos usuários e a média de preço dos produtos
    const mediumPrice = (maxPrice + minPrice) / 2;
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
        trainingData.map(product => {
            const avgAge = ageCounts[product.name] ? ageSums[product.name] / ageCounts[product.name] : mediumAge;
            return [product.name, normalize(avgAge, minAge, maxAge)];
        })
    ); 

    return {
        catalog: trainingData,
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
        dimensions: 2 + uniqueCategories.length + uniqueColors.length 
    };
}

async function trainModel({ users }) {
    console.log('Training model with users:', users)

    // Simulate training process
    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 50 } });

    // Carregar dados de treinamento (exemplo)
    const trainingData = await fetch('/data/products.json').then(res => res.json());   

    // Criar contexto de treinamento (exemplo)
    const context = makeContext(trainingData, users);
    debugger;

    // Simulate training log
    postMessage({
        type: workerEvents.trainingLog,
        epoch: 1,
        loss: 1,
        accuracy: 1
    });

    setTimeout(() => {
        postMessage({ type: workerEvents.progressUpdate, progress: { progress: 100 } });
        postMessage({ type: workerEvents.trainingComplete });
    }, 1000);


}
function recommend(user, ctx) {
    console.log('will recommend for user:', user)
    // postMessage({
    //     type: workerEvents.recommend,
    //     user,
    //     recommendations: []
    // });
}


const handlers = {
    [workerEvents.trainModel]: trainModel,
    [workerEvents.recommend]: d => recommend(d.user, _globalCtx),
};

self.onmessage = e => {
    const { action, ...data } = e.data;
    if (handlers[action]) handlers[action](data);
};

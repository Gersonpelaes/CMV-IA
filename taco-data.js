const tacoDatabase = [
    { nome: "Arroz, branco, cozido", kcal: 128, carb: 28.1, prot: 2.5, gord: 0.2 },
    { nome: "Arroz, integral, cozido", kcal: 124, carb: 25.8, prot: 2.6, gord: 1.0 },
    { nome: "Feijão, carioca, cozido", kcal: 76, carb: 13.6, prot: 4.8, gord: 0.5 },
    { nome: "Feijão, preto, cozido", kcal: 77, carb: 14.0, prot: 4.5, gord: 0.5 },
    { nome: "Macarrão, trigo, cru", kcal: 371, carb: 77.9, prot: 10.0, gord: 1.3 },
    { nome: "Macarrão, trigo, cozido", kcal: 137, carb: 28.8, prot: 3.8, gord: 0.5 },
    { nome: "Farinha, de trigo", kcal: 360, carb: 75.3, prot: 9.8, gord: 1.4 },
    { nome: "Farinha, de mandioca", kcal: 361, carb: 87.9, prot: 1.6, gord: 0.3 },
    { nome: "Aveia, flocos", kcal: 394, carb: 66.6, prot: 13.9, gord: 8.5 },
    { nome: "Batata, inglesa, cozida", kcal: 52, carb: 11.9, prot: 1.2, gord: 0 },
    { nome: "Batata, doce, cozida", kcal: 77, carb: 18.4, prot: 0.6, gord: 0.1 },
    { nome: "Batata, frita", kcal: 267, carb: 35.6, prot: 3.4, gord: 13.1 },
    { nome: "Cebola, crua", kcal: 39, carb: 8.9, prot: 1.3, gord: 0.1 },
    { nome: "Alho, cru", kcal: 113, carb: 23.9, prot: 7.0, gord: 0.2 },
    { nome: "Tomate, salada", kcal: 15, carb: 3.1, prot: 1.1, gord: 0.2 },
    { nome: "Cenoura, crua", kcal: 34, carb: 7.7, prot: 1.3, gord: 0.2 },
    { nome: "Alface", kcal: 11, carb: 1.7, prot: 1.3, gord: 0.2 },
    { nome: "Banana, prata", kcal: 98, carb: 26.0, prot: 1.3, gord: 0.1 },
    { nome: "Maçã", kcal: 52, carb: 15.2, prot: 0.3, gord: 0.2 },
    { nome: "Limão", kcal: 12, carb: 3.2, prot: 0.9, gord: 0.1 },
    { nome: "Laranja", kcal: 46, carb: 11.5, prot: 1.0, gord: 0.1 },
    { nome: "Frango, peito, sem pele, cozido", kcal: 163, carb: 0, prot: 31.5, gord: 3.2 },
    { nome: "Frango, peito, cru", kcal: 119, carb: 0, prot: 21.5, gord: 3.0 },
    { nome: "Frango, coxa, assada", kcal: 215, carb: 0.1, prot: 28.5, gord: 10.4 },
    { nome: "Ovo, de galinha, cozido", kcal: 146, carb: 0.6, prot: 13.3, gord: 9.5 },
    { nome: "Carne, bovina, patinho, cru", kcal: 133, carb: 0, prot: 21.6, gord: 4.5 },
    { nome: "Carne, bovina, alcatra, cru", kcal: 163, carb: 0, prot: 21.6, gord: 7.8 },
    { nome: "Carne, bovina, picanha, crua", kcal: 213, carb: 0, prot: 18.8, gord: 14.7 },
    { nome: "Carne, bovina, moída", kcal: 213, carb: 0, prot: 26.6, gord: 11.1 },
    { nome: "Carne, suína, lombo, cru", kcal: 134, carb: 0, prot: 22.6, gord: 4.2 },
    { nome: "Linguiça, suína", kcal: 300, carb: 0, prot: 14.0, gord: 27.0 },
    { nome: "Bacon", kcal: 541, carb: 1.4, prot: 37.1, gord: 41.3 },
    { nome: "Peixe, tilápia, filé, cru", kcal: 96, carb: 0, prot: 20.1, gord: 1.7 },
    { nome: "Salmão, cru", kcal: 170, carb: 0, prot: 19.3, gord: 9.8 },
    { nome: "Leite, integral", kcal: 58, carb: 4.5, prot: 3.3, gord: 3.0 },
    { nome: "Leite, desnatado", kcal: 35, carb: 5.0, prot: 3.5, gord: 0.1 },
    { nome: "Leite, condensado", kcal: 313, carb: 57.3, prot: 7.7, gord: 6.7 },
    { nome: "Creme de leite", kcal: 316, carb: 3.0, prot: 2.0, gord: 33.5 },
    { nome: "Queijo, mussarela", kcal: 330, carb: 3.0, prot: 22.6, gord: 25.2 },
    { nome: "Queijo, parmesão", kcal: 396, carb: 3.2, prot: 35.6, gord: 26.1 },
    { nome: "Manteiga", kcal: 726, carb: 0.1, prot: 0.4, gord: 80.6 },
    { nome: "Margarina", kcal: 717, carb: 0, prot: 0.1, gord: 81.0 },
    { nome: "Óleo, de soja", kcal: 884, carb: 0, prot: 0, gord: 100 },
    { nome: "Azeite, de oliva", kcal: 884, carb: 0, prot: 0, gord: 100 },
    { nome: "Açúcar, refinado", kcal: 387, carb: 99.5, prot: 0, gord: 0 },
    { nome: "Açúcar, mascavo", kcal: 369, carb: 95.0, prot: 0, gord: 0 },
    { nome: "Sal, grosso", kcal: 0, carb: 0, prot: 0, gord: 0 },
    { nome: "Sal, refinado", kcal: 0, carb: 0, prot: 0, gord: 0 },
    { nome: "Pão, francês", kcal: 300, carb: 58.6, prot: 8.0, gord: 3.1 },
    { nome: "Chocolate, meio amargo", kcal: 546, carb: 61.2, prot: 4.9, gord: 29.9 },
    { nome: "Achocolatado, pó", kcal: 395, carb: 91.5, prot: 4.0, gord: 1.5 },
    { nome: "Maionese", kcal: 302, carb: 7.7, prot: 0.6, gord: 30.0 },
    { nome: "Ketchup", kcal: 112, carb: 27.4, prot: 1.3, gord: 0.1 },
    { nome: "Mostarda", kcal: 66, carb: 5.8, prot: 4.4, gord: 3.3 },
    { nome: "Molho de tomate", kcal: 38, carb: 8.5, prot: 1.2, gord: 0.2 },
    { nome: "Molho shoyu", kcal: 60, carb: 8.5, prot: 5.5, gord: 0 }
];

/**
 * Remove acentos e converte para minúsculas
 */
function normalizeString(str) {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Algoritmo simples de similaridade (fator de matches de palavras)
 */
function calculateSimilarity(str1, str2) {
    const s1 = normalizeString(str1).split(/[\s,]+/);
    const s2 = normalizeString(str2).split(/[\s,]+/);
    
    let matches = 0;
    for(let word of s1) {
        if(word.length > 2 && s2.some(w => w.includes(word) || word.includes(w))) {
            matches++;
        }
    }
    // Retorna um peso baseado em quantas palavras da string de busca foram encontradas
    return matches / s1.length;
}

/**
 * Tenta mapear o nome do ingrediente com a base TACO.
 * Retorna o objeto nutricional (por 100g) ou null se não achar nada confiável.
 */
window.autoMapNutrition = function(ingredientName) {
    let bestMatch = null;
    let highestScore = 0;

    for(let item of tacoDatabase) {
        const score = calculateSimilarity(ingredientName, item.nome);
        if(score > highestScore) {
            highestScore = score;
            bestMatch = item;
        }
    }

    // Se o match for satisfatório (ex: pelo menos 50% de confiança para nomes curtos)
    if(highestScore >= 0.5 && bestMatch) {
        return {
            kcal: bestMatch.kcal,
            carb: bestMatch.carb,
            prot: bestMatch.prot,
            gord: bestMatch.gord,
            tacoMatch: bestMatch.nome
        };
    }
    
    return null; // Nenhum match confiável
};

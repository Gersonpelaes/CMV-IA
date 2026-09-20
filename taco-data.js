const tacoDatabase = [
    // --- Cereais e Finais ---
    { nome: "Arroz, branco, cozido", kcal: 128, carb: 28.1, prot: 2.5, gord: 0.2 },
    { nome: "Arroz, integral, cozido", kcal: 124, carb: 25.8, prot: 2.6, gord: 1.0 },
    { nome: "Arroz, cru", kcal: 358, carb: 78.8, prot: 7.2, gord: 0.3 },
    { nome: "Feijão, carioca, cozido", kcal: 76, carb: 13.6, prot: 4.8, gord: 0.5 },
    { nome: "Feijão, preto, cozido", kcal: 77, carb: 14.0, prot: 4.5, gord: 0.5 },
    { nome: "Macarrão, trigo, cru", kcal: 371, carb: 77.9, prot: 10.0, gord: 1.3 },
    { nome: "Macarrão, trigo, cozido", kcal: 137, carb: 28.8, prot: 3.8, gord: 0.5 },
    { nome: "Farinha, de trigo", kcal: 360, carb: 75.3, prot: 9.8, gord: 1.4 },
    { nome: "Farinha, de mandioca", kcal: 361, carb: 87.9, prot: 1.6, gord: 0.3 },
    { nome: "Farinha, de milho", kcal: 351, carb: 79.4, prot: 7.2, gord: 1.5 },
    { nome: "Farinha, de rosca", kcal: 371, carb: 75.8, prot: 11.4, gord: 1.5 },
    { nome: "Amido, de milho (maisena)", kcal: 361, carb: 91.2, prot: 0.3, gord: 0 },
    { nome: "Aveia, flocos", kcal: 394, carb: 66.6, prot: 13.9, gord: 8.5 },
    { nome: "Pão, francês", kcal: 300, carb: 58.6, prot: 8.0, gord: 3.1 },
    { nome: "Pão, de forma", kcal: 253, carb: 49.9, prot: 9.4, gord: 1.8 },
    { nome: "Pão, de queijo", kcal: 363, carb: 34.2, prot: 5.1, gord: 24.6 },
    { nome: "Pão, hambúrguer", kcal: 293, carb: 56.6, prot: 10.1, gord: 3.7 },
    { nome: "Pão, hot dog (cachorro quente)", kcal: 293, carb: 56.6, prot: 10.1, gord: 3.7 },
    { nome: "Pão, sírio", kcal: 275, carb: 58.4, prot: 9.2, gord: 1.0 },
    { nome: "Massa, pastel", kcal: 311, carb: 49.3, prot: 6.9, gord: 10.1 },
    { nome: "Massa, pizza", kcal: 289, carb: 49.6, prot: 7.8, gord: 6.9 },

    // --- Hortifruti (Verduras e Legumes) ---
    { nome: "Batata, inglesa, crua", kcal: 64, carb: 14.7, prot: 1.8, gord: 0 },
    { nome: "Batata, inglesa, cozida", kcal: 52, carb: 11.9, prot: 1.2, gord: 0 },
    { nome: "Batata, doce, cozida", kcal: 77, carb: 18.4, prot: 0.6, gord: 0.1 },
    { nome: "Batata, frita", kcal: 267, carb: 35.6, prot: 3.4, gord: 13.1 },
    { nome: "Cebola, crua", kcal: 39, carb: 8.9, prot: 1.3, gord: 0.1 },
    { nome: "Cebola, roxa", kcal: 39, carb: 8.9, prot: 1.3, gord: 0.1 },
    { nome: "Alho, cru", kcal: 113, carb: 23.9, prot: 7.0, gord: 0.2 },
    { nome: "Tomate, salada", kcal: 15, carb: 3.1, prot: 1.1, gord: 0.2 },
    { nome: "Cenoura, crua", kcal: 34, carb: 7.7, prot: 1.3, gord: 0.2 },
    { nome: "Alface", kcal: 11, carb: 1.7, prot: 1.3, gord: 0.2 },
    { nome: "Couve, manteiga", kcal: 27, carb: 4.3, prot: 2.9, gord: 0.5 },
    { nome: "Pimentão, verde", kcal: 21, carb: 4.9, prot: 1.1, gord: 0.2 },
    { nome: "Pimentão, vermelho", kcal: 23, carb: 5.5, prot: 1.0, gord: 0.1 },
    { nome: "Pimentão, amarelo", kcal: 28, carb: 6.0, prot: 1.2, gord: 0.4 },
    { nome: "Brócolis", kcal: 25, carb: 4.4, prot: 3.6, gord: 0.3 },
    { nome: "Mandioca (Aipim/Macaxeira)", kcal: 125, carb: 30.1, prot: 1.1, gord: 0.1 },
    { nome: "Abobrinha", kcal: 19, carb: 4.3, prot: 1.1, gord: 0.1 },
    { nome: "Berinjela", kcal: 19, carb: 4.4, prot: 1.2, gord: 0.1 },
    { nome: "Repolho", kcal: 17, carb: 3.9, prot: 0.9, gord: 0.1 },
    { nome: "Rúcula", kcal: 13, carb: 1.8, prot: 1.8, gord: 0.1 },

    // --- Hortifruti (Frutas) ---
    { nome: "Banana, prata", kcal: 98, carb: 26.0, prot: 1.3, gord: 0.1 },
    { nome: "Banana, nanica", kcal: 92, carb: 23.8, prot: 1.4, gord: 0.1 },
    { nome: "Maçã", kcal: 52, carb: 15.2, prot: 0.3, gord: 0.2 },
    { nome: "Limão", kcal: 12, carb: 3.2, prot: 0.9, gord: 0.1 },
    { nome: "Laranja", kcal: 46, carb: 11.5, prot: 1.0, gord: 0.1 },
    { nome: "Morango", kcal: 30, carb: 6.8, prot: 0.9, gord: 0.3 },
    { nome: "Abacaxi", kcal: 48, carb: 12.3, prot: 0.9, gord: 0.1 },
    { nome: "Maracujá", kcal: 68, carb: 12.3, prot: 2.0, gord: 2.1 },
    { nome: "Mamão", kcal: 40, carb: 10.4, prot: 0.5, gord: 0.1 },
    { nome: "Uva", kcal: 53, carb: 13.6, prot: 0.6, gord: 0.2 },
    { nome: "Coco, ralado", kcal: 620, carb: 23.8, prot: 5.6, gord: 62.0 },
    { nome: "Açaí, polpa", kcal: 58, carb: 6.2, prot: 0.8, gord: 3.9 },

    // --- Carnes, Aves e Ovos ---
    { nome: "Frango, peito, sem pele, cozido", kcal: 163, carb: 0, prot: 31.5, gord: 3.2 },
    { nome: "Frango, peito, cru", kcal: 119, carb: 0, prot: 21.5, gord: 3.0 },
    { nome: "Frango, coxa, assada", kcal: 215, carb: 0.1, prot: 28.5, gord: 10.4 },
    { nome: "Frango, filé", kcal: 119, carb: 0, prot: 21.5, gord: 3.0 },
    { nome: "Ovo, de galinha, cru", kcal: 143, carb: 1.6, prot: 13.0, gord: 8.9 },
    { nome: "Ovo, de galinha, cozido", kcal: 146, carb: 0.6, prot: 13.3, gord: 9.5 },
    { nome: "Carne, bovina, patinho, cru", kcal: 133, carb: 0, prot: 21.6, gord: 4.5 },
    { nome: "Carne, bovina, alcatra, cru", kcal: 163, carb: 0, prot: 21.6, gord: 7.8 },
    { nome: "Carne, bovina, picanha, crua", kcal: 213, carb: 0, prot: 18.8, gord: 14.7 },
    { nome: "Carne, bovina, moída", kcal: 213, carb: 0, prot: 26.6, gord: 11.1 },
    { nome: "Carne, bovina, coxão mole", kcal: 169, carb: 0, prot: 21.2, gord: 8.7 },
    { nome: "Carne, bovina, contra filé", kcal: 206, carb: 0, prot: 21.2, gord: 12.8 },
    { nome: "Carne, bovina, filé mignon", kcal: 140, carb: 0, prot: 21.6, gord: 5.3 },
    { nome: "Carne, bovina, costela", kcal: 373, carb: 0, prot: 16.7, gord: 33.6 },
    { nome: "Carne, suína, lombo, cru", kcal: 134, carb: 0, prot: 22.6, gord: 4.2 },
    { nome: "Carne, suína, costela", kcal: 256, carb: 0, prot: 17.6, gord: 20.1 },
    { nome: "Carne, suína, pernil", kcal: 162, carb: 0, prot: 19.4, gord: 8.8 },

    // --- Embutidos e Processados ---
    { nome: "Linguiça, suína", kcal: 300, carb: 0, prot: 14.0, gord: 27.0 },
    { nome: "Linguiça, calabresa", kcal: 300, carb: 0, prot: 14.0, gord: 27.0 },
    { nome: "Linguiça, toscana", kcal: 255, carb: 0, prot: 13.5, gord: 21.8 },
    { nome: "Bacon", kcal: 541, carb: 1.4, prot: 37.1, gord: 41.3 },
    { nome: "Presunto", kcal: 111, carb: 2.1, prot: 14.2, gord: 4.8 },
    { nome: "Apresuntado", kcal: 132, carb: 3.1, prot: 13.5, gord: 7.0 },
    { nome: "Mortadela", kcal: 269, carb: 4.6, prot: 12.0, gord: 22.5 },
    { nome: "Salsicha", kcal: 245, carb: 5.0, prot: 10.9, gord: 20.1 },
    { nome: "Peito de peru", kcal: 98, carb: 1.0, prot: 16.2, gord: 2.4 },
    { nome: "Hambúrguer, bovino", kcal: 260, carb: 3.5, prot: 15.0, gord: 20.5 },

    // --- Pescados ---
    { nome: "Peixe, tilápia, filé, cru", kcal: 96, carb: 0, prot: 20.1, gord: 1.7 },
    { nome: "Salmão, cru", kcal: 170, carb: 0, prot: 19.3, gord: 9.8 },
    { nome: "Atum, em conserva", kcal: 166, carb: 0, prot: 26.2, gord: 6.0 },
    { nome: "Sardinha, em conserva", kcal: 159, carb: 0, prot: 21.1, gord: 7.6 },
    { nome: "Camarão, cru", kcal: 90, carb: 0, prot: 19.0, gord: 1.0 },

    // --- Laticínios e Derivados ---
    { nome: "Leite, integral", kcal: 58, carb: 4.5, prot: 3.3, gord: 3.0 },
    { nome: "Leite, desnatado", kcal: 35, carb: 5.0, prot: 3.5, gord: 0.1 },
    { nome: "Leite, em pó", kcal: 496, carb: 38.0, prot: 25.4, gord: 26.9 },
    { nome: "Leite, condensado", kcal: 313, carb: 57.3, prot: 7.7, gord: 6.7 },
    { nome: "Creme de leite", kcal: 316, carb: 3.0, prot: 2.0, gord: 33.5 },
    { nome: "Creme de leite, caixinha", kcal: 250, carb: 4.0, prot: 2.0, gord: 25.0 },
    { nome: "Queijo, mussarela", kcal: 330, carb: 3.0, prot: 22.6, gord: 25.2 },
    { nome: "Queijo, parmesão", kcal: 396, carb: 3.2, prot: 35.6, gord: 26.1 },
    { nome: "Queijo, prato", kcal: 360, carb: 2.5, prot: 22.7, gord: 28.5 },
    { nome: "Queijo, minas frescal", kcal: 243, carb: 3.2, prot: 17.4, gord: 17.8 },
    { nome: "Queijo, cheddar", kcal: 403, carb: 1.3, prot: 24.9, gord: 33.1 },
    { nome: "Queijo, provolone", kcal: 351, carb: 2.1, prot: 25.6, gord: 26.6 },
    { nome: "Queijo, coalho", kcal: 323, carb: 2.5, prot: 21.4, gord: 25.3 },
    { nome: "Requeijão, cremoso", kcal: 257, carb: 2.4, prot: 9.6, gord: 23.4 },
    { nome: "Iogurte, natural", kcal: 51, carb: 5.1, prot: 4.1, gord: 1.6 },
    { nome: "Manteiga", kcal: 726, carb: 0.1, prot: 0.4, gord: 80.6 },
    { nome: "Margarina", kcal: 717, carb: 0, prot: 0.1, gord: 81.0 },

    // --- Óleos e Gorduras ---
    { nome: "Óleo, de soja", kcal: 884, carb: 0, prot: 0, gord: 100 },
    { nome: "Óleo, de girassol", kcal: 884, carb: 0, prot: 0, gord: 100 },
    { nome: "Óleo, de milho", kcal: 884, carb: 0, prot: 0, gord: 100 },
    { nome: "Azeite, de oliva", kcal: 884, carb: 0, prot: 0, gord: 100 },
    { nome: "Banha, de porco", kcal: 896, carb: 0, prot: 0, gord: 99.5 },

    // --- Açúcares e Doces ---
    { nome: "Açúcar, refinado", kcal: 387, carb: 99.5, prot: 0, gord: 0 },
    { nome: "Açúcar, cristal", kcal: 387, carb: 99.5, prot: 0, gord: 0 },
    { nome: "Açúcar, mascavo", kcal: 369, carb: 95.0, prot: 0, gord: 0 },
    { nome: "Açúcar, confeiteiro", kcal: 389, carb: 99.8, prot: 0, gord: 0 },
    { nome: "Mel", kcal: 304, carb: 82.4, prot: 0.3, gord: 0 },
    { nome: "Chocolate, meio amargo", kcal: 546, carb: 61.2, prot: 4.9, gord: 29.9 },
    { nome: "Chocolate, ao leite", kcal: 540, carb: 59.5, prot: 6.9, gord: 30.5 },
    { nome: "Chocolate, branco", kcal: 539, carb: 59.2, prot: 5.9, gord: 32.2 },
    { nome: "Achocolatado, pó", kcal: 395, carb: 91.5, prot: 4.0, gord: 1.5 },
    { nome: "Cacau, em pó", kcal: 228, carb: 57.9, prot: 19.6, gord: 13.7 },
    { nome: "Creme de avelã (Nutella)", kcal: 539, carb: 57.5, prot: 6.3, gord: 30.9 },
    { nome: "Doce de leite", kcal: 315, carb: 60.0, prot: 6.8, gord: 5.0 },
    { nome: "Goiabada", kcal: 271, carb: 70.0, prot: 0.5, gord: 0.1 },
    { nome: "Amendoim, torrado", kcal: 581, carb: 21.6, prot: 25.8, gord: 49.2 },

    // --- Molhos e Condimentos ---
    { nome: "Sal, grosso", kcal: 0, carb: 0, prot: 0, gord: 0 },
    { nome: "Sal, refinado", kcal: 0, carb: 0, prot: 0, gord: 0 },
    { nome: "Pimenta, do reino", kcal: 251, carb: 64.0, prot: 10.4, gord: 3.3 },
    { nome: "Orégano, seco", kcal: 265, carb: 68.9, prot: 9.0, gord: 4.3 },
    { nome: "Canela, em pó", kcal: 247, carb: 80.6, prot: 4.0, gord: 1.2 },
    { nome: "Maionese", kcal: 302, carb: 7.7, prot: 0.6, gord: 30.0 },
    { nome: "Ketchup", kcal: 112, carb: 27.4, prot: 1.3, gord: 0.1 },
    { nome: "Mostarda", kcal: 66, carb: 5.8, prot: 4.4, gord: 3.3 },
    { nome: "Molho de tomate", kcal: 38, carb: 8.5, prot: 1.2, gord: 0.2 },
    { nome: "Extrato de tomate", kcal: 61, carb: 13.9, prot: 2.9, gord: 0.3 },
    { nome: "Molho shoyu", kcal: 60, carb: 8.5, prot: 5.5, gord: 0 },
    { nome: "Vinagre", kcal: 18, carb: 0.9, prot: 0, gord: 0 },

    // --- Bebidas e Outros ---
    { nome: "Água", kcal: 0, carb: 0, prot: 0, gord: 0 },
    { nome: "Café, infusão", kcal: 2, carb: 0.3, prot: 0.1, gord: 0 },
    { nome: "Refrigerante, tipo cola", kcal: 42, carb: 10.6, prot: 0, gord: 0 },
    { nome: "Suco de laranja, natural", kcal: 45, carb: 10.4, prot: 0.7, gord: 0.2 },
    { nome: "Cerveja", kcal: 43, carb: 3.6, prot: 0.5, gord: 0 },
    { nome: "Vinho, tinto", kcal: 85, carb: 2.6, prot: 0.1, gord: 0 }
];

/**
 * Remove acentos, converte para minúsculas e remove pontuações
 */
function normalizeString(str) {
    if (!str) return '';
    return str.toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") // Remove acentos
              .replace(/[^a-z0-9\s]/g, "");    // Remove vírgulas, pontos, hífens
}

/**
 * Algoritmo avançado de similaridade (fator de matches de palavras-chave)
 */
function calculateSimilarity(str1, str2) {
    // Filtramos palavras menores que 2 letras (ex: 'de', 'e')
    const s1 = normalizeString(str1).split(/[\s]+/).filter(w => w.length > 2);
    const s2 = normalizeString(str2).split(/[\s]+/).filter(w => w.length > 2);
    
    if (s1.length === 0 || s2.length === 0) return 0;

    let s2Matches = 0;
    
    // Verificamos quantas palavras da base oficial (TACO) estão contidas na busca do usuário.
    // Isso impede que um produto como "Arroz branco tipo 1 marca camil 5kg" seja prejudicado pelo excesso de palavras.
    for(let word of s2) {
        // Se a palavra oficial inteira está contida na busca do usuário ou vice-versa
        if(s1.some(w => w === word || word.startsWith(w) || w.startsWith(word))) {
            s2Matches++;
        }
    }
    
    // O score é a porcentagem das palavras oficiais que foram encontradas na entrada do usuário.
    // Ex: Busca: "Farinha Trigo especial 1kg". TACO: "Farinha trigo". (2 matches / 2 palavras TACO = 100% score)
    return s2Matches / s2.length;
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

    // Aceita o match se a confiança for de pelo menos 60% ou 50% em palavras curtas
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

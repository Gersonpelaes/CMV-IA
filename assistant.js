// ============================================================
// ASSISTENTE POR VOZ CONVERSACIONAL E CONTEXTUAL CMV.IA
// ============================================================

(function() {
    'use strict';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isListening = false;
    let isMuted = false;
    let autoRestart = false;
    let voices = [];

    // Estado conversacional para diálogos multi-etapas
    let conversationState = {
        step: null, // 'AWAITING_ING_NAME_FOR_PRICE', 'AWAITING_NEW_PRICE', 'AWAITING_SAVE_TYPE', 'AWAITING_EXIT_CONFIRMATION', 'AWAITING_PRATO_NAME_FOR_SAVE', 'AWAITING_ING_SAVE_CHOICE', 'AWAITING_TOUR_CONFIRMATION'
        data: {}
    };

    // Elementos da interface
    let fabBtn = null;
    let headerBtn = null;
    let cardModal = null;
    let statusText = null;
    let transcriptText = null;
    let actionBadge = null;
    let pingDot = null;
    let dotIndicator = null;
    let muteBtn = null;
    let closeBtn = null;

    // Carregar vozes do sistema
    function loadVoices() {
        if ('speechSynthesis' in window) {
            voices = window.speechSynthesis.getVoices() || [];
        }
    }
    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }

    // Desbloqueia áudio no primeiro clique do usuário
    function unlockAudio() {
        if ('speechSynthesis' in window) {
            try {
                window.speechSynthesis.resume();
                const unlock = new SpeechSynthesisUtterance(' ');
                unlock.volume = 0.01;
                window.speechSynthesis.speak(unlock);
            } catch (e) {}
        }
    }

    // Dicionário de números falados em português
    const wordNums = {
        'zero': 0, 'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'tres': 3, 'quatro': 4,
        'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10,
        'onze': 11, 'doze': 12, 'treze': 13, 'quatorze': 14, 'catorze': 14,
        'quinze': 15, 'dezesseis': 16, 'dezessete': 17, 'dezoito': 18, 'dezenove': 19,
        'vinte': 20, 'trinta': 30, 'quarenta': 40, 'cinquenta': 50,
        'sessenta': 60, 'setenta': 70, 'oitenta': 80, 'noventa': 90,
        'cem': 100, 'cento': 100, 'duzentos': 200, 'duzentas': 200,
        'trezentos': 300, 'trezentas': 300, 'quatrocentos': 400, 'quatrocentas': 400,
        'quinhentos': 500, 'quinhentas': 500, 'seiscentos': 600, 'seiscentas': 600,
        'setecentos': 700, 'setecentas': 700, 'oitocentos': 800, 'oitocentas': 800,
        'novecentos': 900, 'novecentas': 900, 'mil': 1000
    };

    function normalize(str) {
        if (!str) return '';
        return str.normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .toLowerCase()
                  .replace(/[^a-z0-9\s.,]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
    }

    // Parser de preço falado (ex: "52 reais", "52", "48 e 50", "cinquenta e dois reais")
    function parsePriceNumber(text) {
        let t = normalize(text);
        t = t.replace(/\b(reais|real|r\$|custo|preco|valor|de|para|por)\b/g, '').trim();

        // Caso "48 e 50" -> 48.50
        const andMatch = t.match(/^(\d+)\s+e\s+(\d+)$/);
        if (andMatch) {
            return parseFloat(andMatch[1] + '.' + andMatch[2]);
        }
        // Caso dígitos diretos "52", "52.00", "52,50"
        const digitMatch = t.match(/(\d+(?:[.,]\d+)?)/);
        if (digitMatch) {
            return parseFloat(digitMatch[1].replace(',', '.'));
        }

        // Caso números por extenso
        const tokens = t.split(/\s+/);
        let total = 0;
        let found = false;
        for (const tok of tokens) {
            if (wordNums[tok] !== undefined) {
                found = true;
                total += wordNums[tok];
            }
        }
        if (found && total > 0) return total;
        return null;
    }

    // Identificador de quantidades e unidades faladas para receitas
    function parsePortugueseQuantity(text) {
        const t = normalize(text);

        if (t.includes('meio quilo') || t.includes('meio kilo')) return { qty: 0.5, unit: 'kg' };
        if (t.includes('meio litro')) return { qty: 0.5, unit: 'l' };
        if (t.includes('um e meio') || t.includes('1 e meio') || t.includes('uma e meia')) return { qty: 1.5, unit: detectUnit(t) };
        if (t.includes('dois e meio') || t.includes('2 e meio') || t.includes('duas e meia')) return { qty: 2.5, unit: detectUnit(t) };

        let detectedUnit = detectUnit(t);

        const digitMatch = t.match(/(\d+(?:[.,]\d+)?)\s*(kg|quilos?|kilos?|g|gramas?|ml|mililitros?|litros?|l|un|unidades?|latas?|pacotes?)?/);
        if (digitMatch) {
            const val = parseFloat(digitMatch[1].replace(',', '.'));
            let u = detectedUnit;
            if (!u && digitMatch[2]) {
                const rawU = digitMatch[2];
                if (/^(kg|quilo|kilo)/.test(rawU)) u = 'kg';
                else if (/^(g|grama)/.test(rawU)) u = 'g';
                else if (/^(ml|mililitro)/.test(rawU)) u = 'ml';
                else if (/^(l|litro)/.test(rawU)) u = 'l';
                else u = 'un';
            }
            return { qty: val, unit: u || 'un' };
        }

        const tokens = t.split(/\s+/);
        let total = 0;
        let foundWord = false;
        for (const token of tokens) {
            if (wordNums[token] !== undefined) {
                foundWord = true;
                if (token === 'mil') {
                    total = total === 0 ? 1000 : total * 1000;
                } else {
                    total += wordNums[token];
                }
            }
        }

        if (foundWord && total > 0) {
            return { qty: total, unit: detectedUnit || 'un' };
        }

        return null;
    }

    function detectUnit(text) {
        if (/\b(kg|quilos?|kilos?)\b/.test(text)) return 'kg';
        if (/\b(g|gramas?)\b/.test(text)) return 'g';
        if (/\b(ml|mililitros?)\b/.test(text)) return 'ml';
        if (/\b(l|litros?)\b/.test(text)) return 'l';
        if (/\b(un|unidades?|latas?|garrafas?|pacotes?|porcao|porcoes)\b/.test(text)) return 'un';
        return null;
    }

    // Extrai nome do ingrediente para comandos de adição
    function extractIngredientQuery(text) {
        let t = normalize(text);
        t = t.replace(/\b(coloque|colocar|adicione|adicionar|bota|botar|bote|inclua|incluir|acrescente|acrescentar|insira|inserir|por|bote|adiciona)\b/g, '');
        t = t.replace(/\b(na ficha|a ficha|no prato|na receita|por favor|pra mim|no estoque)\b/g, '');
        t = t.replace(/\b(kg|quilos?|kilos?|g|gramas?|ml|mililitros?|litros?|l|un|unidades?|latas?|pacotes?|colheres?|xicaras?)\b/g, '');
        t = t.replace(/\b(de|do|da|dos|das|com|em|para|pra)\b/g, '');
        const numKeys = Object.keys(wordNums).concat(['meio', 'meia']);
        for (const w of numKeys) {
            t = t.replace(new RegExp('\\b' + w + '\\b', 'g'), '');
        }
        t = t.replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|kilos?|quilos?|g|gramas?|ml|litros?|l|un|unidades?)?\b/gi, '');
        t = t.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        return t;
    }

    // Busca o melhor ingrediente ou receita (base ou prato pronto)
    function findBestItemMatch(query, ingredientes, receitasSalvas = [], allowAllRecipes = false) {
        const q = normalize(query);
        if (!q) return null;
        const qTokens = q.split(' ').filter(Boolean);

        let bestItem = null;
        let bestType = null;
        let bestScore = -1;

        if (Array.isArray(ingredientes)) {
            for (const ing of ingredientes) {
                const nameNorm = normalize(ing.nome);
                let score = 0;

                if (nameNorm === q) score = 1000;
                else if (nameNorm.startsWith(q)) score = 500;
                else if (nameNorm.includes(q)) score = 300;
                else {
                    let matched = 0;
                    for (const t of qTokens) {
                        if (nameNorm.includes(t)) matched++;
                    }
                    if (matched > 0) {
                        score = (matched / qTokens.length) * 200;
                    }
                }

                if (score > bestScore && score >= 100) {
                    bestScore = score;
                    bestItem = ing;
                    bestType = 'ing';
                }
            }
        }

        if (Array.isArray(receitasSalvas)) {
            for (const rec of receitasSalvas) {
                if (!allowAllRecipes && rec.type !== 'base') continue;
                const nameNorm = normalize(rec.header?.descricaoProduto || '');
                let score = 0;

                if (nameNorm === q) score = 1000;
                else if (nameNorm.startsWith(q)) score = 500;
                else if (nameNorm.includes(q)) score = 300;
                else {
                    let matched = 0;
                    for (const t of qTokens) {
                        if (nameNorm.includes(t)) matched++;
                    }
                    if (matched > 0) {
                        score = (matched / qTokens.length) * 200;
                    }
                }

                if (score > bestScore && score >= 100) {
                    bestScore = score;
                    bestItem = rec;
                    bestType = 'rec';
                }
            }
        }

        return bestItem ? { item: bestItem, type: bestType, score: bestScore } : null;
    }

    // Busca o produto de venda direta mais similar
    function findBestProdutoVenda(query, produtos) {
        const q = normalize(query);
        if (!q || !Array.isArray(produtos)) return null;
        const qTokens = q.split(' ').filter(Boolean);

        let bestProd = null;
        let bestScore = -1;

        for (const prod of produtos) {
            const nameNorm = normalize(prod.nome);
            let score = 0;
            if (nameNorm === q) score = 1000;
            else if (nameNorm.startsWith(q)) score = 500;
            else if (nameNorm.includes(q)) score = 300;
            else {
                let matched = 0;
                for (const tok of qTokens) {
                    if (nameNorm.includes(tok)) matched++;
                }
                if (matched > 0) score = (matched / qTokens.length) * 200;
            }

            if (score > bestScore && score >= 100) {
                bestScore = score;
                bestProd = prod;
            }
        }
        return bestProd;
    }

    // Limpa comandos, artigos e preposições de uma busca por ficha
    function cleanFichaQuery(text) {
        if (!text) return '';
        let q = normalize(text);
        q = q.replace(/^(abrir|ver|editar|carregar|consultar|mostrar|buscar)\s+(a\s+|o\s+|as\s+|os\s+)?(ficha|receita|prato)(\s+tecnica)?\s*/i, '');
        q = q.replace(/^(a\s+|o\s+)?(ficha|receita|prato)(\s+tecnica)?\s*/i, '');
        // Limpar preposições e artigos iniciais e finais
        q = q.replace(/^(de|do|da|dos|das|o|a|os|as|um|uma)\s+/i, '');
        q = q.replace(/\s+(de|do|da|dos|das)$/i, '');
        return q.trim();
    }

    // Busca inteligente de ficha técnica / prato por similaridade de nome e tokens
    function findBestFichaMatch(query, receitasSalvas) {
        if (!Array.isArray(receitasSalvas) || receitasSalvas.length === 0) return null;
        const qClean = cleanFichaQuery(query);
        const qNorm = normalize(query);
        if (!qClean && !qNorm) return null;

        const tokensClean = qClean.split(' ').filter(Boolean);
        let bestRec = null;
        let bestScore = -1;

        for (const rec of receitasSalvas) {
            const rawName = rec.header?.descricaoProduto || '';
            const nameNorm = normalize(rawName);
            const nameClean = cleanFichaQuery(rawName);
            let score = 0;

            if (nameNorm === qNorm || nameClean === qClean) {
                score = 1000;
            } else if (nameClean && qClean && nameClean === qClean) {
                score = 900;
            } else if (nameNorm.startsWith(qClean) || nameClean.startsWith(qClean)) {
                score = 600;
            } else if (nameNorm.includes(qClean) || nameClean.includes(qClean)) {
                score = 450;
            } else if (tokensClean.length > 0) {
                let matched = 0;
                for (const tok of tokensClean) {
                    if (nameNorm.includes(tok) || nameClean.includes(tok)) matched++;
                }
                if (matched > 0) {
                    score = (matched / tokensClean.length) * 280;
                }
            }

            if (score > bestScore && score >= 80) {
                bestScore = score;
                bestRec = rec;
            }
        }

        return bestRec ? { ficha: bestRec, score: bestScore } : null;
    }

    // Resolve ou cria a categoria de venda direta
    async function resolveDirectSaleCategory(query, app) {
        let q = normalize(query);
        q = q.replace(/\b(categoria|de|do|da|dos|das|por favor|pra mim)\b/g, '').trim();
        if (!q) return null;

        const categories = app && typeof app.getDirectSaleCategories === 'function' ? app.getDirectSaleCategories() : [];
        
        let matchedCat = categories.find(c => normalize(c) === q);
        if (!matchedCat) {
            matchedCat = categories.find(c => normalize(c).includes(q) || q.includes(normalize(c)));
        }

        if (matchedCat) {
            const catSelect = document.getElementById('categoria-produto-venda');
            if (catSelect) catSelect.value = matchedCat;
            return matchedCat;
        }

        if (app && typeof app.adicionarCategoriaVendaDireta === 'function') {
            const rawCatName = query.toUpperCase().replace(/\bCATEGORIA\b/i, '').trim();
            const newCat = await app.adicionarCategoriaVendaDireta(rawCatName || query.toUpperCase());
            return newCat;
        }

        return null;
    }

    // Valida os campos do produto de venda direta e salva se estiver tudo preenchido,
    // ou pergunta especificamente pelo campo que falta.
    async function validateAndSaveProdutoVenda(app) {
        const nomeInput = document.getElementById('nome-produto-venda');
        const catSelect = document.getElementById('categoria-produto-venda');
        const compraInput = document.getElementById('preco-compra-venda');
        const vendaInput = document.getElementById('preco-venda-venda');
        const form = document.getElementById('form-produto-venda');

        if (!nomeInput || !form) return;

        const nomeVal = nomeInput.value.trim();
        const catVal = catSelect ? catSelect.value.trim() : '';
        const compraVal = compraInput ? parseFloat(compraInput.value) : NaN;
        const vendaVal = vendaInput ? parseFloat(vendaInput.value) : NaN;

        if (!nomeVal) {
            conversationState = { step: 'AWAITING_VENDA_FIELD_NAME', data: {} };
            const msg = 'Qual o nome do produto?';
            nomeInput.focus();
            showFeedback('❓ ' + msg);
            speak(msg);
            return;
        }

        if (!catVal) {
            conversationState = { step: 'AWAITING_VENDA_FIELD_CATEGORY', data: {} };
            const msg = 'Qual a categoria do produto?';
            if (catSelect) {
                catSelect.scrollIntoView({ behavior: 'smooth' });
                catSelect.focus();
            }
            showFeedback('❓ ' + msg);
            speak(msg);
            return;
        }

        if (isNaN(compraVal) || compraVal <= 0) {
            conversationState = { step: 'AWAITING_VENDA_FIELD_PRECO_COMPRA', data: {} };
            const msg = 'Qual o preço de compra?';
            if (compraInput) compraInput.focus();
            showFeedback('❓ ' + msg);
            speak(msg);
            return;
        }

        if (isNaN(vendaVal) || vendaVal <= 0) {
            conversationState = { step: 'AWAITING_VENDA_FIELD_PRECO_VENDA', data: {} };
            const msg = 'Qual o preço de venda?';
            if (vendaInput) vendaInput.focus();
            showFeedback('❓ ' + msg);
            speak(msg);
            return;
        }

        // Todos os campos estão preenchidos! Salva agora!
        conversationState = { step: null, data: {} };
        window.salvandoPorVoz = true;
        form.requestSubmit();
        setTimeout(() => { window.salvandoPorVoz = false; }, 500);

        const msg = `Produto ${nomeVal} salvo com sucesso!`;
        showFeedback('🛒 ' + msg);
        speak(msg);
    }

    // Síntese de voz com proteção contra GC e desbloqueio
    function speak(text) {
        if (!('speechSynthesis' in window) || isMuted) return;
        try {
            window.speechSynthesis.resume();
            window.speechSynthesis.cancel();

            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'pt-BR';
                utterance.rate = 1.05;
                utterance.pitch = 1.0;

                if (voices.length === 0) loadVoices();
                const ptVoice = voices.find(v => v.lang && (v.lang.includes('pt-BR') || v.lang.includes('pt_BR') || v.lang.startsWith('pt')));
                if (ptVoice) {
                    utterance.voice = ptVoice;
                }

                window.cmvActiveUtterance = utterance;
                utterance.onend = () => { window.cmvActiveUtterance = null; };
                utterance.onerror = (e) => { 
                    console.warn('[Assistente CMV.IA] Erro na síntese:', e);
                    window.cmvActiveUtterance = null; 
                };

                window.speechSynthesis.speak(utterance);
            }, 60);
        } catch (e) {
            console.warn('[Assistente CMV.IA] Falha ao falar:', e);
        }
    }

    function showFeedback(text, isSuccess = true, customHtml = null) {
        if (!actionBadge) return;
        if (customHtml) {
            actionBadge.innerHTML = customHtml;
        } else {
            actionBadge.textContent = text;
        }
        actionBadge.className = isSuccess 
            ? 'text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 p-2.5 rounded-lg border border-green-200 dark:border-green-800 mt-2 block shadow-sm'
            : 'text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 mt-2 block shadow-sm';
        actionBadge.classList.remove('hidden');
    }

    // ============================================================
    // RESPOSTAS A DÚVIDAS, TUTORIAIS E COMO FAZER (FAQ INTELIGENTE)
    // ============================================================
    function handleTutorialAndFAQ(t, rawText, app) {
        // 1. O QUE É CMV / COMO CALCULAR CMV / MARGEM IDEAL
        const isCmvQ = (t.includes('cmv') || t.includes('margem') || t.includes('custo de mercadoria')) &&
            (t.includes('o que e') || t.includes('oque e') || t.includes('como calcular') || 
             t.includes('como funciona') || t.includes('qual o') || t.includes('qual e') || 
             t.includes('o que significa') || t.includes('entender') || t.includes('explicar') || 
             t === 'cmv' || t === 'o que e cmv' || t === 'qual cmv ideal' || t.includes('cmv ideal'));

        if (isCmvQ) {
            if (app) app.showView('dashboard');
            conversationState = { step: 'AWAITING_TOUR_CONFIRMATION', data: { tourType: 'cmv' } };
            const spoken = 'CMV significa Custo de Mercadoria Vendida. É a porcentagem do seu faturamento gasta com ingredientes. Em restaurantes eficientes, o CMV ideal fica entre 28% e 35%. No nosso Dashboard você acompanha essa média em tempo real! Deseja que eu inicie o tour explicativo no Dashboard?';
            const html = `
                <div class="space-y-1.5 text-left">
                    <div class="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <span>📊</span> <span>Entendendo o CMV</span>
                    </div>
                    <p class="text-xs text-gray-700 dark:text-gray-300">
                        <b>CMV Ideal: 28% a 35%</b> da receita bruta. Mede o peso dos insumos nas suas vendas e orienta sua precificação inteligente.
                    </p>
                    <button onclick="window.startAppTour && window.startAppTour('cmv')" 
                            class="mt-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium shadow text-xs inline-flex items-center gap-1.5 cursor-pointer transition">
                        ▶️ Iniciar Tour do Dashboard
                    </button>
                </div>
            `;
            showFeedback('📊 ' + spoken, true, html);
            speak(spoken);
            return true;
        }

        // 2. COMO CADASTRAR CATEGORIAS / ONDE CRIAR CATEGORIA
        const isCatQ = (t.includes('categoria') || t.includes('categorias')) &&
            (t.includes('como') || t.includes('onde') || t.includes('ajuda') || 
             t.includes('ensina') || t.includes('explicar') || t.includes('o que e') || 
             t.includes('para que serve') || t.includes('passo a passo') || t.includes('duvida') ||
             t.includes('criar categoria no sistema') || t.includes('cadastrar categoria'));

        if (isCatQ) {
            if (app) app.showView('settings');
            setTimeout(() => {
                const el = document.getElementById('form-cat-ingrediente');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 300);
            conversationState = { step: 'AWAITING_TOUR_CONFIRMATION', data: { tourType: 'categoria' } };
            const spoken = 'Para cadastrar categorias, acesse as Configurações no menu lateral. O sistema divide as categorias em quatro blocos: Ingredientes, Venda Direta, Pratos e Bases. Você também pode clicar no botão verde Categorias Recomendadas para preencher tudo automaticamente! Deseja iniciar o passo a passo guiado?';
            const html = `
                <div class="space-y-1.5 text-left">
                    <div class="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                        <span>⚙️</span> <span>Como Cadastrar Categorias</span>
                    </div>
                    <p class="text-xs text-gray-700 dark:text-gray-300">
                        O CMV.IA possui 4 blocos separados de categorias para máxima organização, além de preenchimento automático em 1 clique.
                    </p>
                    <button onclick="window.startAppTour && window.startAppTour('categoria')" 
                            class="mt-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium shadow text-xs inline-flex items-center gap-1.5 cursor-pointer transition">
                        ▶️ Iniciar Passo a Passo
                    </button>
                </div>
            `;
            showFeedback('⚙️ ' + spoken, true, html);
            speak(spoken);
            return true;
        }

        // 3. COMO MONTAR / ESTRUTURAR A FICHA TÉCNICA
        const isFichaQ = (t.includes('ficha') || t.includes('fichas') || t.includes('receita') || t.includes('prato')) &&
            (t.includes('como montar') || t.includes('como fazer') || t.includes('como criar') || 
             t.includes('como funciona') || t.includes('onde faco') || t.includes('onde crio') || 
             t.includes('como calcular') || t.includes('passo a passo') || t.includes('ensina') || 
             t.includes('explicar') || t.includes('estrutura') || t.includes('o que precisa') || 
             t === 'como montar a ficha' || t === 'como fazer ficha' || t === 'como funciona a ficha' ||
             t === 'como montar ficha' || t === 'como criar ficha');

        if (isFichaQ) {
            if (app) app.showView('fichas');
            conversationState = { step: 'AWAITING_TOUR_CONFIRMATION', data: { tourType: 'ficha' } };
            const spoken = 'Para montar uma ficha técnica, acesse a tela de Ficha Técnica, defina o nome do prato, o rendimento em quilos e a porção individual. Em seguida, adicione os insumos informando peso bruto e líquido para calcular as perdas e o custo real. No final, defina o markup de lucro. Quer que eu inicie o passo a passo guiado?';
            const html = `
                <div class="space-y-1.5 text-left">
                    <div class="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <span>📝</span> <span>Como Montar a Ficha Técnica</span>
                    </div>
                    <p class="text-xs text-gray-700 dark:text-gray-300">
                        Aprenda a estruturar rendimento, fator de correção (FC), markup comercial e geração de PDFs (Custo e Operacional).
                    </p>
                    <button onclick="window.startAppTour && window.startAppTour('ficha')" 
                            class="mt-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium shadow text-xs inline-flex items-center gap-1.5 cursor-pointer transition">
                        ▶️ Iniciar Passo a Passo
                    </button>
                </div>
            `;
            showFeedback('📝 ' + spoken, true, html);
            speak(spoken);
            return true;
        }

        // 4. ONDE / COMO ATUALIZAR PREÇOS E CUSTOS
        const isPrecoQ = (t.includes('preco') || t.includes('precos') || t.includes('custo') || t.includes('custos') || t.includes('reajuste') || t.includes('reajustar') || t.includes('tabela')) &&
            (t.includes('onde atualizo') || t.includes('como atualizo') || t.includes('como atualizar') || 
             t.includes('onde mudo') || t.includes('como mudar') || t.includes('onde altero') || 
             t.includes('como alterar') || t.includes('onde reajusto') || t.includes('em lote') || 
             t.includes('passo a passo') || t.includes('ensina') || t.includes('explicar') ||
             t === 'onde atualizo preco' || t === 'onde atualizo precos' || t === 'como atualizo preco' || t === 'como atualizar precos');

        if (isPrecoQ) {
            if (app) app.showView('ingredientes');
            setTimeout(() => {
                const painel = document.getElementById('painel-atualizar-precos');
                if (painel && painel.classList.contains('hidden')) {
                    const btnToggle = document.getElementById('btn-toggle-atualizar-precos');
                    if (btnToggle) btnToggle.click();
                }
            }, 300);
            conversationState = { step: 'AWAITING_TOUR_CONFIRMATION', data: { tourType: 'preco' } };
            const spoken = 'Para atualizar preços, acesse a tela de Ingredientes. Você pode clicar no botão azul Atualizar Preços em Lote no topo para reajustar vários itens de uma só vez, ou editar o ingrediente direto na lista. Todas as fichas técnicas são recalculadas na hora! Quer ver o passo a passo na tela?';
            const html = `
                <div class="space-y-1.5 text-left">
                    <div class="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <span>💰</span> <span>Onde Atualizar Preços</span>
                    </div>
                    <p class="text-xs text-gray-700 dark:text-gray-300">
                        Reajuste múltiplos insumos com o painel em lote. O sistema atualiza o custo em cascata de todas as fichas vinculadas.
                    </p>
                    <button onclick="window.startAppTour && window.startAppTour('preco')" 
                            class="mt-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow text-xs inline-flex items-center gap-1.5 cursor-pointer transition">
                        ▶️ Iniciar Passo a Passo
                    </button>
                </div>
            `;
            showFeedback('💰 ' + spoken, true, html);
            speak(spoken);
            return true;
        }

        // 5. COMO FUNCIONA PRODUTOS DE VENDA DIRETA
        const isVendaDiretaQ = (t.includes('venda direta') || (t.includes('produto') && t.includes('revenda')) || t.includes('refrigerante') || t.includes('bebida')) &&
            (t.includes('como') || t.includes('o que e') || t.includes('oque e') || 
             t.includes('onde') || t.includes('funciona') || t.includes('passo a passo') || 
             t.includes('ensina') || t.includes('explicar') || t === 'venda direta' || t === 'o que e venda direta');

        if (isVendaDiretaQ) {
            if (app) app.showView('venda-direta');
            conversationState = { step: 'AWAITING_TOUR_CONFIRMATION', data: { tourType: 'venda-direta' } };
            const spoken = 'A Venda Direta é para itens que você compra prontos para revenda, como refrigerantes, cervejas e sobremesas prontas. Basta informar o nome, categoria, preço de compra e preço de venda. O sistema calcula seu lucro bruto e margem na hora. Quer que eu mostre o passo a passo?';
            const html = `
                <div class="space-y-1.5 text-left">
                    <div class="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <span>🛒</span> <span>Produtos de Venda Direta</span>
                    </div>
                    <p class="text-xs text-gray-700 dark:text-gray-300">
                        Cadastre mercadorias revendidas prontas sem ficha complexa, monitorando margem e lucro bruto imediato.
                    </p>
                    <button onclick="window.startAppTour && window.startAppTour('venda-direta')" 
                            class="mt-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium shadow text-xs inline-flex items-center gap-1.5 cursor-pointer transition">
                        ▶️ Iniciar Passo a Passo
                    </button>
                </div>
            `;
            showFeedback('🛒 ' + spoken, true, html);
            speak(spoken);
            return true;
        }

        // 6. COMO IMPRIMIR ETIQUETAS E REGRAS ANVISA
        const isEtiquetasQ = (t.includes('etiqueta') || t.includes('etiquetas') || t.includes('validade') || t.includes('anvisa')) &&
            (t.includes('como') || t.includes('onde') || t.includes('funciona') || 
             t.includes('passo a passo') || t.includes('ensina') || t.includes('explicar') || 
             t.includes('regras') || t === 'como imprimir etiqueta' || t === 'como imprimir etiquetas');

        if (isEtiquetasQ) {
            if (app) app.showView('etiquetas');
            conversationState = { step: 'AWAITING_TOUR_CONFIRMATION', data: { tourType: 'etiquetas' } };
            const spoken = 'Na tela de Etiquetas ANVISA, você escolhe o produto ou ficha e define a conservação: resfriado para 3 dias, congelado para 90 dias, seco para 180 dias ou descongelado para 24 horas. O sistema calcula a validade, lote e gera a etiqueta pronta para imprimir! Deseja ver o passo a passo?';
            const html = `
                <div class="space-y-1.5 text-left">
                    <div class="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                        <span>🏷️</span> <span>Etiquetas e Validade ANVISA</span>
                    </div>
                    <p class="text-xs text-gray-700 dark:text-gray-300">
                        Prazos automáticos de conservação sanitária (Resfriado 3d, Congelado 90d, Seco 180d, Descongelado 24h) com rastreabilidade total.
                    </p>
                    <button onclick="window.startAppTour && window.startAppTour('etiquetas')" 
                            class="mt-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium shadow text-xs inline-flex items-center gap-1.5 cursor-pointer transition">
                        ▶️ Iniciar Passo a Passo
                    </button>
                </div>
            `;
            showFeedback('🏷️ ' + spoken, true, html);
            speak(spoken);
            return true;
        }

        // 7. O QUE É FATOR DE CORREÇÃO (FC)
        const isFcQ = (t.includes('fator de correcao') || t.includes('fator correcao') || t === 'o que e fc' || t.includes('peso bruto') || t.includes('peso liquido')) &&
            (t.includes('o que e') || t.includes('oque e') || t.includes('para que serve') || 
             t.includes('como calcular') || t.includes('como funciona') || t.includes('explicar') || t === 'o que e fc');

        if (isFcQ) {
            const spoken = 'O Fator de Correção é o Peso Bruto dividido pelo Peso Líquido. Ele calcula as perdas ao limpar carnes ou descascar legumes. Se você compra um quilo de carne e após a limpeza sobram 800 gramas, seu fator de correção é um ponto vinte e cinco, e o CMV.IA garante que o custo cobrado seja o do quilo real pago!';
            const html = `
                <div class="space-y-1.5 text-left">
                    <div class="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <span>🥩</span> <span>Fator de Correção (FC = PB / PL)</span>
                    </div>
                    <p class="text-xs text-gray-700 dark:text-gray-300">
                        Mede o desperdício inevitável (aparas, ossos, cascas). Um FC de 1,25 significa 25% de perda, ajustando o custo do ingrediente para o valor real.
                    </p>
                </div>
            `;
            showFeedback('🥩 ' + spoken, true, html);
            speak(spoken);
            return true;
        }

        // 8. O QUE É RECEITA BASE VS PRATO FINAL
        const isBaseQ = (t.includes('receita base') || t.includes('prato final') || t.includes('base ou prato')) &&
            (t.includes('o que e') || t.includes('oque e') || t.includes('diferenca') || 
             t.includes('quando usar') || t.includes('para que serve') || t.includes('explicar'));

        if (isBaseQ) {
            const spoken = 'A Receita Base é uma preparação intermediária que rende volume e serve como ingrediente em vários pratos, como molho de tomate ou massa fresca. Já o Prato Final é o item pronto, precificado com margem e servido diretamente ao cliente!';
            const html = `
                <div class="space-y-1.5 text-left">
                    <div class="font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                        <span>🍲</span> <span>Receita Base vs. Prato Final</span>
                    </div>
                    <p class="text-xs text-gray-700 dark:text-gray-300">
                        <b>Receita Base:</b> Produção em lote que entra como insumo de outras fichas.<br>
                        <b>Prato Final:</b> Item final do cardápio com markup e preço de venda.
                    </p>
                </div>
            `;
            showFeedback('🍲 ' + spoken, true, html);
            speak(spoken);
            return true;
        }

        // 9. TOUR GERAL / TUTORIAL GERAL / AJUDA GERAL DO SISTEMA
        const isGeneralTourQ = t === 'tutorial' || t === 'iniciar tutorial' || t === 'comecar tutorial' || 
            t === 'abrir tutorial' || t === 'ver tutorial' || t === 'fazer tour' || t === 'iniciar tour' || 
            t === 'tour guiado' || t === 'tour' || t === 'ajuda' || t === 'preciso de ajuda' || 
            t.includes('quais comandos') || t.includes('o que voce faz') || t.includes('o que voce pode fazer') || 
            t.includes('como voce funciona') || t.includes('como usar o sistema');

        if (isGeneralTourQ) {
            conversationState = { step: 'AWAITING_TOUR_CONFIRMATION', data: { tourType: 'geral' } };
            const spoken = 'Eu sou seu assistente por voz no CMV.IA! Posso criar categorias, adicionar ingredientes, calcular fichas, atualizar preços em lote, gerar etiquetas e emitir relatórios em PDF. Deseja iniciar o tour interativo geral pelo sistema?';
            const html = `
                <div class="space-y-1.5 text-left">
                    <div class="font-bold text-primary flex items-center gap-1.5">
                        <span>🧭</span> <span>Tour do Sistema CMV.IA</span>
                    </div>
                    <p class="text-xs text-gray-700 dark:text-gray-300">
                        Um guia interativo que passa por todas as telas e recursos essenciais do sistema.
                    </p>
                    <button onclick="window.startAppTour && window.startAppTour('geral')" 
                            class="mt-1 px-3 py-1.5 bg-primary hover:opacity-90 text-white rounded font-medium shadow text-xs inline-flex items-center gap-1.5 cursor-pointer transition">
                        ▶️ Iniciar Tour Completo
                    </button>
                </div>
            `;
            showFeedback('🧭 ' + spoken, true, html);
            speak(spoken);
            return true;
        }

        return false;
    }

    // ============================================================
    // PROCESSADOR CENTRAL COM CONTEXTO E DIÁLOGO INTELIGENTE
    // ============================================================
    async function processVoiceCommand(transcript) {
        const rawText = transcript.trim();
        const t = normalize(rawText);
        if (!t) return;

        if (transcriptText) {
            transcriptText.textContent = `"${rawText}"`;
        }

        console.log('[Assistente CMV.IA] Ouvido:', rawText, '| Estado Conversacional:', conversationState.step);

        const app = window.cmvApp;
        const currentView = app && typeof app.getCurrentView === 'function' ? app.getCurrentView() : 'dashboard';
        const modalEtq = document.getElementById('etiqueta-config-modal');
        const isModalEtqOpen = modalEtq && (!modalEtq.classList.contains('hidden') && modalEtq.style.display !== 'none');

        // Comandos universais de cancelamento
        if (t === 'cancelar' || t === 'esquece' || t === 'cancela' || (isModalEtqOpen && (t === 'fechar' || t === 'sair' || t.includes('fechar etiqueta')))) {
            if (isModalEtqOpen && app && typeof app.fecharModalEtiqueta === 'function') {
                app.fecharModalEtiqueta();
            }
            if (currentView === 'venda-direta' && app && typeof app.resetarFormProdutoVenda === 'function') {
                app.resetarFormProdutoVenda();
            }
            conversationState = { step: null, data: {} };
            const msg = isModalEtqOpen ? 'Etiqueta fechada.' : 'Operação cancelada.';
            showFeedback('❌ ' + msg, false);
            speak(msg);
            return;
        }

        // ------------------------------------------------------------
        // DIÁLOGO ATIVO: MODAL DE ETIQUETA ABERTO (CONFIRMAÇÃO / AJUSTES)
        // ------------------------------------------------------------
        if (isModalEtqOpen || conversationState.step === 'AWAITING_ETIQUETA_CONFIRMATION') {
            // Confirmar impressão
            if (t === 'imprimir' || t === 'imprimir agora' || t === 'pode imprimir' || t === 'imprime' ||
                t === 'confirmar' || t === 'confirma' || t === 'sim' || t === 'gerar' || t === 'ok' || t === 'imprimir etiqueta') {
                if (app && typeof app.imprimirEtiquetaAtiva === 'function') {
                    app.imprimirEtiquetaAtiva();
                    conversationState = { step: null, data: {} };
                    const msg = 'Imprimindo etiqueta!';
                    showFeedback('🖨️ ' + msg);
                    speak(msg);
                    return;
                }
            }

            // Alterar conservação / armazenamento
            if (t.includes('congelad')) {
                const select = document.getElementById('etq-tipo-armazenamento');
                if (select) select.value = 'congelado';
                const msg = 'Armazenamento alterado para congelado, validade de 90 dias. Deseja imprimir agora?';
                showFeedback('❄️ ' + msg);
                speak(msg);
                return;
            } else if (t.includes('resfriad')) {
                const select = document.getElementById('etq-tipo-armazenamento');
                if (select) select.value = 'resfriado';
                const msg = 'Armazenamento alterado para resfriado, validade de 3 dias. Deseja imprimir agora?';
                showFeedback('🧊 ' + msg);
                speak(msg);
                return;
            } else if (t.includes('seco') || t.includes('ambiente')) {
                const select = document.getElementById('etq-tipo-armazenamento');
                if (select) select.value = 'seco';
                const msg = 'Armazenamento alterado para seco e arejado, validade de 180 dias. Deseja imprimir agora?';
                showFeedback('📦 ' + msg);
                speak(msg);
                return;
            } else if (t.includes('descongelad')) {
                const select = document.getElementById('etq-tipo-armazenamento');
                if (select) select.value = 'descongelado';
                const msg = 'Armazenamento alterado para descongelado, validade de 24 horas. Deseja imprimir agora?';
                showFeedback('⏳ ' + msg);
                speak(msg);
                return;
            }

            // Alterar responsável
            if (t.startsWith('responsavel') || t.startsWith('chefe') || t.includes('mudar responsavel') || t.includes('alterar responsavel')) {
                let respName = rawText.replace(/^(mudar\s+responsavel\s+para|alterar\s+responsavel\s+para|responsavel\s+e|responsavel|chefe)\s*/i, '').trim();
                if (respName) {
                    const respInput = document.getElementById('etq-responsavel');
                    if (respInput) respInput.value = respName.toUpperCase();
                    const msg = `Responsável definido como ${respName.toUpperCase()}. Deseja imprimir agora?`;
                    showFeedback('👤 ' + msg);
                    speak(msg);
                    return;
                }
            }

            // Fechar modal de etiqueta
            if (t === 'fechar' || t === 'sair' || t === 'cancelar' || t === 'esquece' || t.includes('fechar')) {
                if (app && typeof app.fecharModalEtiqueta === 'function') {
                    app.fecharModalEtiqueta();
                }
                conversationState = { step: null, data: {} };
                const msg = 'Etiqueta fechada.';
                showFeedback('❌ ' + msg, false);
                speak(msg);
                return;
            }
        }

        // ------------------------------------------------------------
        // DIÁLOGO ATIVO: AGUARDANDO NOME DO PRODUTO PARA ETIQUETA
        // ------------------------------------------------------------
        if (conversationState.step === 'AWAITING_ETIQUETA_PRODUCT_NAME') {
            let storage = conversationState.data.storageType || null;
            let textClean = t;

            if (textClean.includes('congelad')) { storage = 'congelado'; textClean = textClean.replace(/\b(congelado|congelada|congelados|congeladas)\b/g, ''); }
            else if (textClean.includes('resfriad')) { storage = 'resfriado'; textClean = textClean.replace(/\b(resfriado|resfriada|resfriados|resfriadas)\b/g, ''); }
            else if (textClean.includes('seco') || textClean.includes('ambiente')) { storage = 'seco'; textClean = textClean.replace(/\b(seco|seca|ambiente)\b/g, ''); }
            else if (textClean.includes('descongelad')) { storage = 'descongelado'; textClean = textClean.replace(/\b(descongelado|descongelada)\b/g, ''); }

            textClean = textClean.replace(/\b(etiqueta|etiquetas|imprimir|gerar|de|do|da|dos|das|por favor|pra mim)\b/g, '').trim();

            const querySearch = textClean || t;
            const ingredientes = app ? app.getIngredientes() : [];
            const receitasSalvas = app ? app.getReceitasSalvas() : [];
            const match = findBestItemMatch(querySearch, ingredientes, receitasSalvas, true);

            if (match && match.item) {
                const itemName = match.type === 'ing' ? match.item.nome : (match.item.header?.descricaoProduto || 'Receita');
                if (app && typeof app.abrirModalEtiquetaPorVoz === 'function') {
                    app.abrirModalEtiquetaPorVoz(match.item.id, storage || 'resfriado');
                    conversationState = {
                        step: 'AWAITING_ETIQUETA_CONFIRMATION',
                        data: { itemId: match.item.id, itemName: itemName }
                    };
                    const msg = `Etiqueta de ${itemName} aberta. Deseja imprimir agora ou alterar o armazenamento?`;
                    showFeedback('🏷️ ' + msg);
                    speak(msg);
                    return;
                }
            } else {
                const msg = `Não encontrei "${rawText}". Diga o nome de uma receita ou ingrediente cadastrado, ou diga "cancelar".`;
                showFeedback('⚠️ ' + msg, false);
                speak(msg);
                return;
            }
        }

        // ------------------------------------------------------------
        // DIÁLOGO ATIVO: CADASTRO CONVERSACIONAL DE PRODUTO VENDA DIRETA
        // ------------------------------------------------------------
        if (conversationState.step === 'AWAITING_VENDA_PROD_NAME') {
            const nomeInput = document.getElementById('nome-produto-venda');
            if (nomeInput) nomeInput.value = rawText.toUpperCase();
            
            const catSelect = document.getElementById('categoria-produto-venda');
            if (catSelect) {
                catSelect.scrollIntoView({ behavior: 'smooth' });
                catSelect.focus();
            }
            
            conversationState = { step: 'AWAITING_VENDA_PROD_CATEGORY', data: { nome: rawText.toUpperCase() } };
            const msg = `Produto definido como ${rawText.toUpperCase()}. Qual a categoria do produto?`;
            showFeedback('🏷️ ' + msg);
            speak(msg);
            return;
        }

        if (conversationState.step === 'AWAITING_VENDA_PROD_CATEGORY') {
            const cat = await resolveDirectSaleCategory(rawText, app);
            const compraInput = document.getElementById('preco-compra-venda');
            if (compraInput) compraInput.focus();

            conversationState = { step: 'AWAITING_VENDA_PROD_PRECO_COMPRA', data: { ...conversationState.data, categoria: cat } };
            const catName = cat || rawText.toUpperCase();
            const msg = `Categoria definida como ${catName}. Qual o preço de compra?`;
            showFeedback('💰 ' + msg);
            speak(msg);
            return;
        }

        if (conversationState.step === 'AWAITING_VENDA_PROD_PRECO_COMPRA') {
            const price = parsePriceNumber(rawText);
            if (price !== null && price > 0) {
                const compraInput = document.getElementById('preco-compra-venda');
                if (compraInput) compraInput.value = price.toFixed(2);
                const vendaInput = document.getElementById('preco-venda-venda');
                if (vendaInput) vendaInput.focus();

                conversationState = { step: 'AWAITING_VENDA_PROD_PRECO_VENDA', data: { ...conversationState.data, precoCompra: price } };
                const priceFmt = price.toFixed(2).replace('.', ',');
                const msg = `Preço de compra: R$ ${priceFmt}. Qual o preço de venda?`;
                showFeedback('💲 ' + msg);
                speak(msg);
                return;
            } else {
                const msg = 'Não entendi o valor. Fale o preço de compra, por exemplo: "3 reais" ou "2 e 50".';
                showFeedback('⚠️ ' + msg, false);
                speak(msg);
                return;
            }
        }

        if (conversationState.step === 'AWAITING_VENDA_PROD_PRECO_VENDA') {
            const price = parsePriceNumber(rawText);
            if (price !== null && price > 0) {
                const vendaInput = document.getElementById('preco-venda-venda');
                if (vendaInput) vendaInput.value = price.toFixed(2);

                conversationState = { step: 'AWAITING_VENDA_CONFIRM_SAVE', data: { ...conversationState.data, precoVenda: price } };
                const priceFmt = price.toFixed(2).replace('.', ',');
                const msg = `Preço de venda: R$ ${priceFmt}. Deseja salvar o produto agora?`;
                showFeedback('❓ ' + msg);
                speak(msg);
                return;
            } else {
                const msg = 'Não entendi o valor. Fale o preço de venda, por exemplo: "7 reais" ou "6 e 50".';
                showFeedback('⚠️ ' + msg, false);
                speak(msg);
                return;
            }
        }

        if (conversationState.step === 'AWAITING_VENDA_CONFIRM_SAVE') {
            if (t.includes('sim') || t.includes('salvar') || t.includes('pode') || t.includes('salva') || t.includes('confirma') || t === 's') {
                await validateAndSaveProdutoVenda(app);
                return;
            } else if (t.includes('nao') || t.includes('cancela') || t.includes('descarta') || t === 'n') {
                conversationState = { step: null, data: {} };
                const msg = 'Operação cancelada.';
                showFeedback('❌ ' + msg, false);
                speak(msg);
                return;
            } else {
                const msg = 'Deseja salvar o produto de venda direta? Responda sim ou não.';
                showFeedback('❓ ' + msg, false);
                speak(msg);
                return;
            }
        }

        // ------------------------------------------------------------
        // DIÁLOGO ATIVO: PREENCHIMENTO DE CAMPOS FALTANTES PARA SALVAR
        // ------------------------------------------------------------
        if (conversationState.step === 'AWAITING_VENDA_FIELD_NAME') {
            const nomeInput = document.getElementById('nome-produto-venda');
            if (nomeInput) nomeInput.value = rawText.toUpperCase();
            await validateAndSaveProdutoVenda(app);
            return;
        }

        if (conversationState.step === 'AWAITING_VENDA_FIELD_CATEGORY') {
            await resolveDirectSaleCategory(rawText, app);
            await validateAndSaveProdutoVenda(app);
            return;
        }

        if (conversationState.step === 'AWAITING_VENDA_FIELD_PRECO_COMPRA') {
            const price = parsePriceNumber(rawText);
            if (price !== null && price > 0) {
                const compraInput = document.getElementById('preco-compra-venda');
                if (compraInput) compraInput.value = price.toFixed(2);
                await validateAndSaveProdutoVenda(app);
                return;
            } else {
                const msg = 'Não entendi o valor. Fale o preço de compra, por exemplo: "3 reais" ou "2 e 50".';
                showFeedback('⚠️ ' + msg, false);
                speak(msg);
                return;
            }
        }

        if (conversationState.step === 'AWAITING_VENDA_FIELD_PRECO_VENDA') {
            const price = parsePriceNumber(rawText);
            if (price !== null && price > 0) {
                const vendaInput = document.getElementById('preco-venda-venda');
                if (vendaInput) vendaInput.value = price.toFixed(2);
                await validateAndSaveProdutoVenda(app);
                return;
            } else {
                const msg = 'Não entendi o valor. Fale o preço de venda, por exemplo: "7 reais" ou "5 reais".';
                showFeedback('⚠️ ' + msg, false);
                speak(msg);
                return;
            }
        }

        // ------------------------------------------------------------
        // DIÁLOGO ATIVO: 1. AGUARDANDO NOME DO INGREDIENTE PARA PREÇO
        // ------------------------------------------------------------
        if (conversationState.step === 'AWAITING_ING_NAME_FOR_PRICE') {
            const ingredientes = app ? app.getIngredientes() : [];
            const match = findBestItemMatch(t, ingredientes);

            if (match && match.item) {
                conversationState = {
                    step: 'AWAITING_NEW_PRICE',
                    data: { ingredient: match.item }
                };
                const msg = `Qual o novo preço de compra para ${match.item.nome}?`;
                showFeedback('💰 ' + msg);
                speak(msg);
                return;
            } else {
                const msg = `Não encontrei "${rawText}" no seu estoque. Qual o ingrediente deseja atualizar?`;
                showFeedback('⚠️ ' + msg, false);
                speak(msg);
                return;
            }
        }

        // ------------------------------------------------------------
        // DIÁLOGO ATIVO: 2. AGUARDANDO NOVO VALOR DO PREÇO
        // ------------------------------------------------------------
        if (conversationState.step === 'AWAITING_NEW_PRICE') {
            const targetIng = conversationState.data.ingredient;
            const newPrice = parsePriceNumber(rawText);

            if (newPrice !== null && newPrice > 0) {
                if (app && typeof app.atualizarPrecoIngredientePorVoz === 'function') {
                    const success = await app.atualizarPrecoIngredientePorVoz(targetIng.id, newPrice);
                    conversationState = { step: null, data: {} };
                    if (success) {
                        const priceFmt = newPrice.toFixed(2).replace('.', ',');
                        const msg = `Preço de ${targetIng.nome} atualizado para R$ ${priceFmt} com sucesso!`;
                        showFeedback('✅ ' + msg);
                        speak(msg);
                        return;
                    }
                }
            } else {
                const msg = `Não entendi o valor. Fale apenas o preço, por exemplo: "52 reais" ou "48 e 50".`;
                showFeedback('⚠️ ' + msg, false);
                speak(msg);
                return;
            }
        }

        // ------------------------------------------------------------
        // DIÁLOGO ATIVO: 3. AGUARDANDO TIPO DE SALVAMENTO DE FICHA (PRATO OU BASE)
        // ------------------------------------------------------------
        if (conversationState.step === 'AWAITING_SAVE_TYPE') {
            let tipoSalvar = null;
            if (t.includes('prato') || t.includes('final')) {
                tipoSalvar = 'prato';
            } else if (t.includes('base') || t.includes('receita base') || t.includes('sub')) {
                tipoSalvar = 'base';
            }

            if (tipoSalvar && app && typeof app.salvarFichaPorVoz === 'function') {
                const success = await app.salvarFichaPorVoz(tipoSalvar);
                const isThenExit = conversationState.data.thenExit;
                const dest = conversationState.data.destination || 'dashboard';
                conversationState = { step: null, data: {} };

                if (success) {
                    const tipoDesc = tipoSalvar === 'prato' ? 'prato final' : 'receita base';
                    if (isThenExit) {
                        app.showView(dest);
                        const msg = `Ficha técnica salva como ${tipoDesc}! Voltando para a tela inicial.`;
                        showFeedback('💾 ' + msg);
                        speak(msg);
                    } else {
                        const msg = `Ficha técnica salva como ${tipoDesc} com sucesso!`;
                        showFeedback('💾 ' + msg);
                        speak(msg);
                    }
                    return;
                }
            } else {
                const msg = `Por favor, responda se deseja salvar como "prato final" ou como "receita base".`;
                showFeedback('❓ ' + msg, false);
                speak(msg);
                return;
            }
        }

        // ------------------------------------------------------------
        // DIÁLOGO ATIVO: 4. AGUARDANDO ESCOLHA DE SALVAMENTO DUPLO EM INGREDIENTES
        // ------------------------------------------------------------
        if (conversationState.step === 'AWAITING_ING_SAVE_CHOICE') {
            if (t.includes('preco') || t.includes('lote') || t.includes('tabela')) {
                const btn = document.getElementById('btn-salvar-novos-precos');
                if (btn) btn.click();
                conversationState = { step: null, data: {} };
                const msg = 'Atualização de preços em lote salva com sucesso!';
                showFeedback('💰 ' + msg);
                speak(msg);
                return;
            } else if (t.includes('ingrediente') || t.includes('novo')) {
                const form = document.getElementById('form-ingrediente');
                if (form) {
                    window.salvandoPorVoz = true;
                    form.requestSubmit();
                    setTimeout(() => { window.salvandoPorVoz = false; }, 500);
                }
                conversationState = { step: null, data: {} };
                const msg = 'Novo ingrediente salvo com sucesso!';
                showFeedback('🍅 ' + msg);
                speak(msg);
                return;
            } else {
                const msg = 'Deseja salvar a atualização de "preços em lote" ou o "novo ingrediente"?';
                showFeedback('❓ ' + msg, false);
                speak(msg);
                return;
            }
        }

        // ------------------------------------------------------------
        // DIÁLOGO ATIVO: 5. AGUARDANDO CONFIRMAÇÃO PARA SAIR DE FICHA
        // ------------------------------------------------------------
        if (conversationState.step === 'AWAITING_EXIT_CONFIRMATION') {
            if (t.includes('sim') || t.includes('salvar') || t.includes('quero') || t === 's') {
                const ficha = app ? app.getFichaAtual() : null;
                if (ficha && (ficha.type === 'prato' || ficha.type === 'base')) {
                    await app.salvarFichaPorVoz(ficha.type);
                    app.showView('dashboard');
                    conversationState = { step: null, data: {} };
                    const msg = 'Alterações salvas! Voltando para a tela inicial.';
                    showFeedback('💾 ' + msg);
                    speak(msg);
                    return;
                } else {
                    conversationState = { step: 'AWAITING_SAVE_TYPE', data: { thenExit: true, destination: 'dashboard' } };
                    const msg = 'Deseja salvar como prato final ou como receita base?';
                    showFeedback('❓ ' + msg);
                    speak(msg);
                    return;
                }
            } else if (t.includes('nao') || t.includes('sair sem salvar') || t.includes('descarta') || t === 'n') {
                if (app) {
                    app.limparFicha();
                    app.showView('dashboard');
                }
                conversationState = { step: null, data: {} };
                const msg = 'Voltando para a tela inicial sem salvar.';
                showFeedback('🏠 ' + msg);
                speak(msg);
                return;
            } else {
                const msg = 'Deseja salvar a ficha antes de sair? Responda sim ou não.';
                showFeedback('❓ ' + msg, false);
                speak(msg);
                return;
            }
        }

        // ------------------------------------------------------------
        // DIÁLOGO ATIVO: 6. AGUARDANDO NOME DO PRATO ANTES DE SALVAR
        // ------------------------------------------------------------
        if (conversationState.step === 'AWAITING_PRATO_NAME_FOR_SAVE') {
            const descInput = document.getElementById('descricao-produto');
            if (descInput) {
                descInput.value = rawText.toUpperCase();
                descInput.dispatchEvent(new Event('input'));
            }
            const ficha = app ? app.getFichaAtual() : null;
            if (ficha && (ficha.type === 'prato' || ficha.type === 'base')) {
                await app.salvarFichaPorVoz(ficha.type);
                conversationState = { step: null, data: {} };
                const msg = `Ficha de ${rawText} salva com sucesso!`;
                showFeedback('💾 ' + msg);
                speak(msg);
                return;
            } else {
                conversationState = { step: 'AWAITING_SAVE_TYPE', data: conversationState.data };
                const msg = `Nome definido como ${rawText}. Deseja salvar como prato final ou como receita base?`;
                showFeedback('❓ ' + msg);
                speak(msg);
                return;
            }
        }

        // ------------------------------------------------------------
        // DIÁLOGO ATIVO: 7. AGUARDANDO NOME DA NOVA FICHA TÉCNICA
        // ------------------------------------------------------------
        if (conversationState.step === 'AWAITING_NEW_FICHA_NAME') {
            let dishName = rawText.replace(/^(o\s+nome\s+(é|e)\s+|vai\s+se\s+chamar\s+|nome\s+(é|e)\s+|chama\s+|coloque\s+|colocar\s+)/i, '').trim();
            if (!dishName) dishName = rawText.trim();
            
            if (app) app.showView('fichas');
            const descInput = document.getElementById('descricao-produto');
            if (descInput) {
                descInput.value = dishName.toUpperCase();
                descInput.dispatchEvent(new Event('input'));
            }
            conversationState = { step: null, data: {} };
            const msg = `Ficha técnica iniciada para ${dishName}! Qual o primeiro ingrediente ou quantidade?`;
            showFeedback('📝 ' + msg);
            speak(msg);
            return;
        }

        // ------------------------------------------------------------
        // DIÁLOGO ATIVO: 8. AGUARDANDO QUAL FICHA ABRIR
        // ------------------------------------------------------------
        if (conversationState.step === 'AWAITING_FICHA_TO_OPEN') {
            const receitas = app ? app.getReceitasSalvas() : [];
            const match = findBestFichaMatch(rawText, receitas);
            if (match && match.ficha) {
                if (app) {
                    app.carregarFicha(match.ficha.id);
                    app.showView('fichas');
                }
                conversationState = { step: null, data: {} };
                const msg = `Abrindo a ficha técnica de ${match.ficha.header.descricaoProduto}!`;
                showFeedback('📝 ' + msg);
                speak(msg);
                return;
            } else {
                conversationState = { step: null, data: {} };
                if (app) app.showView('consultar');
                const msg = `Não encontrei nenhuma ficha técnica com o nome "${rawText}". Abri a consulta com todas as fichas.`;
                showFeedback('🔍 ' + msg, false);
                speak(msg);
                return;
            }
        }

        // ------------------------------------------------------------
        // DIÁLOGO ATIVO: 9. AGUARDANDO CONFIRMAÇÃO DO PASSO A PASSO / TUTORIAL
        // ------------------------------------------------------------
        if (conversationState.step === 'AWAITING_TOUR_CONFIRMATION') {
            const tourType = conversationState.data?.tourType || 'geral';
            const positiveMatches = ['sim', 'quero', 'pode ser', 'iniciar', 'mostra', 'mostrar', 'comecar', 'vamos', 'ok', 'claro', 'bora', 'pode', 'positivo', 'fazer tour', 'fazer tutorial'];
            const negativeMatches = ['nao', 'agora nao', 'depois', 'cancelar', 'esquece', 'deixa'];

            const isPositive = positiveMatches.some(p => t === p || t.startsWith(p + ' ') || t.endsWith(' ' + p));
            const isNegative = negativeMatches.some(n => t === n || t.startsWith(n + ' ') || t.endsWith(' ' + n));

            if (isPositive) {
                conversationState = { step: null, data: {} };
                const msg = 'Iniciando o passo a passo interativo na tela!';
                showFeedback('🚀 ' + msg);
                speak(msg);
                if (typeof window.startAppTour === 'function') {
                    setTimeout(() => {
                        window.startAppTour(tourType);
                    }, 400);
                }
                return;
            } else if (isNegative) {
                conversationState = { step: null, data: {} };
                const msg = 'Tudo bem! Se precisar de ajuda ou de um tour guiado, é só pedir.';
                showFeedback('👍 ' + msg);
                speak(msg);
                return;
            } else {
                conversationState = { step: null, data: {} };
            }
        }

        // ------------------------------------------------------------
        // PERGUNTAS DE TUTORIAL, DÚVIDAS E COMO FAZER (FAQ INTELIGENTE)
        // ------------------------------------------------------------
        if (handleTutorialAndFAQ(t, rawText, app)) {
            return;
        }

        // ============================================================
        // COMANDOS DIRETOS: 1. SALVAR (TOTALMENTE CONTEXTUAL)
        // ============================================================
        const isSaveCommand = t === 'salvar' || t === 'salvar alteracoes' || t === 'salvar dados' || 
                              t === 'gravar' || t.startsWith('salvar ') || t === 'salvar tudo';

        if (isSaveCommand) {
            const editModal = document.getElementById('edit-ingredient-modal');
            const isEditModalOpen = editModal && (!editModal.classList.contains('hidden') && editModal.style.display !== 'none');

            // CONTEXTO 1: Modal de edição de ingrediente aberto (em qualquer tela)
            if (isEditModalOpen) {
                const formEdit = document.getElementById('form-edit-ingrediente');
                if (formEdit) {
                    window.salvandoPorVoz = true;
                    formEdit.requestSubmit();
                    setTimeout(() => { window.salvandoPorVoz = false; }, 500);
                    const msg = 'Alterações do ingrediente salvas com sucesso!';
                    showFeedback('💾 ' + msg);
                    speak(msg);
                    return;
                }
            }

            // CONTEXTO 2: Tela de Ingredientes
            if (currentView === 'ingredientes') {
                const painelPrecos = document.getElementById('painel-atualizar-precos');
                const isPainelPrecosOpen = painelPrecos && (!painelPrecos.classList.contains('hidden') && painelPrecos.style.display !== 'none');
                const nomeIng = document.getElementById('nome-ingrediente')?.value.trim() || '';
                const precoIng = document.getElementById('preco-compra')?.value.trim() || '';
                const isNovoIngFilled = nomeIng.length > 0 || precoIng.length > 0;

                // Se duas opções estiverem ativas, pergunta qual deseja salvar!
                if (isPainelPrecosOpen && isNovoIngFilled) {
                    conversationState = { step: 'AWAITING_ING_SAVE_CHOICE', data: {} };
                    const msg = 'Deseja salvar a atualização de preços em lote ou o novo ingrediente?';
                    showFeedback('❓ ' + msg);
                    speak(msg);
                    return;
                }

                if (isPainelPrecosOpen) {
                    const btn = document.getElementById('btn-salvar-novos-precos');
                    if (btn) btn.click();
                    const msg = 'Atualização de preços salva com sucesso!';
                    showFeedback('💰 ' + msg);
                    speak(msg);
                    return;
                }

                if (isNovoIngFilled) {
                    const formNovo = document.getElementById('form-ingrediente');
                    if (formNovo) {
                        window.salvandoPorVoz = true;
                        formNovo.requestSubmit();
                        setTimeout(() => { window.salvandoPorVoz = false; }, 500);
                        const msg = 'Novo ingrediente salvo com sucesso!';
                        showFeedback('🍅 ' + msg);
                        speak(msg);
                        return;
                    }
                }

                const msg = 'Não há alterações ou ingredientes pendentes para salvar nesta tela.';
                showFeedback('⚠️ ' + msg, false);
                speak(msg);
                return;
            }

            // CONTEXTO 3: Tela de Ficha Técnica
            if (currentView === 'fichas' || t.includes('ficha') || t.includes('receita') || t.includes('prato')) {
                const descInput = document.getElementById('descricao-produto');
                if (!descInput || !descInput.value.trim()) {
                    conversationState = { step: 'AWAITING_PRATO_NAME_FOR_SAVE', data: {} };
                    const msg = 'Qual o nome da ficha antes de salvar?';
                    showFeedback('❓ ' + msg);
                    speak(msg);
                    return;
                }

                const ficha = app ? app.getFichaAtual() : null;
                if (ficha && (ficha.type === 'prato' || ficha.type === 'base')) {
                    const success = await app.salvarFichaPorVoz(ficha.type);
                    if (success) {
                        const tipoDesc = ficha.type === 'prato' ? 'prato final' : 'receita base';
                        const msg = `Ficha técnica salva como ${tipoDesc} com sucesso!`;
                        showFeedback('💾 ' + msg);
                        speak(msg);
                        return;
                    }
                } else {
                    conversationState = { step: 'AWAITING_SAVE_TYPE', data: {} };
                    const msg = 'Deseja salvar como prato final ou como receita base?';
                    showFeedback('❓ ' + msg);
                    speak(msg);
                    return;
                }
            }

            // CONTEXTO 4: Produtos de Venda Direta
            if (currentView === 'venda-direta' || t.includes('produto de venda') || t === 'salvar produto') {
                await validateAndSaveProdutoVenda(app);
                return;
            }

            // CONTEXTO 5: Tabela de Preços de Venda
            if (currentView === 'precos') {
                const btnPrecos = document.getElementById('btn-salvar-lista-precos');
                if (btnPrecos) {
                    btnPrecos.click();
                    const msg = 'Lista de preços salva com sucesso!';
                    showFeedback('💲 ' + msg);
                    speak(msg);
                    return;
                }
            }

            // CONTEXTO 6: Configurações
            if (currentView === 'settings') {
                const btnConfig = document.getElementById('btn-salvar-config');
                if (btnConfig) btnConfig.click();
                const msg = 'Configurações salvas com sucesso!';
                showFeedback('⚙️ ' + msg);
                speak(msg);
                return;
            }

            // Outras telas sem formulário de salvamento
            const msg = `Você está na tela de ${currentView}. Não há alterações para salvar nesta tela.`;
            showFeedback('⚠️ ' + msg, false);
            speak(msg);
            return;
        }

        // ============================================================
        // COMANDOS DIRETOS: 2. ATUALIZAR PREÇO DE INGREDIENTE
        // ============================================================
        const isPriceCommand = t.includes('atualizar preco') || t.includes('mudar preco') || 
                               t.includes('alterar preco') || t.includes('ajustar preco') || 
                               t.includes('atualizar custo') || t.includes('mudar custo') ||
                               t.includes('alterar custo') || t === 'atualizar precos';

        if (isPriceCommand) {
            // Em uma frase: "atualizar preço do contrafilé para 52 reais"
            const inlineMatch = t.match(/^(?:atualizar|mudar|alterar|ajustar)\s+(?:preco|custo)\s+(?:do|da|de)?\s*(.+?)\s+para\s+(.+)$/i);
            if (inlineMatch) {
                const ingName = inlineMatch[1].trim();
                const pricePart = inlineMatch[2].trim();
                const newPrice = parsePriceNumber(pricePart);
                const ingredientes = app ? app.getIngredientes() : [];
                const match = findBestItemMatch(ingName, ingredientes);

                if (match && newPrice !== null && newPrice > 0) {
                    const success = await app.atualizarPrecoIngredientePorVoz(match.item.id, newPrice);
                    if (success) {
                        const priceFmt = newPrice.toFixed(2).replace('.', ',');
                        const msg = `Preço de ${match.item.nome} atualizado para R$ ${priceFmt}!`;
                        showFeedback('💰 ' + msg);
                        speak(msg);
                        return;
                    }
                }
            }

            // Falou apenas o ingrediente: "atualizar preço do contrafilé"
            const cleanIng = t.replace(/^(atualizar|mudar|alterar|ajustar)\s+(preco|custo)\s*(do|da|de)?/i, '').trim();
            if (cleanIng.length > 2 && !cleanIng.includes('preco') && !cleanIng.includes('custo')) {
                const ingredientes = app ? app.getIngredientes() : [];
                const match = findBestItemMatch(cleanIng, ingredientes);
                if (match) {
                    conversationState = {
                        step: 'AWAITING_NEW_PRICE',
                        data: { ingredient: match.item }
                    };
                    const msg = `Qual o novo preço de compra para ${match.item.nome}?`;
                    showFeedback('💰 ' + msg);
                    speak(msg);
                    return;
                }
            }

            // Pedido genérico: "atualizar preços"
            conversationState = { step: 'AWAITING_ING_NAME_FOR_PRICE', data: {} };
            const msg = 'Qual o ingrediente que você deseja atualizar o preço?';
            showFeedback('💰 ' + msg);
            speak(msg);
            return;
        }

        // ============================================================
        // COMANDOS DIRETOS: 3. SAIR / VOLTAR (COM CONFIRMAÇÃO DE SALVAMENTO)
        // ============================================================
        const isExitCommand = t === 'sair' || t === 'voltar' || t === 'inicio' || t.includes('inicial') || 
                              t.includes('dashboard') || t.includes('painel') || t.includes('home') || 
                              t.startsWith('voltar para') || t.startsWith('voltar pro') || t.startsWith('ir para o inicio');

        if (isExitCommand) {
            if (currentView === 'fichas') {
                const ficha = app ? app.getFichaAtual() : null;
                const descVal = document.getElementById('descricao-produto')?.value.trim() || '';
                const hasEdits = ficha && ((ficha.componentes && ficha.componentes.length > 0) || descVal.length > 0);

                if (hasEdits) {
                    conversationState = { step: 'AWAITING_EXIT_CONFIRMATION', data: { destination: 'dashboard' } };
                    const msg = 'Deseja salvar a ficha antes de sair?';
                    showFeedback('❓ ' + msg);
                    speak(msg);
                    return;
                }
            }

            if (app) app.showView('dashboard');
            const msg = 'Voltando para a tela inicial.';
            showFeedback('🏠 ' + msg);
            speak(msg);
            return;
        }

        // ============================================================
        // COMANDOS DIRETOS: 4. ABRIR / CONSULTAR FICHAS
        // ============================================================
        const isListFichasCmd = t.includes('abrir as fichas') || t.includes('abrir fichas') || 
                                t.includes('consultar ficha') || t.includes('ver as fichas') || 
                                t.includes('ver fichas') || t.includes('fichas salvas') || 
                                t.includes('minhas fichas') || t.includes('lista de fichas') || 
                                t === 'fichas' || t === 'as fichas' || t === 'consultar fichas';

        if (isListFichasCmd) {
            if (app) app.showView('consultar');
            setTimeout(() => {
                const el = document.getElementById('search-fichas');
                if (el) el.focus();
            }, 300);
            const msg = 'Abrindo consulta de fichas técnicas salvas.';
            showFeedback('🔍 ' + msg);
            speak(msg);
            return;
        }

        const isFichaOpenCmd = /^(abrir|ver|editar|carregar|consultar|mostrar)\s+(a\s+|o\s+|as\s+|os\s+)?(ficha|receita|prato)(\s+tecnica)?\b/i.test(t) ||
                              /^(abrir|ver|editar|carregar)\s+(o\s+prato|a\s+receita|a\s+ficha|o\s+item)\b/i.test(t);

        if (isFichaOpenCmd) {
            const queryFicha = cleanFichaQuery(t);
            const receitas = app ? app.getReceitasSalvas() : [];

            if (!queryFicha) {
                if (app) app.showView('consultar');
                conversationState = { step: 'AWAITING_FICHA_TO_OPEN', data: {} };
                const msg = 'Qual ficha técnica você deseja abrir?';
                showFeedback('❓ ' + msg);
                speak(msg);
                return;
            }

            const match = findBestFichaMatch(queryFicha, receitas);
            if (match && match.ficha && app) {
                app.carregarFicha(match.ficha.id);
                app.showView('fichas');
                const msg = `Abrindo a ficha técnica de ${match.ficha.header.descricaoProduto}!`;
                showFeedback('📝 ' + msg);
                speak(msg);
                return;
            } else {
                if (app) app.showView('consultar');
                const msg = `Não encontrei a ficha técnica de "${queryFicha}". Abrindo lista para você consultar.`;
                showFeedback('🔍 ' + msg, false);
                speak(msg);
                return;
            }
        }

        // Se estiver na tela de consulta de fichas e o usuário falar um nome de prato
        if (currentView === 'consultar') {
            const receitas = app ? app.getReceitasSalvas() : [];
            const match = findBestFichaMatch(t, receitas);
            if (match && match.ficha && match.score >= 120 && app) {
                app.carregarFicha(match.ficha.id);
                app.showView('fichas');
                const msg = `Abrindo a ficha técnica de ${match.ficha.header.descricaoProduto}!`;
                showFeedback('📝 ' + msg);
                speak(msg);
                return;
            }
        }

        // ============================================================
        // COMANDOS DIRETOS: 5. REMOVER / RETIRAR ITEM DA FICHA
        // ============================================================
        const isRemoveCommand = t.startsWith('remover') || t.startsWith('retirar') || 
                                t.startsWith('apagar') || t.startsWith('excluir') || 
                                t.startsWith('tira') || t.startsWith('tirar') || 
                                t.startsWith('deletar') || t === 'desfazer';

        if (isRemoveCommand) {
            let itemRemover = t.replace(/^(remover|retirar|apagar|excluir|tira|tirar|deletar)\s*(o|a|os|as)?\s*/i, '').trim();
            itemRemover = itemRemover.replace(/\b(da ficha|do prato|da receita|por favor)\b/g, '').trim();

            if (app && typeof app.removerItemPorVoz === 'function') {
                const res = app.removerItemPorVoz(itemRemover);
                if (res.success) {
                    const nomeRemovido = res.item ? (res.item.nome || 'o item') : 'o item';
                    const msg = `Removido ${nomeRemovido} da ficha técnica!`;
                    showFeedback('🗑️ ' + msg);
                    speak(msg);
                    return;
                } else if (res.reason === 'vazio') {
                    const msg = 'A ficha técnica está vazia, não há itens para retirar.';
                    showFeedback('⚠️ ' + msg, false);
                    speak(msg);
                    return;
                } else {
                    const msg = `Não encontrei "${itemRemover}" na sua ficha atual para remover.`;
                    showFeedback('⚠️ ' + msg, false);
                    speak(msg);
                    return;
                }
            }
        }

        // ============================================================
        // COMANDOS DIRETOS: 6. NAVEGAÇÃO DE OUTRAS TELAS
        // ============================================================
        if (t.includes('criar categoria') || t.includes('nova categoria') || t.includes('adicionar categoria') || t.includes('abrir categoria') || t.includes('categorias') || t.includes('configurac')) {
            if (app) app.showView('settings');
            setTimeout(() => {
                const el = document.getElementById('nome-categoria-ingrediente') || document.getElementById('form-cat-ingrediente');
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    const input = el.querySelector('input');
                    if (input) input.focus();
                }
            }, 300);
            const msg = 'Abrindo configurações e categorias.';
            showFeedback('⚙️ ' + msg);
            speak(msg);
            return;
        }

        const isCreateFichaCmd = /^(?:fazer|criar|iniciar|nova)\s+(?:a\s+|o\s+)?(?:ficha(?:\s+tecnica)?|receita|prato)\b/i.test(t) ||
                                 t.includes('fazer ficha') || t.includes('criar ficha') || 
                                 t.includes('nova ficha') || t.includes('fazer receita') ||
                                 t === 'nova receita' || t === 'novo prato';

        if (isCreateFichaCmd) {
            // Tenta extrair o nome do prato se falado junto (Ex: "fazer ficha de contra filé")
            let dishName = t.replace(/^(?:fazer|criar|iniciar|nova)\s+(?:a\s+|o\s+)?(?:ficha(?:\s+tecnica)?|receita|prato)\s*(?:de|do|da|dos|das)?\s*/i, '').trim();
            dishName = dishName.replace(/\b(por favor|pra mim|agora)\b/g, '').trim();

            if (app) {
                app.limparFicha();
                app.showView('fichas');
            }

            if (dishName.length > 1) {
                const descInput = document.getElementById('descricao-produto');
                if (descInput) {
                    descInput.value = dishName.toUpperCase();
                    descInput.dispatchEvent(new Event('input'));
                }
                conversationState = { step: null, data: {} };
                const msg = `Nova ficha técnica de ${dishName} iniciada! Qual o primeiro insumo ou ingrediente?`;
                showFeedback('📝 ' + msg);
                speak(msg);
                return;
            } else {
                conversationState = { step: 'AWAITING_NEW_FICHA_NAME', data: {} };
                setTimeout(() => {
                    const el = document.getElementById('descricao-produto');
                    if (el) el.focus();
                }, 300);
                const msg = 'Abrindo nova ficha técnica. Qual o nome do prato?';
                showFeedback('📝 ' + msg);
                speak(msg);
                return;
            }
        }

        if (t.includes('ingrediente') || t.includes('estoque') || t.includes('banco de ingredientes') || t.includes('materia prima')) {
            if (app) app.showView('ingredientes');
            setTimeout(() => {
                const el = document.getElementById('nome-ingrediente');
                if (el) el.focus();
            }, 300);
            const msg = 'Abrindo banco de ingredientes.';
            showFeedback('🍅 ' + msg);
            speak(msg);
            return;
        }

        // ============================================================
        // COMANDOS DIRETOS: GERAR E IMPRIMIR PDF DA FICHA TÉCNICA
        // ============================================================
        const isPdfCustoCmd = t.includes('pdf de custo') || t.includes('pdf com custo') || 
                              t.includes('pdf com custos') || t.includes('imprimir pdf de custo') || 
                              t.includes('gerar pdf de custo') || t.includes('pdf financeiro');

        const isPdfOpCmd = t.includes('pdf operacional') || t.includes('pdf de operacao') || 
                           t.includes('pdf sem custo') || t.includes('pdf sem custos') || 
                           t.includes('imprimir pdf operacional') || t.includes('gerar pdf operacional') || 
                           t.includes('pdf da cozinha') || t.includes('pdf de producao');

        const isPrintFichaCmd = t === 'imprimir' || t === 'imprimir ficha' || t === 'imprimir receita' || 
                                t === 'imprimir prato' || t.startsWith('imprimir ficha') || 
                                t.startsWith('imprimir receita') || t.startsWith('imprimir prato');

        if (isPdfCustoCmd) {
            if (app && typeof app.gerarPDFAtiva === 'function') {
                app.gerarPDFAtiva(true);
                const msg = 'Gerando PDF com custos da ficha técnica.';
                showFeedback('📄 ' + msg);
                speak(msg);
                return;
            }
        }

        if (isPdfOpCmd) {
            if (app && typeof app.gerarPDFAtiva === 'function') {
                app.gerarPDFAtiva(false);
                const msg = 'Gerando PDF operacional da ficha técnica.';
                showFeedback('📋 ' + msg);
                speak(msg);
                return;
            }
        }

        if (isPrintFichaCmd && !t.includes('etiqueta')) {
            const queryPrint = cleanFichaQuery(t.replace(/^imprimir\s*/i, ''));
            const receitas = app ? app.getReceitasSalvas() : [];
            if (queryPrint.length > 1) {
                const match = findBestFichaMatch(queryPrint, receitas);
                if (match && match.ficha && app) {
                    app.carregarFicha(match.ficha.id);
                    app.gerarPDFAtiva(false);
                    const msg = `Abrindo impressão da ficha técnica de ${match.ficha.header.descricaoProduto}.`;
                    showFeedback('🖨️ ' + msg);
                    speak(msg);
                    return;
                }
            }

            if (app && typeof app.imprimirFichaAtiva === 'function') {
                app.imprimirFichaAtiva();
                const msg = 'Abrindo impressão da ficha técnica.';
                showFeedback('🖨️ ' + msg);
                speak(msg);
                return;
            }
        }

        // ============================================================
        // COMANDOS DIRETOS: IMPRIMIR E GERAR ETIQUETAS
        // ============================================================
        const isEtiquetaCommand = t.includes('etiqueta') || t.includes('etiquetas') || 
                                  t.startsWith('imprimir etiqueta') || t.startsWith('gerar etiqueta');

        if (isEtiquetaCommand) {
            // Se o usuário pediu explicitamente para abrir a tela/painel de etiquetas:
            if (t === 'abrir etiquetas' || t === 'abrir tela de etiquetas' || t === 'ver etiquetas' || 
                t === 'ir para etiquetas' || t === 'tela de etiquetas' || t === 'painel de etiquetas' ||
                t === 'consultar etiquetas' || t === 'lista de etiquetas') {
                if (app) app.showView('etiquetas');
                const msg = 'Abrindo impressão rápida de etiquetas.';
                showFeedback('🏷️ ' + msg);
                speak(msg);
                return;
            }

            // Identificar conservação se mencionada na frase
            let detectedStorage = null;
            if (t.includes('congelad')) detectedStorage = 'congelado';
            else if (t.includes('resfriad')) detectedStorage = 'resfriado';
            else if (t.includes('seco') || t.includes('ambiente')) detectedStorage = 'seco';
            else if (t.includes('descongelad')) detectedStorage = 'descongelado';

            // Extrair nome do produto ou receita da frase
            let queryProd = t;
            queryProd = queryProd.replace(/^(por favor\s+)?(imprimir|imprima|imprime|gerar|gere|fazer|faca|ver|abrir)\s+(a\s+|o\s+)?(etiqueta|etiquetas)\s*(de|do|da|dos|das)?\s*/i, '');
            queryProd = queryProd.replace(/^(etiqueta|etiquetas)\s*(de|do|da|dos|das)?\s*/i, '');
            queryProd = queryProd.replace(/\b(congelado|congelada|congelados|congeladas|resfriado|resfriada|resfriados|resfriadas|seco|seca|ambiente|descongelado|descongelada)\b/g, '');
            queryProd = queryProd.replace(/\b(por favor|pra mim|agora|rapida|rapido)\b/g, '').trim();

            const ingredientes = app ? app.getIngredientes() : [];
            const receitasSalvas = app ? app.getReceitasSalvas() : [];

            // CASO 1: Nome do produto/receita foi falado (ex: "imprimir etiqueta de contra filé congelado", "etiqueta do strogonoff")
            if (queryProd.length > 1) {
                const match = findBestItemMatch(queryProd, ingredientes, receitasSalvas, true);

                if (match && match.item) {
                    const itemName = match.type === 'ing' ? match.item.nome : (match.item.header?.descricaoProduto || 'Receita');
                    if (app && typeof app.abrirModalEtiquetaPorVoz === 'function') {
                        app.abrirModalEtiquetaPorVoz(match.item.id, detectedStorage || 'resfriado');
                        conversationState = {
                            step: 'AWAITING_ETIQUETA_CONFIRMATION',
                            data: { itemId: match.item.id, itemName: itemName }
                        };
                        const msg = `Etiqueta de ${itemName} aberta. Deseja imprimir agora ou alterar o armazenamento?`;
                        showFeedback('🏷️ ' + msg);
                        speak(msg);
                        return;
                    }
                } else {
                    conversationState = { step: 'AWAITING_ETIQUETA_PRODUCT_NAME', data: { storageType: detectedStorage } };
                    const msg = `Não encontrei "${queryProd}" nas suas receitas ou ingredientes. De qual produto você deseja imprimir a etiqueta?`;
                    showFeedback('⚠️ ' + msg, false);
                    speak(msg);
                    return;
                }
            }

            // CASO 2: Falou apenas "imprimir etiqueta" sem especificar o produto
            // Se estiver na tela de fichas e houver uma ficha ativa carregada:
            if (currentView === 'fichas') {
                const fichaAtual = app ? app.getFichaAtual() : null;
                const descInput = document.getElementById('descricao-produto');
                const nomeFichaAtual = descInput ? descInput.value.trim() : '';

                let targetId = null;
                let targetName = '';

                if (fichaAtual && fichaAtual.id) {
                    targetId = fichaAtual.id;
                    targetName = fichaAtual.header?.descricaoProduto || nomeFichaAtual;
                } else if (nomeFichaAtual) {
                    const m = findBestItemMatch(nomeFichaAtual, [], receitasSalvas, true);
                    if (m && m.item) {
                        targetId = m.item.id;
                        targetName = m.item.header?.descricaoProduto || nomeFichaAtual;
                    } else {
                        targetId = 'ativa';
                        targetName = nomeFichaAtual;
                    }
                } else if (fichaAtual && fichaAtual.componentes && fichaAtual.componentes.length > 0) {
                    targetId = 'ativa';
                    targetName = 'Receita em Edição';
                }

                if (targetId && app && typeof app.abrirModalEtiquetaPorVoz === 'function') {
                    app.abrirModalEtiquetaPorVoz(targetId, detectedStorage || 'resfriado');
                    conversationState = {
                        step: 'AWAITING_ETIQUETA_CONFIRMATION',
                        data: { itemId: targetId, itemName: targetName }
                    };
                    const msg = `Etiqueta de ${targetName} aberta. Deseja imprimir agora?`;
                    showFeedback('🏷️ ' + msg);
                    speak(msg);
                    return;
                }
            }

            // Se não houver ficha ativa aberta ou estiver em outra tela, inicia diálogo contextual:
            conversationState = { step: 'AWAITING_ETIQUETA_PRODUCT_NAME', data: { storageType: detectedStorage } };
            const msg = 'De qual produto ou receita você deseja imprimir a etiqueta?';
            showFeedback('🏷️ ' + msg);
            speak(msg);
            return;
        }

        if (t.includes('preco de venda') || t.includes('lista de preco') || t.includes('tabela de preco') || t.includes('precos')) {
            if (app) app.showView('precos');
            const msg = 'Abrindo lista de preços de venda.';
            showFeedback('💲 ' + msg);
            speak(msg);
            return;
        }

        if (t.includes('analise de custo') || t.includes('custo') || t.includes('relatorio de custo')) {
            if (app) app.showView('analise');
            const msg = 'Abrindo análise de custos.';
            showFeedback('📊 ' + msg);
            speak(msg);
            return;
        }

        if (t.includes('margem') || t.includes('relatorio de margem')) {
            if (app) app.showView('margem');
            const msg = 'Abrindo relatório de margens.';
            showFeedback('📈 ' + msg);
            speak(msg);
            return;
        }

        if (t.includes('vendas') || t.includes('analise de vendas') || t.includes('cmv')) {
            if (app) app.showView('vendas');
            const msg = 'Abrindo análise de vendas e CMV.';
            showFeedback('💰 ' + msg);
            speak(msg);
            return;
        }

        // ============================================================
        // COMANDOS DIRETOS: CADASTRAR PRODUTO DE VENDA DIRETA
        // ============================================================
        const isCadastrarVendaCmd = t.includes('cadastrar produto de venda') || 
                                   t.includes('novo produto de venda') || 
                                   t.includes('cadastrar novo produto de venda') ||
                                   t.includes('adicionar produto de venda') ||
                                   t.includes('cadastrar produto venda direta') ||
                                   t.includes('novo produto venda direta') ||
                                   t === 'cadastrar produto' || t === 'novo produto' ||
                                   t === 'cadastrar um produto' || t === 'novo produto de venda direta' ||
                                   (currentView === 'venda-direta' && (t.startsWith('cadastrar ') || t.startsWith('novo produto')));

        if (isCadastrarVendaCmd) {
            if (app) app.showView('venda-direta');
            if (app && typeof app.resetarFormProdutoVenda === 'function') app.resetarFormProdutoVenda();

            // Verificar se o usuário já falou o nome do produto no mesmo comando
            let prodName = t.replace(/^(quero\s+)?(cadastrar|adicionar|incluir)\s+(um\s+|o\s+)?(novo\s+)?(produto\s+)?(de\s+venda\s+direta|de\s+venda|venda\s+direta)?\s*/i, '');
            prodName = prodName.replace(/\b(de venda direta|de venda|venda direta|por favor|pra mim)\b/g, '').trim();

            if (prodName.length > 2 && prodName !== 'produto' && prodName !== 'novo produto') {
                const nomeInput = document.getElementById('nome-produto-venda');
                if (nomeInput) nomeInput.value = prodName.toUpperCase();
                const catSelect = document.getElementById('categoria-produto-venda');
                if (catSelect) {
                    catSelect.scrollIntoView({ behavior: 'smooth' });
                    catSelect.focus();
                }
                conversationState = { step: 'AWAITING_VENDA_PROD_CATEGORY', data: { nome: prodName.toUpperCase() } };
                const msg = `Produto definido como ${prodName.toUpperCase()}. Qual a categoria do produto?`;
                showFeedback('🏷️ ' + msg);
                speak(msg);
                return;
            } else {
                conversationState = { step: 'AWAITING_VENDA_PROD_NAME', data: {} };
                const nomeInput = document.getElementById('nome-produto-venda');
                if (nomeInput) nomeInput.focus();
                const msg = 'Abrindo produtos de venda direta. Qual o nome do produto?';
                showFeedback('🛒 ' + msg);
                speak(msg);
                return;
            }
        }

        // ============================================================
        // COMANDOS DIRETOS: ABRIR / EDITAR PRODUTO DE VENDA DIRETA
        // ============================================================
        const isEditVendaCmd = t.startsWith('abrir produto ') || t.startsWith('editar produto ') || 
                               t.startsWith('alterar produto ') || t.startsWith('carregar produto ') ||
                               t.startsWith('abrir o produto ') || t.startsWith('editar o produto ') ||
                               t.startsWith('alterar o produto ') ||
                               (currentView === 'venda-direta' && (t.startsWith('abrir ') || t.startsWith('editar ') || t.startsWith('alterar ')));

        if (isEditVendaCmd) {
            let queryProd = t.replace(/^(abrir|editar|alterar|carregar)\s+(o\s+|a\s+)?(produto\s+)?(de\s+venda\s+direta\s+|de\s+venda\s+)?/i, '').trim();
            queryProd = queryProd.replace(/\b(de venda direta|de venda|venda direta|por favor)\b/g, '').trim();

            const produtos = app && typeof app.getProdutosVendaDireta === 'function' ? app.getProdutosVendaDireta() : [];
            const match = findBestProdutoVenda(queryProd, produtos);

            if (match && app && typeof app.carregarProdutoVendaParaEdicao === 'function') {
                app.carregarProdutoVendaParaEdicao(match.id);
                conversationState = { step: null, data: { prodEditando: match } };
                const msg = `Produto ${match.nome} carregado para edição. O que você deseja alterar?`;
                showFeedback('✏️ ' + msg);
                speak(msg);
                return;
            } else {
                const msg = `Não encontrei "${queryProd}" nos produtos de venda direta.`;
                showFeedback('⚠️ ' + msg, false);
                speak(msg);
                return;
            }
        }

        // ============================================================
        // AJUSTES PONTUAIS DE CAMPOS NA TELA DE VENDA DIRETA
        // ============================================================
        if (currentView === 'venda-direta') {
            // Mudar preço de venda
            if (t.includes('preco de venda') || t.includes('valor de venda') || t.startsWith('venda para') || t.startsWith('venda ')) {
                const price = parsePriceNumber(rawText);
                if (price !== null && price > 0) {
                    const vendaInput = document.getElementById('preco-venda-venda');
                    if (vendaInput) {
                        vendaInput.value = price.toFixed(2);
                        vendaInput.dispatchEvent(new Event('input'));
                    }
                    const msg = `Preço de venda alterado para R$ ${price.toFixed(2).replace('.', ',')}.`;
                    showFeedback('💲 ' + msg);
                    speak(msg);
                    return;
                }
            }

            // Mudar preço de compra
            if (t.includes('preco de compra') || t.includes('custo') || t.startsWith('compra para') || t.startsWith('compra ')) {
                const price = parsePriceNumber(rawText);
                if (price !== null && price > 0) {
                    const compraInput = document.getElementById('preco-compra-venda');
                    if (compraInput) {
                        compraInput.value = price.toFixed(2);
                        compraInput.dispatchEvent(new Event('input'));
                    }
                    const msg = `Preço de compra alterado para R$ ${price.toFixed(2).replace('.', ',')}.`;
                    showFeedback('💰 ' + msg);
                    speak(msg);
                    return;
                }
            }

            // Mudar categoria
            if (t.startsWith('mudar categoria para ') || t.startsWith('categoria ') || t.startsWith('alterar categoria para ')) {
                const catQuery = rawText.replace(/^(mudar\s+categoria\s+para|alterar\s+categoria\s+para|categoria)\s*/i, '').trim();
                const cat = await resolveDirectSaleCategory(catQuery, app);
                const msg = `Categoria alterada para ${cat || catQuery.toUpperCase()}.`;
                showFeedback('🏷️ ' + msg);
                speak(msg);
                return;
            }

            // Mudar nome
            if (t.startsWith('mudar nome para ') || t.startsWith('nome do produto ') || t.startsWith('alterar nome para ')) {
                const nomeQuery = rawText.replace(/^(mudar\s+nome\s+para|alterar\s+nome\s+para|nome\s+do\s+produto)\s*/i, '').trim();
                const nomeInput = document.getElementById('nome-produto-venda');
                if (nomeInput && nomeQuery) {
                    nomeInput.value = nomeQuery.toUpperCase();
                    nomeInput.dispatchEvent(new Event('input'));
                    const msg = `Nome alterado para ${nomeQuery.toUpperCase()}.`;
                    showFeedback('✏️ ' + msg);
                    speak(msg);
                    return;
                }
            }
        }

        if (t.includes('venda direta') || t.includes('produtos de venda')) {
            if (app) app.showView('venda-direta');
            const msg = 'Abrindo produtos de venda direta.';
            showFeedback('🛒 ' + msg);
            speak(msg);
            return;
        }

        if (t.includes('tour') || t.includes('tutorial') || t.includes('ajuda') || t.includes('como usar')) {
            if (typeof window.startAppTour === 'function') {
                window.startAppTour('geral');
                const msg = 'Iniciando tour guiado pelo sistema.';
                showFeedback('💡 ' + msg);
                speak(msg);
                return;
            }
        }

        if (t.includes('limpar ficha') || t.includes('apagar ficha') || t.includes('nova ficha em branco')) {
            if (app) app.limparFicha();
            const msg = 'Ficha técnica limpa com sucesso.';
            showFeedback('🧹 ' + msg);
            speak(msg);
            return;
        }

        // ============================================================
        // COMANDOS DIRETOS: 7. DEFINIR NOME DO PRATO
        // ============================================================
        if (t.startsWith('nome do prato') || t.startsWith('nome da receita') || 
            t.startsWith('chamar de') || t.startsWith('prato ') || 
            t.startsWith('mudar nome para') || t.startsWith('definir nome') || 
            t.startsWith('o nome e ') || t.startsWith('o nome é ')) {
            let nomePrato = rawText.replace(/^(nome do prato|nome da receita|chamar de|mudar nome para|definir nome|o nome é|o nome e|prato)\s*(para|de|:)?\s*/i, '').trim();
            if (nomePrato) {
                if (app) app.showView('fichas');
                const descInput = document.getElementById('descricao-produto');
                if (descInput) {
                    descInput.value = nomePrato.toUpperCase();
                    descInput.dispatchEvent(new Event('input'));
                    const msg = `Nome do prato definido como ${nomePrato}.`;
                    showFeedback('🍲 ' + msg);
                    speak(msg);
                    return;
                }
            }
        }

        // ============================================================
        // COMANDOS DIRETOS: 8. ADIÇÃO DE INSUMOS À FICHA
        // ============================================================
        const isAddCommand = t.includes('coloque') || t.includes('adicione') || t.includes('colocar') || 
                             t.includes('adicionar') || t.includes('bota') || t.includes('botar') || 
                             t.includes('bote') || t.includes('acrescente') || t.includes('insira') ||
                             t.includes('grama') || t.includes('quilo') || t.includes('kg') || t.includes('litro');

        if (isAddCommand) {
            const parsedQty = parsePortugueseQuantity(t);
            const queryIng = extractIngredientQuery(t);

            if (parsedQty && queryIng) {
                const ingredientes = app ? app.getIngredientes() : [];
                const receitasSalvas = app ? app.getReceitasSalvas() : [];
                
                const match = findBestItemMatch(queryIng, ingredientes, receitasSalvas);

                if (match) {
                    const item = match.item;
                    const itemType = match.type;
                    const refId = `${itemType}_${item.id}`;

                    let baseUnit = itemType === 'ing' ? (item.unidadeBase || 'un').toLowerCase() : 'kg';
                    let convertedQty = parsedQty.qty;

                    if (baseUnit === 'kg' && parsedQty.unit === 'g') {
                        convertedQty = parsedQty.qty / 1000;
                    } else if (baseUnit === 'g' && parsedQty.unit === 'kg') {
                        convertedQty = parsedQty.qty * 1000;
                    } else if (baseUnit === 'l' && parsedQty.unit === 'ml') {
                        convertedQty = parsedQty.qty / 1000;
                    } else if (baseUnit === 'ml' && parsedQty.unit === 'l') {
                        convertedQty = parsedQty.qty * 1000;
                    }

                    const itemName = itemType === 'ing' ? item.nome : (item.header?.descricaoProduto || 'Receita');

                    if (app && typeof app.adicionarItemPorVoz === 'function') {
                        const success = app.adicionarItemPorVoz(refId, convertedQty);
                        if (success) {
                            const spokenQtyStr = parsedQty.unit ? `${parsedQty.qty} ${parsedQty.unit}` : `${convertedQty} ${baseUnit}`;
                            const msg = `Adicionado ${spokenQtyStr} de ${itemName} à ficha!`;
                            showFeedback('✅ ' + msg);
                            speak(msg);
                            return;
                        }
                    }
                } else {
                    const msg = `Não encontrei "${queryIng}" no seu estoque de ingredientes.`;
                    showFeedback('⚠️ ' + msg, false);
                    speak(msg);
                    return;
                }
            }
        }

        // ============================================================
        // 9. RESPOSTA CONTEXTUAL QUANDO NÃO ENTENDE (SEM REPETIR EXEMPLOS)
        // ============================================================
        let contextualHelp = 'Não entendi o comando. Pode repetir?';
        if (isModalEtqOpen) {
            contextualHelp = 'Você está na configuração da etiqueta. Diga "imprimir agora", mude para "congelado" ou diga "cancelar".';
        } else if (currentView === 'venda-direta') {
            contextualHelp = 'Você está em produtos de venda direta. Diga "cadastrar novo produto", "editar [produto]" ou "salvar".';
        } else if (currentView === 'etiquetas') {
            contextualHelp = 'Você está na tela de etiquetas. Diga "imprimir etiqueta de [produto]" ou "voltar ao início".';
        } else if (currentView === 'fichas') {
            contextualHelp = 'Não entendi. Você pode adicionar um insumo, retirar um item, pedir "imprimir pdf de custo", "imprimir pdf operacional", ou "salvar a ficha".';
        } else if (currentView === 'ingredientes') {
            contextualHelp = 'Não entendi. Você pode falar "salvar", "atualizar preço" ou o nome de um insumo.';
        } else if (currentView === 'consultar') {
            contextualHelp = 'Não entendi. Diga o nome de uma ficha para abrir (ex: "abrir parmegiana"), ou "voltar ao início".';
        }
        showFeedback('❓ ' + contextualHelp, false);
        speak(contextualHelp);
    }

    // Inicialização do Assistente e Eventos
    function init() {
        fabBtn = document.getElementById('btn-fab-voice');
        headerBtn = document.getElementById('btn-header-voice');
        cardModal = document.getElementById('voice-assistant-card');
        statusText = document.getElementById('voice-status-text');
        transcriptText = document.getElementById('voice-transcript-text');
        actionBadge = document.getElementById('voice-action-badge');
        pingDot = document.getElementById('voice-ping-indicator');
        dotIndicator = document.getElementById('voice-dot-indicator');
        muteBtn = document.getElementById('btn-voice-mute');
        closeBtn = document.getElementById('btn-close-voice-card');

        if (!SpeechRecognition) {
            console.warn('[Assistente CMV.IA] Navegador não suporta SpeechRecognition.');
            if (fabBtn) fabBtn.title = 'Reconhecimento de voz não suportado neste navegador';
            return;
        }

        recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            isListening = true;
            updateUIState();
        };

        recognition.onend = () => {
            if (autoRestart && isListening) {
                try { recognition.start(); } catch(e) {}
            } else {
                isListening = false;
                updateUIState();
            }
        };

        recognition.onerror = (event) => {
            console.warn('[Assistente CMV.IA] Erro de reconhecimento:', event.error);
            if (event.error === 'not-allowed') {
                alert('Permissão de microfone bloqueada pelo navegador. Por favor, libere o microfone no ícone do cadeado ao lado da URL.');
                isListening = false;
                autoRestart = false;
                updateUIState();
            }
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (transcriptText) {
                transcriptText.textContent = interimTranscript ? `"${interimTranscript}..."` : (finalTranscript ? `"${finalTranscript}"` : '...');
            }

            if (finalTranscript.trim()) {
                processVoiceCommand(finalTranscript);
            }
        };

        // Listeners de Botões
        if (fabBtn) {
            fabBtn.addEventListener('click', () => {
                unlockAudio();
                toggleAssistant();
            });
        }
        if (headerBtn) {
            headerBtn.addEventListener('click', () => {
                unlockAudio();
                toggleAssistant();
            });
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', stopAssistant);
        }
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                isMuted = !isMuted;
                muteBtn.textContent = isMuted ? '🔇' : '🔊';
                muteBtn.title = isMuted ? 'Voz desativada (Clique para ativar)' : 'Voz ativada (Clique para silenciar)';
                if (!isMuted) speak('Voz ativada!');
            });
        }

        // Sugestões clicáveis
        document.querySelectorAll('.voice-cmd-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                unlockAudio();
                const cmd = chip.dataset.cmd || chip.textContent.replace(/"/g, '');
                processVoiceCommand(cmd);
            });
        });
    }

    function updateUIState() {
        if (!cardModal) return;

        if (isListening) {
            cardModal.classList.remove('hidden');
            if (pingDot) pingDot.classList.remove('hidden');
            if (dotIndicator) {
                dotIndicator.className = 'relative inline-flex rounded-full h-3 w-3 bg-red-500 animate-pulse';
            }
            if (statusText) {
                statusText.innerHTML = '<span class="text-red-500 font-bold">🎙️ Ouvindo...</span> Fale seu comando';
            }
            if (fabBtn) {
                fabBtn.classList.add('ring-4', 'ring-red-400', 'animate-pulse');
            }
        } else {
            if (pingDot) pingDot.classList.add('hidden');
            if (dotIndicator) {
                dotIndicator.className = 'relative inline-flex rounded-full h-3 w-3 bg-blue-500';
            }
            if (statusText) {
                statusText.innerHTML = '<span>⏸️ Pausado</span> (Clique no microfone para falar)';
            }
            if (fabBtn) {
                fabBtn.classList.remove('ring-4', 'ring-red-400', 'animate-pulse');
            }
        }
    }

    function startAssistant() {
        if (!recognition) return;
        unlockAudio();
        autoRestart = true;
        isListening = true;
        if (cardModal) cardModal.classList.remove('hidden');
        try {
            recognition.start();
        } catch(e) {
            console.log('Reconhecimento já estava ativo');
        }
        updateUIState();
        speak('Assistente pronto! Como posso ajudar?');
    }

    function stopAssistant() {
        autoRestart = false;
        isListening = false;
        conversationState = { step: null, data: {} };
        if (recognition) {
            try { recognition.stop(); } catch(e) {}
        }
        if (cardModal) cardModal.classList.add('hidden');
        updateUIState();
    }

    function toggleAssistant() {
        if (isListening) {
            stopAssistant();
        } else {
            startAssistant();
        }
    }

    // Exposição global
    window.cmvVoiceAssistant = {
        start: startAssistant,
        stop: stopAssistant,
        toggle: toggleAssistant,
        process: processVoiceCommand,
        speak: speak
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

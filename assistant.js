// ============================================================
// ASSISTENTE POR VOZ CMV.IA
// Reconhecimento de fala, interpretação de comandos e síntese
// ============================================================

(function() {
    'use strict';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isListening = false;
    let isMuted = false;
    let autoRestart = false;

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

    // Identificador de quantidades e unidades faladas
    function parsePortugueseQuantity(text) {
        const t = normalize(text);

        // Expressões especiais
        if (t.includes('meio quilo') || t.includes('meio kilo')) return { qty: 0.5, unit: 'kg' };
        if (t.includes('meio litro')) return { qty: 0.5, unit: 'l' };
        if (t.includes('um e meio') || t.includes('1 e meio') || t.includes('uma e meia')) return { qty: 1.5, unit: detectUnit(t) };
        if (t.includes('dois e meio') || t.includes('2 e meio') || t.includes('duas e meia')) return { qty: 2.5, unit: detectUnit(t) };

        let detectedUnit = detectUnit(t);

        // Busca numérica direta (ex: "200g", "200 gramas", "0.5kg")
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

        // Busca por extenso (ex: "duzentas e cinquenta gramas")
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

    // Limpa verbos e palavras de comando para sobrar apenas o nome do ingrediente
    function extractIngredientQuery(text) {
        let t = normalize(text);
        
        // Remove verbos
        t = t.replace(/\b(coloque|colocar|adicione|adicionar|bota|botar|bote|inclua|incluir|acrescente|acrescentar|insira|inserir|por|bote|adiciona)\b/g, '');
        // Remove preposições e complementos
        t = t.replace(/\b(na ficha|a ficha|no prato|na receita|por favor|pra mim|no estoque)\b/g, '');
        // Remove unidades
        t = t.replace(/\b(kg|quilos?|kilos?|g|gramas?|ml|mililitros?|litros?|l|un|unidades?|latas?|pacotes?|colheres?|xicaras?)\b/g, '');
        // Remove preposições isoladas
        t = t.replace(/\b(de|do|da|dos|das|com|em|para|pra)\b/g, '');
        // Remove números por extenso
        const numKeys = Object.keys(wordNums).concat(['meio', 'meia']);
        for (const w of numKeys) {
            t = t.replace(new RegExp('\\b' + w + '\\b', 'g'), '');
        }
        // Remove dígitos e unidades coladas
        t = t.replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|kilos?|quilos?|g|gramas?|ml|litros?|l|un|unidades?)?\b/gi, '');
        t = t.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        return t;
    }

    // Busca o melhor ingrediente ou receita base correspondente
    function findBestItemMatch(query, ingredientes, receitasSalvas) {
        const q = normalize(query);
        if (!q) return null;
        const qTokens = q.split(' ').filter(Boolean);

        let bestItem = null;
        let bestType = null;
        let bestScore = -1;

        // 1. Busca em Ingredientes
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

        // 2. Busca em Receitas Base (se houver)
        if (Array.isArray(receitasSalvas)) {
            for (const rec of receitasSalvas) {
                if (rec.type !== 'base') continue;
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

    // Síntese de voz (falar de volta)
    function speak(text) {
        if (!('speechSynthesis' in window) || isMuted) return;
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.rate = 1.05;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn('Erro na síntese de voz:', e);
        }
    }

    function showFeedback(text, isSuccess = true) {
        if (!actionBadge) return;
        actionBadge.textContent = text;
        actionBadge.className = isSuccess 
            ? 'text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 p-2 rounded-lg border border-green-200 dark:border-green-800 mt-2 block'
            : 'text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800 mt-2 block';
        actionBadge.classList.remove('hidden');
    }

    // Processador central dos comandos falados
    function processVoiceCommand(transcript) {
        const rawText = transcript.trim();
        const t = normalize(rawText);
        if (!t) return;

        if (transcriptText) {
            transcriptText.textContent = `"${rawText}"`;
        }

        console.log('[Assistente CMV.IA] Comando ouvido:', rawText);

        const app = window.cmvApp;

        // ==========================================
        // 1. COMANDOS DE NAVEGAÇÃO
        // ==========================================
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

        if (t.includes('fazer ficha') || t.includes('criar ficha') || t.includes('nova ficha') || t.includes('ficha tecnica') || t.includes('fazer receita')) {
            if (app) {
                app.limparFicha();
                app.showView('fichas');
            }
            setTimeout(() => {
                const el = document.getElementById('descricao-produto');
                if (el) el.focus();
            }, 300);
            const msg = 'Abrindo nova ficha técnica. Qual o nome do prato?';
            showFeedback('📝 ' + msg);
            speak(msg);
            return;
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

        if (t.includes('consultar ficha') || t.includes('ver ficha') || t.includes('buscar ficha') || t.includes('minhas fichas')) {
            if (app) app.showView('consultar');
            setTimeout(() => {
                const el = document.getElementById('search-fichas');
                if (el) el.focus();
            }, 300);
            const msg = 'Abrindo consulta de fichas.';
            showFeedback('🔍 ' + msg);
            speak(msg);
            return;
        }

        if (t.includes('etiqueta') || t.includes('gerar etiqueta') || t.includes('imprimir etiqueta')) {
            if (app) app.showView('etiquetas');
            const msg = 'Abrindo impressão rápida de etiquetas.';
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

        if (t.includes('venda direta') || t.includes('produtos de venda')) {
            if (app) app.showView('venda-direta');
            const msg = 'Abrindo produtos de venda direta.';
            showFeedback('🛒 ' + msg);
            speak(msg);
            return;
        }

        if (t.includes('dashboard') || t.includes('inicio') || t.includes('painel principal') || t.includes('home')) {
            if (app) app.showView('dashboard');
            const msg = 'Abrindo o painel principal.';
            showFeedback('🏠 ' + msg);
            speak(msg);
            return;
        }

        if (t.includes('tour') || t.includes('tutorial') || t.includes('ajuda') || t.includes('como usar')) {
            if (typeof window.startAppTour === 'function') {
                window.startAppTour();
                const msg = 'Iniciando tour guiado pelo sistema.';
                showFeedback('💡 ' + msg);
                speak(msg);
                return;
            }
        }

        if (t.includes('salvar prato') || t.includes('salvar ficha') || t.includes('salvar receita')) {
            const btnPrato = document.getElementById('btn-salvar-prato');
            const btnReceita = document.getElementById('btn-salvar-receita');
            if (btnPrato && !btnPrato.disabled) {
                btnPrato.click();
                const msg = 'Salvando a ficha técnica.';
                showFeedback('💾 ' + msg);
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

        // ==========================================
        // 2. NOME DO PRATO / RECEITA
        // ==========================================
        if (t.startsWith('nome do prato') || t.startsWith('nome da receita') || t.startsWith('chamar de') || t.startsWith('prato')) {
            let nomePrato = rawText.replace(/^(nome do prato|nome da receita|chamar de|prato)\s*/i, '').trim();
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

        // ==========================================
        // 3. ADIÇÃO DE INSUMOS À FICHA TÉCNICA
        // ==========================================
        // Ex: "coloque duzentas gramas de contra file"
        // Ex: "adicione meio quilo de carne moida"
        // Ex: "coloque 300 ml de leite"
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
                    const itemType = match.type; // 'ing' ou 'rec'
                    const refId = `${itemType}_${item.id}`;

                    // Conversão de unidades
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

        // Se não identificou nenhum comando específico
        const fallbackMsg = `Não entendi o comando. Tente falar por exemplo: "coloque 200g de contrafilé" ou "criar categoria".`;
        showFeedback('❓ Comando não reconhecido', false);
        speak(fallbackMsg);
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
            fabBtn.addEventListener('click', toggleAssistant);
        }
        if (headerBtn) {
            headerBtn.addEventListener('click', toggleAssistant);
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', stopAssistant);
        }
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                isMuted = !isMuted;
                muteBtn.textContent = isMuted ? '🔇' : '🔊';
                muteBtn.title = isMuted ? 'Voz desativada (Clique para ativar)' : 'Voz ativada (Clique para silenciar)';
            });
        }

        // Sugestões clicáveis
        document.querySelectorAll('.voice-cmd-chip').forEach(chip => {
            chip.addEventListener('click', () => {
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
        autoRestart = true;
        isListening = true;
        if (cardModal) cardModal.classList.remove('hidden');
        try {
            recognition.start();
        } catch(e) {
            console.log('Reconhecimento já estava ativo');
        }
        updateUIState();
    }

    function stopAssistant() {
        autoRestart = false;
        isListening = false;
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
        process: processVoiceCommand
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

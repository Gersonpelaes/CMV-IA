/**
 * CMV.IA - Sistema de Tours e Tutoriais Interativos
 * Suporta tour geral e micro-tours direcionados por tópico:
 * - 'geral': Visão completa da plataforma
 * - 'categoria': Como cadastrar categorias
 * - 'ficha': Como montar a ficha técnica e calcular custos
 * - 'preco': Onde e como atualizar preços em lote e por voz
 * - 'venda-direta': Produtos de revenda direta e margens
 * - 'etiquetas': Emissão de etiquetas térmicas no padrão ANVISA
 * - 'cmv': Conceito de CMV, metas de 28-35% e relatórios
 */

let currentActiveTour = null;

function getTourClasses() {
    return 'shadow-2xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl p-4 sm:p-5 max-w-sm sm:max-w-md border border-gray-200 dark:border-gray-700';
}

function createTourButtons(tour, isFirst = false, isLast = false) {
    const buttons = [];
    if (!isLast) {
        buttons.push({
            text: 'Pular',
            action: tour.cancel,
            classes: 'text-gray-400 hover:text-gray-600 dark:text-gray-400 mr-auto text-xs font-medium transition-colors'
        });
    }
    if (!isFirst) {
        buttons.push({
            text: '← Anterior',
            action: tour.back,
            classes: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors mr-2'
        });
    }
    if (isLast) {
        buttons.push({
            text: 'Concluir! 🎉',
            action: tour.complete,
            classes: 'bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-bold text-xs transition-colors shadow-md'
        });
    } else {
        buttons.push({
            text: 'Próximo →',
            action: tour.next,
            classes: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm'
        });
    }
    return buttons;
}

function ensureView(viewId) {
    return function() {
        // Fechar sidebar em mobile se estiver aberta
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth < 768 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
            const hamburger = document.getElementById('hamburger-btn');
            if (hamburger) hamburger.click();
        }
        // Trocar de view
        if (typeof window.cmvApp !== 'undefined' && typeof window.cmvApp.showView === 'function') {
            window.cmvApp.showView(viewId);
        } else {
            const nav = document.querySelector(`[data-view="${viewId}"]`);
            if (nav) nav.click();
        }
        return new Promise(resolve => setTimeout(resolve, 350));
    };
}

// =========================================================================
// 1. TOUR GERAL
// =========================================================================
function getGeralTourSteps(tour) {
    return [
        {
            id: 'step-welcome',
            title: 'Bem-vindo ao CMV.IA! 👋',
            text: 'O CMV.IA é o seu sistema completo de engenharia de cardápio e controle de custos. Vamos fazer um tour guiado rápido de 2 minutos para você dominar a plataforma!',
            buttons: createTourButtons(tour, true, false)
        },
        {
            id: 'step-dashboard',
            title: '1. Dashboard & Metas 📊',
            text: 'Aqui você acompanha os indicadores vitais do seu restaurante: CMV Médio geral, Margem Bruta, total de fichas ativas e alertas de custos.',
            attachTo: { element: '[data-view="dashboard"]', on: 'right' },
            beforeShowPromise: ensureView('dashboard'),
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'step-settings',
            title: '2. Configurações & Categorias ⚙️',
            text: 'Defina os dados do seu restaurante, organize categorias de insumos e pratos, e gere links de acesso compartilháveis para seus colaboradores.',
            attachTo: { element: '[data-view="settings"]', on: 'right' },
            beforeShowPromise: ensureView('settings'),
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'step-ingredients',
            title: '3. Banco de Ingredientes 🍅',
            text: 'A espinha dorsal do seu custo! Cadastre seus insumos de compra, use o botão "Gerar Inteligente" para puxar mais de 100 itens da tabela TACO, e atualize preços em lote.',
            attachTo: { element: '[data-view="ingredientes"]', on: 'right' },
            beforeShowPromise: ensureView('ingredientes'),
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'step-fichas',
            title: '4. Fichas Técnicas Gerenciais 📝',
            text: 'Onde a lucratividade é calculada! Crie receitas, informe rendimento e porções, adicione insumos com perdas (fator de correção), defina o markup e emita PDFs profissionais.',
            attachTo: { element: '[data-view="fichas"]', on: 'right' },
            beforeShowPromise: ensureView('fichas'),
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'step-venda-direta',
            title: '5. Produtos de Venda Direta 🛒',
            text: 'Controle itens que você compra prontos para revender (refrigerantes em lata, águas, doces terceirizados). Calcule a margem percentual e o CMV exato.',
            attachTo: { element: '[data-view="venda-direta"]', on: 'right' },
            beforeShowPromise: ensureView('venda-direta'),
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'step-etiquetas',
            title: '6. Impressão de Etiquetas ANVISA 🏷️',
            text: 'Emita etiquetas térmicas em segundos com prazos automáticos de resfriado, congelado ou seco, código de lote rastreável e tabela nutricional.',
            attachTo: { element: '[data-view="etiquetas"]', on: 'right' },
            beforeShowPromise: ensureView('etiquetas'),
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'step-voice',
            title: '7. Assistente por Voz CMV.IA 🎙️',
            text: 'O seu braço direito inteligente! Clique no botão flutuante ou dite comandos como "fazer ficha de parmegiana", "atualizar preço do arroz" ou faça perguntas como "como montar a ficha"!',
            attachTo: { element: '#btn-fab-voice', on: 'left' },
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'step-finish',
            title: 'Tour Concluído! 🎉',
            text: 'Você já conhece todos os módulos! Comece abastecendo seus ingredientes ou fale com a IA para tirar dúvidas a qualquer momento.',
            buttons: createTourButtons(tour, false, true)
        }
    ];
}

// =========================================================================
// 2. TUTORIAL: COMO CADASTRAR CATEGORIAS
// =========================================================================
function getCategoriaTourSteps(tour) {
    return [
        {
            id: 'cat-intro',
            title: 'Como Cadastrar Categorias 📁',
            text: 'As categorias organizam seu estoque, cardápio e relatórios de lucratividade. O CMV.IA organiza as categorias em 4 blocos dedicados.',
            beforeShowPromise: ensureView('settings'),
            buttons: createTourButtons(tour, true, false)
        },
        {
            id: 'cat-ingredientes',
            title: '1. Categorias de Ingredientes 🍅',
            text: 'Usadas no Banco de Ingredientes (ex: CARNES, LATICÍNIOS, HORTIFRUTI, MERCEARIA, EMBALAGENS). Digite o nome no campo e clique em "Add".',
            attachTo: { element: '#form-cat-ingrediente', on: 'bottom' },
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'cat-venda',
            title: '2. Categorias de Produtos de Venda 🥤',
            text: 'Usadas para classificar produtos prontos de revenda (ex: REFRIGERANTES, CERVEJAS, SOBREMESAS).',
            attachTo: { element: '#form-cat-venda', on: 'bottom' },
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'cat-pratos',
            title: '3. Categorias de Pratos Finais 🍽️',
            text: 'Usadas para pratos servidos aos clientes no salão ou delivery (ex: BURGERS, MASSAS, EXECUTIVOS, PIZZAS).',
            attachTo: { element: '#form-cat-prato', on: 'bottom' },
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'cat-bases',
            title: '4. Categorias de Receitas Base 🍲',
            text: 'Usadas para preparações intermediárias da cozinha (ex: MOLHOS, CALDOS, MASSAS FRESCAS, RECHEIOS).',
            attachTo: { element: '#form-cat-base', on: 'bottom' },
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'cat-auto',
            title: 'Atalho Inteligente (Auto-Categorização) ⚡',
            text: 'Dica de ouro: clique no botão "Auto" ao lado de Ingredientes para criar automaticamente as categorias mais usadas na gastronomia!',
            attachTo: { element: '#btn-auto-cat-ingredientes', on: 'bottom' },
            buttons: createTourButtons(tour, false, true)
        }
    ];
}

// =========================================================================
// 3. TUTORIAL: COMO MONTAR FICHA TÉCNICA
// =========================================================================
function getFichaTourSteps(tour) {
    return [
        {
            id: 'ficha-nome',
            title: 'Passo 1: Nome e Categoria 📋',
            text: 'Defina o nome da sua preparação (ex: STROGONOFF DE FRANGO) e selecione a categoria correspondente. Você também pode carregar uma foto do prato!',
            beforeShowPromise: ensureView('fichas'),
            attachTo: { element: '#descricao-produto', on: 'bottom' },
            buttons: createTourButtons(tour, true, false)
        },
        {
            id: 'ficha-rendimento',
            title: 'Passo 2: Rendimento e Porção ⚖️',
            text: 'Dois dados essenciais:<br>• <strong>Rendimento da Receita (kg)</strong>: quanto a receita rende pronta (peso total da panela).<br>• <strong>Tamanho da Porção (g)</strong>: o peso servido no prato do cliente.',
            attachTo: { element: '#rendimento-receita-kg', on: 'bottom' },
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'ficha-insumos',
            title: 'Passo 3: Adicionar Insumos e FC 🥩',
            text: 'Busque qualquer ingrediente ou sub-receita. Informe a <strong>Quantidade Líquida</strong> consumida e confira o <strong>Fator de Correção (FC)</strong> para cobrir perdas de limpeza e aparas!',
            attachTo: { element: '#busca-ingrediente', on: 'bottom' },
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'ficha-custos',
            title: 'Passo 4: Custos e Preço de Venda 💰',
            text: 'O sistema calcula o Custo Total e o Custo por Porção. No campo <strong>Markup</strong>, defina seu multiplicador (ex: 3.0 = 300%) para ver o <strong>Preço Sugerido</strong> e a margem bruta!',
            attachTo: { element: '#custo-total-receita', on: 'top' },
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'ficha-pdf',
            title: 'Passo 5: PDFs, Impressão e Etiquetas 🖨️',
            text: 'Gere o <strong>PDF Custo</strong> para controle gerencial, o <strong>PDF Operacional</strong> (sem valores) para a equipe da cozinha preparar, imprima diretamente ou emita a Etiqueta de Validade.',
            attachTo: { element: '#btn-pdf-custo-ficha', on: 'bottom' },
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'ficha-salvar',
            title: 'Passo 6: Salvar a Ficha 💾',
            text: 'Clique em "Salvar Prato" para pratos finais do cardápio, ou "Salvar Receita" para molhos e bases que serão usados dentro de outras fichas!',
            attachTo: { element: '#btn-salvar-prato', on: 'top' },
            buttons: createTourButtons(tour, false, true)
        }
    ];
}

// =========================================================================
// 4. TUTORIAL: ONDE E COMO ATUALIZAR PREÇOS
// =========================================================================
function getPrecoTourSteps(tour) {
    return [
        {
            id: 'preco-intro',
            title: 'Onde Ficam os Preços? 🍅',
            text: 'Todos os preços de matéria-prima ficam centralizados no Banco de Ingredientes. Quando os custos dos insumos mudam, todas as suas fichas técnicas são recalculadas automaticamente!',
            beforeShowPromise: ensureView('ingredientes'),
            attachTo: { element: '#lista-ingredientes', on: 'top' },
            buttons: createTourButtons(tour, true, false)
        },
        {
            id: 'preco-lote-btn',
            title: 'Atualização de Preços em Lote 💰',
            text: 'Ao receber compras de fornecedores, clique no botão "Atualizar Preços" para abrir a planilha rápida de cotação de insumos.',
            attachTo: { element: '#btn-abrir-atualizar-precos', on: 'bottom' },
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'preco-painel',
            title: 'Edite os Valores e Salve ⚡',
            text: 'Digite os novos valores pagos nas embalagens e clique em "Salvar". O CMV.IA propaga os novos custos em cascata para todas as fichas técnicas salvas na hora!',
            beforeShowPromise: function() {
                const painel = document.getElementById('painel-atualizar-precos');
                if (painel && (painel.classList.contains('hidden') || painel.style.display === 'none')) {
                    const btn = document.getElementById('btn-abrir-atualizar-precos');
                    if (btn) btn.click();
                }
                return new Promise(resolve => setTimeout(resolve, 350));
            },
            attachTo: { element: '#painel-atualizar-precos', on: 'top' },
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'preco-voz',
            title: 'Atalho Ninja: Atualize por Voz 🎙️',
            text: 'Você também pode apenas falar para o assistente:<br><em>"atualizar preço do queijo para 42 reais"</em> ou <em>"mudar preço do filé"</em>.<br>A IA faz o cálculo e salva sem você precisar digitar nada!',
            attachTo: { element: '#btn-fab-voice', on: 'left' },
            buttons: createTourButtons(tour, false, true)
        }
    ];
}

// =========================================================================
// 5. TUTORIAL: PRODUTOS DE VENDA DIRETA
// =========================================================================
function getVendaDiretaTourSteps(tour) {
    return [
        {
            id: 'venda-intro',
            title: 'O que é Venda Direta? 🥤',
            text: 'São produtos que você adquire prontos para comercializar aos clientes sem preparo na cozinha (ex: refrigerantes em lata, sucos de garrafa, cervejas, sobremesas prontas).',
            beforeShowPromise: ensureView('venda-direta'),
            attachTo: { element: '#form-produto-venda', on: 'bottom' },
            buttons: createTourButtons(tour, true, false)
        },
        {
            id: 'venda-precos',
            title: 'Preço de Compra vs Preço de Venda 🏷️',
            text: 'Informe quanto você pagou no item e quanto cobra do cliente. O CMV percentual e a margem bruta de lucro em reais são calculados instantaneamente!',
            attachTo: { element: '#preco-compra-venda', on: 'bottom' },
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'venda-lista',
            title: 'Gestão de Produtos Cadastrados 📦',
            text: 'Aqui você pesquisa, edita e filtra seus produtos. Dica: você também pode cadastrar por voz dizendo <em>"cadastrar coca-cola lata 350ml"</em>!',
            attachTo: { element: '#lista-produtos-venda', on: 'top' },
            buttons: createTourButtons(tour, false, true)
        }
    ];
}

// =========================================================================
// 6. TUTORIAL: ETIQUETAS TÉRMICAS ANVISA
// =========================================================================
function getEtiquetasTourSteps(tour) {
    return [
        {
            id: 'etq-intro',
            title: 'Impressão Rápida de Etiquetas 🏷️',
            text: 'Emita etiquetas de identificação e rastreabilidade para fracionados, manipulados e embalagens delivery conforme exigências da vigilância sanitária.',
            beforeShowPromise: ensureView('etiquetas'),
            attachTo: { element: '#search-etiquetas', on: 'bottom' },
            buttons: createTourButtons(tour, true, false)
        },
        {
            id: 'etq-regras',
            title: 'Prazos de Conservação Automáticos ❄️',
            text: 'Selecione o tipo de armazenamento:<br>• <strong>Resfriado</strong>: 0° a 4°C (+3 dias)<br>• <strong>Congelado</strong>: -18°C (+90 dias)<br>• <strong>Seco/Ambiente</strong>: (+180 dias)<br>• <strong>Descongelado</strong>: (+24 horas)<br>O sistema calcula as datas automaticamente!',
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'etq-dados',
            title: 'Rastreabilidade e Informação Nutricional 📋',
            text: 'A etiqueta é gerada com lote rastreável único, nome do responsável técnico, avisos de alergênicos e tabela nutricional calculada da ficha!',
            buttons: createTourButtons(tour, false, true)
        }
    ];
}

// =========================================================================
// 7. TUTORIAL: CONCEITO E METAS DE CMV
// =========================================================================
function getCMVTourSteps(tour) {
    return [
        {
            id: 'cmv-intro',
            title: 'O que é o CMV? 📈',
            text: 'CMV significa <strong>Custo da Mercadoria Vendida</strong>. É a porcentagem do seu faturamento consumida pela compra de insumos e matérias-primas de alimentos e bebidas.',
            beforeShowPromise: ensureView('dashboard'),
            attachTo: { element: '[data-view="dashboard"]', on: 'right' },
            buttons: createTourButtons(tour, true, false)
        },
        {
            id: 'cmv-meta',
            title: 'Qual a Meta Ideal de CMV? 🎯',
            text: 'Na gastronomia e delivery, a meta recomendada de CMV gira entre <strong>28% e 35%</strong>.<br>• CMV &lt; 28%: Excelente lucratividade.<br>• CMV entre 28% e 35%: Faixa ideal.<br>• CMV &gt; 40%: Risco de prejuízo operacional.',
            buttons: createTourButtons(tour, false, false)
        },
        {
            id: 'cmv-analise',
            title: 'Análise de Custos e Engenharia de Cardápio 💡',
            text: 'Acesse a tela "Análise de Custos" para visualizar a curva de custo de cada prato, identificando os itens mais rentáveis e onde você pode otimizar margens!',
            attachTo: { element: '[data-view="analise"]', on: 'right' },
            buttons: createTourButtons(tour, false, true)
        }
    ];
}

// =========================================================================
// CONTROLADOR PRINCIPAL
// =========================================================================
function startAppTour(type = 'geral') {
    if (typeof Shepherd === 'undefined') {
        console.warn('Shepherd.js não está carregado.');
        return;
    }

    if (currentActiveTour) {
        try { currentActiveTour.cancel(); } catch(e) {}
        currentActiveTour = null;
    }

    // Minimiza o card do assistente de voz se estiver aberto para não cobrir o tour
    const voiceCard = document.getElementById('voice-assistant-card');
    if (voiceCard) voiceCard.classList.add('hidden');

    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            cancelIcon: { enabled: true },
            classes: getTourClasses(),
            scrollTo: { behavior: 'smooth', block: 'center' }
        }
    });

    currentActiveTour = tour;

    const t = (type || 'geral').toLowerCase().trim();
    let steps = [];

    if (t.includes('cat')) {
        steps = getCategoriaTourSteps(tour);
    } else if (t.includes('fich') || t.includes('receit') || t.includes('prato')) {
        steps = getFichaTourSteps(tour);
    } else if (t.includes('prec') || t.includes('cust') || t.includes('ingred')) {
        steps = getPrecoTourSteps(tour);
    } else if (t.includes('venda') || t.includes('revend')) {
        steps = getVendaDiretaTourSteps(tour);
    } else if (t.includes('etiqueta')) {
        steps = getEtiquetasTourSteps(tour);
    } else if (t.includes('cmv') || t.includes('analis') || t.includes('margem')) {
        steps = getCMVTourSteps(tour);
    } else {
        steps = getGeralTourSteps(tour);
    }

    tour.addSteps(steps);
    tour.start();
}

// Exposição global
window.startAppTour = startAppTour;
window.startTourCategoria = () => startAppTour('categoria');
window.startTourFicha = () => startAppTour('ficha');
window.startTourPreco = () => startAppTour('preco');
window.startTourVendaDireta = () => startAppTour('venda-direta');
window.startTourEtiquetas = () => startAppTour('etiquetas');
window.startTourCMV = () => startAppTour('cmv');

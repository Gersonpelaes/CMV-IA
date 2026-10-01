function startAppTour() {
    // Esconder sidebar em telas pequenas se estiver aberta
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth < 768 && !sidebar.classList.contains('-translate-x-full')) {
        document.getElementById('hamburger-btn').click();
    }

    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            cancelIcon: { enabled: true },
            classes: 'shadow-md bg-white text-gray-800 rounded-lg p-4 max-w-sm',
            scrollTo: { behavior: 'smooth', block: 'center' }
        }
    });

    const steps = [
        {
            id: 'step-welcome',
            title: 'Bem-vindo ao CMV.IA! 👋',
            text: 'Este é o seu novo assistente de gestão inteligente. Vamos fazer um tour rápido de 2 minutos para você dominar o sistema!',
            buttons: [
                { text: 'Pular', action: tour.cancel, classes: 'text-gray-500 hover:text-gray-700 mr-4 font-semibold' },
                { text: 'Começar', action: tour.next, classes: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold transition-colors' }
            ]
        },
        {
            id: 'step-settings',
            title: '1. Configurações Iniciais ⚙️',
            text: 'Aqui você cadastra os dados do seu Restaurante (nome, logo) e organiza as categorias dos produtos. É o primeiro passo para deixar tudo com a sua cara.',
            attachTo: { element: '[data-view="settings"]', on: 'right' },
            beforeShowPromise: function() {
                document.querySelector('[data-view="settings"]').click();
                return new Promise(resolve => setTimeout(resolve, 300));
            },
            buttons: [
                { text: 'Anterior', action: tour.back, classes: 'text-gray-500 hover:text-gray-700 mr-4 font-semibold' },
                { text: 'Próximo', action: tour.next, classes: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold transition-colors' }
            ]
        },
        {
            id: 'step-ingredients',
            title: '2. Banco de Ingredientes 🍅',
            text: 'A base do CMV! Cadastre seus insumos, insira o preço e o fator de correção. Quer um atalho? Use o botão "Gerar Inteligente" no topo da tela para puxar 100 ingredientes prontos com valores nutricionais!',
            attachTo: { element: '[data-view="ingredientes"]', on: 'right' },
            beforeShowPromise: function() {
                document.querySelector('[data-view="ingredientes"]').click();
                return new Promise(resolve => setTimeout(resolve, 300));
            },
            buttons: [
                { text: 'Anterior', action: tour.back, classes: 'text-gray-500 hover:text-gray-700 mr-4 font-semibold' },
                { text: 'Próximo', action: tour.next, classes: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold transition-colors' }
            ]
        },
        {
            id: 'step-fichas',
            title: '3. Fichas Técnicas 📝',
            text: 'É aqui que a mágica acontece. Crie receitas, adicione os ingredientes e veja o custo real do seu prato. O sistema até sugere o Preço de Venda ideal e gera a Tabela Nutricional!',
            attachTo: { element: '[data-view="fichas"]', on: 'right' },
            beforeShowPromise: function() {
                document.querySelector('[data-view="fichas"]').click();
                return new Promise(resolve => setTimeout(resolve, 300));
            },
            buttons: [
                { text: 'Anterior', action: tour.back, classes: 'text-gray-500 hover:text-gray-700 mr-4 font-semibold' },
                { text: 'Próximo', action: tour.next, classes: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold transition-colors' }
            ]
        },
        {
            id: 'step-consultar',
            title: '4. Consultar e Imprimir 🖨️',
            text: 'Visualize as fichas criadas, imprima PDFs profissionais para a sua cozinha ou gere Etiquetas Térmicas para embalagens de delivery em um clique!',
            attachTo: { element: '[data-view="consultar"]', on: 'right' },
            beforeShowPromise: function() {
                document.querySelector('[data-view="consultar"]').click();
                return new Promise(resolve => setTimeout(resolve, 300));
            },
            buttons: [
                { text: 'Anterior', action: tour.back, classes: 'text-gray-500 hover:text-gray-700 mr-4 font-semibold' },
                { text: 'Próximo', action: tour.next, classes: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold transition-colors' }
            ]
        },
        {
            id: 'step-finish',
            title: 'Tudo pronto! 🎉',
            text: 'Você já sabe onde encontrar tudo. Comece clicando em "Banco de Ingredientes" para abastecer seu estoque!',
            buttons: [
                { text: 'Começar a usar!', action: tour.complete, classes: 'bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold transition-colors w-full' }
            ]
        }
    ];

    tour.addSteps(steps);
    tour.start();
}

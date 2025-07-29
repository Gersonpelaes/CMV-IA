// Define o nome do cache
const CACHE_NAME = 'cmv-ia-cache-v1';

// Lista de ficheiros a serem guardados em cache
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js'
];

// Evento de instalação: abre o cache e adiciona os ficheiros
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de fetch: responde com os dados do cache se disponíveis
self.addEventListener('fetch', event => {
  // Ignora pedidos que não são GET (ex: POST para o Firebase)
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignora pedidos para o Firebase e APIs da Google para garantir que os dados estão sempre atualizados
  if (event.request.url.includes('firebase') || event.request.url.includes('googleapis')) {
     return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se o recurso estiver no cache, retorna-o
        if (response) {
          return response;
        }
        // Caso contrário, busca na rede
        return fetch(event.request);
      }
    )
  );
});

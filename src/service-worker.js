/* eslint-disable no-restricted-globals */

// Service Worker otimizado para sistema de fotos
// Implementa cache inteligente com múltiplas estratégias

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { 
  StaleWhileRevalidate, 
  CacheFirst, 
  NetworkFirst,
  NetworkOnly 
} from 'workbox-strategies';

clientsClaim();

// Precache dos assets estáticos
precacheAndRoute(self.__WB_MANIFEST);

// Configurações de cache
const CACHE_NAMES = {
  IMAGES: 'foto-images-v2',
  THUMBNAILS: 'foto-thumbnails-v2',
  API_CACHE: 'foto-api-v2',
  STATIC: 'foto-static-v2',
  RUNTIME: 'foto-runtime-v2'
};

const CACHE_CONFIGS = {
  images: {
    maxEntries: 200,
    maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
  },
  thumbnails: {
    maxEntries: 500,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
  },
  api: {
    maxEntries: 100,
    maxAgeSeconds: 60 * 60, // 1 hora
  },
  static: {
    maxEntries: 50,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
  }
};

// === ESTRATÉGIAS DE CACHE PARA IMAGENS ===

// Cache agressivo para imagens do MinIO (fotos grandes)
registerRoute(
  ({ url }) => {
    // Detecta URLs do MinIO
    return url.hostname.includes('minio') || 
           url.pathname.includes('.jpg') || 
           url.pathname.includes('.jpeg') || 
           url.pathname.includes('.png') || 
           url.pathname.includes('.webp');
  },
  new CacheFirst({
    cacheName: CACHE_NAMES.IMAGES,
    plugins: [
      new ExpirationPlugin(CACHE_CONFIGS.images),
      {
        // Plugin personalizado para otimização
        cacheKeyWillBeUsed: async ({ request }) => {
          // Remove query params desnecessários para melhor cache hit
          const url = new URL(request.url);
          // Mantém apenas parâmetros essenciais
          const essentialParams = ['v', 'version', 'size'];
          const newUrl = new URL(url.origin + url.pathname);
          
          essentialParams.forEach(param => {
            if (url.searchParams.has(param)) {
              newUrl.searchParams.set(param, url.searchParams.get(param));
            }
          });
          
          return newUrl.toString();
        },
        cacheWillUpdate: async ({ request, response }) => {
          // Só cache respostas válidas
          return response.status === 200;
        },
        cachedResponseWillBeUsed: async ({ cachedResponse, request }) => {
          // Log para debug
          if (cachedResponse) {
            console.log('[SW] Imagem servida do cache:', request.url);
          }
          return cachedResponse;
        }
      }
    ],
  })
);

// Cache específico para thumbnails (pequenas e mais frequentes)
registerRoute(
  ({ url, request }) => {
    return url.pathname.includes('thumbnail') || 
           request.url.includes('count=') ||
           (url.pathname.includes('fotos') && request.url.includes('limit=6'));
  },
  new CacheFirst({
    cacheName: CACHE_NAMES.THUMBNAILS,
    plugins: [
      new ExpirationPlugin(CACHE_CONFIGS.thumbnails),
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          const url = new URL(request.url);
          // Para thumbnails, inclui parâmetros de tamanho
          const thumbParams = ['count', 'size', 'limit'];
          const newUrl = new URL(url.origin + url.pathname);
          
          thumbParams.forEach(param => {
            if (url.searchParams.has(param)) {
              newUrl.searchParams.set(param, url.searchParams.get(param));
            }
          });
          
          return newUrl.toString();
        }
      }
    ],
  })
);

// === ESTRATÉGIAS PARA APIs ===

// Cache inteligente para APIs de listagem (eventos, coreografias)
registerRoute(
  ({ url }) => {
    return url.pathname.includes('/api/photos/eventos') ||
           url.pathname.includes('/api/photos/estrutura') ||
           url.pathname.includes('/api/photos/batch');
  },
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.API_CACHE,
    plugins: [
      new ExpirationPlugin(CACHE_CONFIGS.api),
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          const url = new URL(request.url);
          // Normaliza URLs da API para melhor cache
          return url.pathname + url.search;
        },
        cachedResponseWillBeUsed: async ({ cachedResponse, request }) => {
          if (cachedResponse) {
            console.log('[SW] API servida do cache:', request.url);
          }
          return cachedResponse;
        }
      }
    ],
  })
);

// NetworkFirst para APIs críticas (busca por selfie, upload)
registerRoute(
  ({ url }) => {
    return url.pathname.includes('/api/fotos/buscar-por-selfie') ||
           url.pathname.includes('/api/usuarios/enviar-pedido') ||
           url.pathname.includes('/api/admin/');
  },
  new NetworkFirst({
    cacheName: CACHE_NAMES.API_CACHE,
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 5 * 60 }), // 5 min
    ],
  })
);

// NetworkOnly para autenticação e operações críticas
registerRoute(
  ({ url }) => {
    return url.pathname.includes('/api/usuarios/login') ||
           url.pathname.includes('/api/usuarios/register') ||
           url.pathname.includes('/api/usuarios/google-login');
  },
  new NetworkOnly()
);

// === CACHE PARA ASSETS ESTÁTICOS ===

// Cache agressivo para assets do app
registerRoute(
  ({ request }) => {
    return request.destination === 'style' ||
           request.destination === 'script' ||
           request.destination === 'font';
  },
  new CacheFirst({
    cacheName: CACHE_NAMES.STATIC,
    plugins: [
      new ExpirationPlugin(CACHE_CONFIGS.static),
    ],
  })
);

// === NAVEGAÇÃO E FALLBACKS ===

// App Shell para navegação SPA
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  ({ request, url }) => {
    if (request.mode !== 'navigate') return false;
    if (url.pathname.startsWith('/_')) return false;
    if (url.pathname.match(fileExtensionRegexp)) return false;
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// === BACKGROUND SYNC PARA OPERAÇÕES OFFLINE ===

// Registra background sync para operações críticas
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-cache-warmup') {
    event.waitUntil(warmupCache());
  }
  
  if (event.tag === 'upload-pending-orders') {
    event.waitUntil(uploadPendingOrders());
  }
});

// Função para pré-aquecimento do cache
async function warmupCache() {
  try {
    console.log('[SW] Iniciando warmup do cache...');
    
    // Cache eventos principais
    const eventosResponse = await fetch('/api/photos/eventos');
    if (eventosResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.API_CACHE);
      await cache.put('/api/photos/eventos', eventosResponse.clone());
    }
    
    console.log('[SW] Warmup concluído');
  } catch (error) {
    console.error('[SW] Erro no warmup:', error);
  }
}

// Função para upload de pedidos pendentes (offline)
async function uploadPendingOrders() {
  try {
    // Busca pedidos salvos no IndexedDB/localStorage
    const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
    
    for (const order of pendingOrders) {
      try {
        const response = await fetch('/api/usuarios/enviar-pedido-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
        
        if (response.ok) {
          // Remove pedido da lista pendente
          const updatedOrders = pendingOrders.filter(o => o.id !== order.id);
          localStorage.setItem('pendingOrders', JSON.stringify(updatedOrders));
        }
      } catch (err) {
        console.log('[SW] Pedido ainda pendente:', order.id);
      }
    }
  } catch (error) {
    console.error('[SW] Erro no upload de pedidos pendentes:', error);
  }
}

// === GERENCIAMENTO DE CACHE ===

// Limpeza automática de caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => {
        return Object.values(CACHE_NAMES).includes(name.split('-v')[0] + '-v1');
      });
      
      await Promise.all(
        oldCaches.map(cacheName => {
          console.log('[SW] Removendo cache antigo:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })()
  );
});

// === MENSAGENS DA APLICAÇÃO ===

self.addEventListener('message', event => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0]?.postMessage(stats);
      });
      break;
      
    case 'CLEAR_CACHE':
      clearCache(payload?.cacheType).then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;
      
    case 'PRELOAD_IMAGES':
      preloadImages(payload?.urls || []).then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;
      
    case 'WARMUP_CACHE':
      warmupCache().then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;
  }
});

// === FUNÇÕES AUXILIARES ===

async function getCacheStats() {
  const stats = {};
  
  for (const [key, cacheName] of Object.entries(CACHE_NAMES)) {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      stats[key.toLowerCase()] = {
        entries: keys.length,
        cacheName
      };
    } catch (error) {
      stats[key.toLowerCase()] = { entries: 0, error: error.message };
    }
  }
  
  return stats;
}

async function clearCache(cacheType) {
  if (cacheType && CACHE_NAMES[cacheType.toUpperCase()]) {
    await caches.delete(CACHE_NAMES[cacheType.toUpperCase()]);
  } else {
    // Limpa todos os caches
    await Promise.all(
      Object.values(CACHE_NAMES).map(cacheName => caches.delete(cacheName))
    );
  }
}

async function preloadImages(urls) {
  const cache = await caches.open(CACHE_NAMES.IMAGES);
  
  await Promise.all(
    urls.slice(0, 10).map(async url => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.log('[SW] Erro ao pré-carregar imagem:', url);
      }
    })
  );
}

// === OFFLINE FALLBACK ===

// Fallback para quando estiver offline
self.addEventListener('fetch', event => {
  // Se for uma imagem e estivermos offline, tenta buscar no cache
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          return response;
        }
        
        // Fallback para imagem placeholder
        return caches.match('/img/sem_capa.jpg') || 
               new Response('', { status: 404 });
      })
    );
  }
});

console.log('[SW] Service Worker otimizado carregado com cache inteligente');

// Log das configurações
console.log('[SW] Configurações de cache:', {
  cacheNames: CACHE_NAMES,
  configs: CACHE_CONFIGS
});

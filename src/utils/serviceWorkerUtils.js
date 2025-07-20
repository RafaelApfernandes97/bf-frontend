// Utilitários para comunicação com Service Worker
// Gerencia cache offline e operações em background

class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isOnline = navigator.onLine;
    this.setupOnlineListener();
  }

  // Configura listener para mudanças de conectividade
  setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Conectado - sincronizando dados...');
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Offline - usando cache local');
    });
  }

  // Registra o service worker
  async register() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('✅ Service Worker registrado:', this.registration);
        
        // Configura listeners para mensagens
        this.setupMessageListener();
        
        return this.registration;
      } catch (error) {
        console.error('❌ Erro ao registrar Service Worker:', error);
        return null;
      }
    }
    return null;
  }

  // Configura listener para mensagens do SW
  setupMessageListener() {
    navigator.serviceWorker.addEventListener('message', event => {
      const { type, data } = event.data || {};
      
      switch (type) {
        case 'CACHE_UPDATED':
          console.log('📦 Cache atualizado:', data);
          this.dispatchEvent('cacheUpdated', data);
          break;
          
        case 'SYNC_COMPLETE':
          console.log('🔄 Sincronização completa:', data);
          this.dispatchEvent('syncComplete', data);
          break;
          
        case 'OFFLINE_READY':
          console.log('📴 Aplicação pronta para uso offline');
          this.dispatchEvent('offlineReady', {});
          break;
      }
    });
  }

  // Envia mensagem para o service worker
  async sendMessage(type, payload = {}) {
    if (!this.registration?.active) {
      console.warn('Service Worker não ativo');
      return null;
    }

    return new Promise(resolve => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = event => {
        resolve(event.data);
      };
      
      this.registration.active.postMessage(
        { type, payload },
        [messageChannel.port2]
      );
    });
  }

  // Obtém estatísticas do cache
  async getCacheStats() {
    return await this.sendMessage('CACHE_STATS');
  }

  // Limpa cache específico ou todos
  async clearCache(cacheType = null) {
    return await this.sendMessage('CLEAR_CACHE', { cacheType });
  }

  // Pré-carrega imagens específicas
  async preloadImages(urls) {
    return await this.sendMessage('PRELOAD_IMAGES', { urls });
  }

  // Aquece o cache com dados essenciais
  async warmupCache() {
    return await this.sendMessage('WARMUP_CACHE');
  }

  // Sincroniza dados pendentes
  async syncPendingData() {
    if (!this.isOnline) return;

    try {
      // Registra background sync para upload de pedidos pendentes
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('upload-pending-orders');
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
    }
  }

  // Salva pedido para sincronização offline
  savePendingOrder(orderData) {
    const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
    
    const order = {
      ...orderData,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      synced: false
    };
    
    pendingOrders.push(order);
    localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));
    
    console.log('📦 Pedido salvo para sincronização offline:', order.id);
    
    // Tenta sincronizar imediatamente se online
    if (this.isOnline) {
      this.syncPendingData();
    }
    
    return order;
  }

  // Obtém pedidos pendentes
  getPendingOrders() {
    return JSON.parse(localStorage.getItem('pendingOrders') || '[]');
  }

  // Remove pedido da lista pendente
  removePendingOrder(orderId) {
    const pendingOrders = this.getPendingOrders();
    const updatedOrders = pendingOrders.filter(order => order.id !== orderId);
    localStorage.setItem('pendingOrders', JSON.stringify(updatedOrders));
  }

  // Verifica se há dados em cache para uma URL
  async isDataCached(url) {
    if (!('caches' in window)) return false;
    
    try {
      const cache = await caches.open('foto-api-v2');
      const response = await cache.match(url);
      return !!response;
    } catch (error) {
      return false;
    }
  }

  // Estratégia de fallback para imagens
  getImageFallback(originalUrl) {
    // Se a imagem falhar, tenta versões alternativas
    const fallbacks = [
      originalUrl,
      originalUrl.replace(/\.[^.]+$/, '.webp'), // Tenta webp
      originalUrl.replace(/\.[^.]+$/, '.jpg'),  // Tenta jpg
      '/img/sem_capa.jpg' // Fallback final
    ];
    
    return fallbacks;
  }

  // Monitora performance do cache
  startCacheMonitoring() {
    setInterval(async () => {
      const stats = await this.getCacheStats();
      
      if (stats) {
        const totalEntries = Object.values(stats).reduce((total, cache) => {
          return total + (cache.entries || 0);
        }, 0);
        
        console.log(`📊 Cache Status: ${totalEntries} entradas total`);
        
        // Dispara evento de estatísticas
        this.dispatchEvent('cacheStats', stats);
      }
    }, 5 * 60 * 1000); // A cada 5 minutos
  }

  // Sistema de eventos customizado
  dispatchEvent(eventName, data) {
    const event = new CustomEvent(`sw:${eventName}`, { detail: data });
    window.dispatchEvent(event);
  }

  // Listener para eventos do SW
  addEventListener(eventName, callback) {
    window.addEventListener(`sw:${eventName}`, callback);
  }

  removeEventListener(eventName, callback) {
    window.removeEventListener(`sw:${eventName}`, callback);
  }
}

// Instância singleton
const swManager = new ServiceWorkerManager();

// Utilitários para componentes React
export const useServiceWorker = () => {
  return {
    getCacheStats: () => swManager.getCacheStats(),
    clearCache: (type) => swManager.clearCache(type),
    preloadImages: (urls) => swManager.preloadImages(urls),
    warmupCache: () => swManager.warmupCache(),
    isOnline: swManager.isOnline,
    savePendingOrder: (order) => swManager.savePendingOrder(order),
    getPendingOrders: () => swManager.getPendingOrders(),
    isDataCached: (url) => swManager.isDataCached(url),
    addEventListener: (event, callback) => swManager.addEventListener(event, callback),
    removeEventListener: (event, callback) => swManager.removeEventListener(event, callback)
  };
};

// Hook para cache de imagens
export const useImageCache = () => {
  const preloadImages = async (urls) => {
    await swManager.preloadImages(urls);
  };

  const getCachedImageUrl = async (originalUrl) => {
    if (await swManager.isDataCached(originalUrl)) {
      return originalUrl;
    }
    
    // Tenta fallbacks
    const fallbacks = swManager.getImageFallback(originalUrl);
    
    for (const fallback of fallbacks) {
      if (await swManager.isDataCached(fallback)) {
        return fallback;
      }
    }
    
    return originalUrl; // Retorna original se nada está em cache
  };

  return {
    preloadImages,
    getCachedImageUrl,
    isOnline: swManager.isOnline
  };
};

// Hook para pedidos offline
export const useOfflineOrders = () => {
  const savePendingOrder = (orderData) => {
    return swManager.savePendingOrder(orderData);
  };

  const getPendingOrders = () => {
    return swManager.getPendingOrders();
  };

  const syncPendingOrders = () => {
    swManager.syncPendingData();
  };

  return {
    savePendingOrder,
    getPendingOrders,
    syncPendingOrders,
    isOnline: swManager.isOnline
  };
};

// Inicializa o service worker automaticamente
if (typeof window !== 'undefined') {
  swManager.register().then(() => {
    swManager.startCacheMonitoring();
  });
}

export default swManager; 
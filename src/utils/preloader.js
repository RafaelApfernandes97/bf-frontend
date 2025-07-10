// Utilitário para pré-carregamento de dados
const BACKEND_URL = 'https://backend.oballetemfoco.com';

class DataPreloader {
  constructor() {
    this.preloadedData = new Map();
    this.preloadingPromises = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // Pré-carrega dados de eventos
  async preloadEventos() {
    const cacheKey = 'eventos';
    
    if (this.preloadedData.has(cacheKey)) {
      const cached = this.preloadedData.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/eventos`);
      const data = await response.json();
      
      this.preloadedData.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      return null;
    }
  }

  // Pré-carrega dados de coreografias de um evento
  async preloadCoreografias(evento) {
    const cacheKey = `coreografias_${evento}`;
    
    if (this.preloadedData.has(cacheKey)) {
      const cached = this.preloadedData.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/eventos/${encodeURIComponent(evento)}/coreografias`);
      const data = await response.json();
      
      this.preloadedData.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      return null;
    }
  }

  // Pré-carrega pastas e fotos via POST
  async preloadPastasEFotos(caminho) {
    const cacheKey = `pastas_${caminho}`;
    
    if (this.preloadedData.has(cacheKey)) {
      const cached = this.preloadedData.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/eventos/pasta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caminho }),
      });
      const data = await response.json();
      
      this.preloadedData.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      return null;
    }
  }

  // Obtém dados do cache local se disponível
  getCachedData(key) {
    if (this.preloadedData.has(key)) {
      const cached = this.preloadedData.get(key);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }
    return null;
  }

  // Limpa cache antigo
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.preloadedData.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.preloadedData.delete(key);
      }
    }
  }

  // Pré-carrega dados relacionados em background
  async preloadRelatedData(evento) {
    try {
      // Pré-carrega coreografias do evento
      await this.preloadCoreografias(evento);
      
      // Aquece cache no backend
      fetch(`${BACKEND_URL}/api/eventos/${encodeURIComponent(evento)}/aquecer-cache`, {
        method: 'POST'
      }).catch(err => {});
      
    } catch (error) {
      // console.error('Erro ao pré-carregar dados relacionados:', error);
    }
  }

  // Inicia pré-carregamento inteligente
  async smartPreload(currentPath) {
    try {
      // Sempre pré-carrega eventos
      await this.preloadEventos();
      
      // Se estiver em um evento específico, pré-carrega dados relacionados
      if (currentPath.includes('/eventos/') && !currentPath.includes('/coreografias/')) {
        const pathParts = currentPath.split('/');
        const eventoIndex = pathParts.indexOf('eventos');
        if (eventoIndex !== -1 && pathParts[eventoIndex + 1]) {
          const evento = decodeURIComponent(pathParts[eventoIndex + 1]);
          this.preloadRelatedData(evento);
        }
      }
      
      // Limpa cache expirado
      this.clearExpiredCache();
      
    } catch (error) {
      // console.error('Erro no pré-carregamento inteligente:', error);
    }
  }
}

// Instância singleton
export const preloader = new DataPreloader();

// Hook para usar o preloader
export function usePreloader() {
  return preloader;
}

export default preloader;
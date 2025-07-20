import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { BACKEND_URL } from '../config/api';

// Configurações de cache por tipo de dados
const CACHE_CONFIGS = {
  eventos: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 2 * 60 * 60 * 1000, // 2 horas
  },
  coreografias: {
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
  },
  fotos: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  },
  thumbnails: {
    staleTime: 60 * 60 * 1000, // 1 hora
    gcTime: 4 * 60 * 60 * 1000, // 4 horas
  },
  metadata: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
  }
};

// Hook para listar eventos
export function useEventos() {
  return useQuery({
    queryKey: ['eventos'],
    queryFn: async () => {
      const { data } = await api.get('/photos/eventos');
      return data;
    },
    ...CACHE_CONFIGS.eventos,
    // Dados críticos - sempre manter fresh
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

// Hook para listar coreografias de um evento
export function useCoreografias(evento, dia = null) {
  return useQuery({
    queryKey: ['coreografias', evento, dia],
    queryFn: async () => {
      const endpoint = dia 
        ? `/photos/eventos/${encodeURIComponent(evento)}/${encodeURIComponent(dia)}/coreografias`
        : `/photos/eventos/${encodeURIComponent(evento)}/coreografias`;
      const { data } = await api.get(endpoint);
      return data;
    },
    enabled: !!evento,
    ...CACHE_CONFIGS.coreografias,
  });
}

// Hook para fotos com paginação infinita
export function useFotosInfinite(evento, coreografia, dia = null, limit = 50) {
  return useInfiniteQuery({
    queryKey: ['fotos-infinite', evento, coreografia, dia, limit],
    queryFn: async ({ pageParam = 1 }) => {
      const endpoint = dia 
        ? `/photos/eventos/${encodeURIComponent(evento)}/${encodeURIComponent(dia)}/${encodeURIComponent(coreografia)}/fotos`
        : `/photos/eventos/${encodeURIComponent(evento)}/${encodeURIComponent(coreografia)}/fotos`;
      
      const { data } = await api.get(endpoint, {
        params: { page: pageParam, limit }
      });
      return data;
    },
    enabled: !!evento && !!coreografia,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined;
    },
    ...CACHE_CONFIGS.fotos,
    // Para fotos, manter dados mais tempo pois são estáticos
    refetchOnWindowFocus: false,
  });
}

// Hook para fotos com paginação regular
export function useFotos(evento, coreografia, dia = null, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['fotos', evento, coreografia, dia, page, limit],
    queryFn: async () => {
      const endpoint = dia 
        ? `/photos/eventos/${encodeURIComponent(evento)}/${encodeURIComponent(dia)}/${encodeURIComponent(coreografia)}/fotos`
        : `/photos/eventos/${encodeURIComponent(evento)}/${encodeURIComponent(coreografia)}/fotos`;
      
      const { data } = await api.get(endpoint, {
        params: { page, limit }
      });
      return data;
    },
    enabled: !!evento && !!coreografia,
    ...CACHE_CONFIGS.fotos,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData, // Manter dados anteriores enquanto carrega
  });
}

// Hook para thumbnails (otimizado para cards de preview)
export function useThumbnails(evento, coreografia, dia = null, count = 6) {
  return useQuery({
    queryKey: ['thumbnails', evento, coreografia, dia, count],
    queryFn: async () => {
      const params = new URLSearchParams({
        count: count.toString()
      });
      if (dia) params.append('dia', dia);
      
      const { data } = await api.get(
        `/photos/thumbnails/${encodeURIComponent(evento)}/${encodeURIComponent(coreografia)}?${params}`
      );
      return data;
    },
    enabled: !!evento && !!coreografia,
    ...CACHE_CONFIGS.thumbnails,
    // Thumbnails são muito estáticos
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// Hook para estrutura completa do evento (navegação)
export function useEventoEstrutura(evento) {
  return useQuery({
    queryKey: ['evento-estrutura', evento],
    queryFn: async () => {
      const { data } = await api.get(`/photos/estrutura/${encodeURIComponent(evento)}`);
      return data;
    },
    enabled: !!evento,
    ...CACHE_CONFIGS.metadata,
    // Estrutura muda raramente
    refetchOnWindowFocus: false,
  });
}

// Hook para batch requests de coreografias
export function useBatchCoreografias(requests) {
  return useQuery({
    queryKey: ['batch-coreografias', requests],
    queryFn: async () => {
      const { data } = await api.post('/photos/batch/coreografias', { requests });
      return data;
    },
    enabled: Array.isArray(requests) && requests.length > 0,
    ...CACHE_CONFIGS.coreografias,
    // Usado para pré-carregamento
    refetchOnWindowFocus: false,
  });
}

// Hook para batch requests de metadados de fotos
export function useBatchFotosMetadata(requests) {
  return useQuery({
    queryKey: ['batch-fotos-metadata', requests],
    queryFn: async () => {
      const { data } = await api.post('/photos/batch/fotos-metadata', { requests });
      return data;
    },
    enabled: Array.isArray(requests) && requests.length > 0,
    ...CACHE_CONFIGS.metadata,
    refetchOnWindowFocus: false,
  });
}

// Hook para busca por selfie (não usa cache por ser personalizada)
export function useBuscarPorSelfie() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ selfie, evento }) => {
      const formData = new FormData();
      formData.append('selfie', selfie);
      formData.append('evento', evento);
      
      const { data } = await api.post('/fotos/buscar-por-selfie', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: { evento }
      });
      return data;
    },
    // Não usa cache pois é busca personalizada
    onSuccess: () => {
      // Pode invalidar caches relacionados se necessário
      // queryClient.invalidateQueries(['fotos']);
    },
  });
}

// Hook para gerenciar invalidação de cache
export function useCacheManager() {
  const queryClient = useQueryClient();

  const invalidateEventos = () => {
    queryClient.invalidateQueries(['eventos']);
  };

  const invalidateCoreografias = (evento = null) => {
    if (evento) {
      queryClient.invalidateQueries(['coreografias', evento]);
    } else {
      queryClient.invalidateQueries(['coreografias']);
    }
  };

  const invalidateFotos = (evento = null, coreografia = null) => {
    if (evento && coreografia) {
      queryClient.invalidateQueries(['fotos', evento, coreografia]);
      queryClient.invalidateQueries(['fotos-infinite', evento, coreografia]);
      queryClient.invalidateQueries(['thumbnails', evento, coreografia]);
    } else if (evento) {
      queryClient.invalidateQueries(['fotos', evento]);
      queryClient.invalidateQueries(['fotos-infinite', evento]);
      queryClient.invalidateQueries(['thumbnails', evento]);
    } else {
      queryClient.invalidateQueries(['fotos']);
      queryClient.invalidateQueries(['fotos-infinite']);
      queryClient.invalidateQueries(['thumbnails']);
    }
  };

  const preloadCoreografias = async (evento, dia = null) => {
    await queryClient.prefetchQuery({
      queryKey: ['coreografias', evento, dia],
      queryFn: async () => {
        const endpoint = dia 
          ? `/photos/eventos/${encodeURIComponent(evento)}/${encodeURIComponent(dia)}/coreografias`
          : `/photos/eventos/${encodeURIComponent(evento)}/coreografias`;
        const { data } = await api.get(endpoint);
        return data;
      },
      ...CACHE_CONFIGS.coreografias,
    });
  };

  const preloadThumbnails = async (evento, coreografia, dia = null) => {
    await queryClient.prefetchQuery({
      queryKey: ['thumbnails', evento, coreografia, dia, 6],
      queryFn: async () => {
        const params = new URLSearchParams({ count: '6' });
        if (dia) params.append('dia', dia);
        
        const { data } = await api.get(
          `/photos/thumbnails/${encodeURIComponent(evento)}/${encodeURIComponent(coreografia)}?${params}`
        );
        return data;
      },
      ...CACHE_CONFIGS.thumbnails,
    });
  };

  const clearAllCache = () => {
    queryClient.clear();
  };

  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.state.status === 'success').length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      loadingQueries: queries.filter(q => q.state.status === 'pending').length,
      cacheSize: JSON.stringify(queries).length,
    };
  };

  return {
    invalidateEventos,
    invalidateCoreografias,
    invalidateFotos,
    preloadCoreografias,
    preloadThumbnails,
    clearAllCache,
    getCacheStats,
  };
}

// Hook personalizado para pré-carregamento inteligente
export function useSmartPreload() {
  const queryClient = useQueryClient();

  const preloadBasedOnNavigation = async (currentEvent, currentCoreografia) => {
    // Pré-carregar eventos se não estão em cache
    const eventosCache = queryClient.getQueryData(['eventos']);
    if (!eventosCache) {
      queryClient.prefetchQuery({
        queryKey: ['eventos'],
        queryFn: async () => {
          const { data } = await api.get('/photos/eventos');
          return data;
        },
        ...CACHE_CONFIGS.eventos,
      });
    }

    // Pré-carregar estrutura do evento atual
    if (currentEvent) {
      queryClient.prefetchQuery({
        queryKey: ['evento-estrutura', currentEvent],
        queryFn: async () => {
          const { data } = await api.get(`/photos/estrutura/${encodeURIComponent(currentEvent)}`);
          return data;
        },
        ...CACHE_CONFIGS.metadata,
      });
    }

    // Pré-carregar thumbnails da coreografia atual
    if (currentEvent && currentCoreografia) {
      queryClient.prefetchQuery({
        queryKey: ['thumbnails', currentEvent, currentCoreografia, null, 6],
        queryFn: async () => {
          const { data } = await api.get(
            `/photos/thumbnails/${encodeURIComponent(currentEvent)}/${encodeURIComponent(currentCoreografia)}?count=6`
          );
          return data;
        },
        ...CACHE_CONFIGS.thumbnails,
      });
    }
  };

  return { preloadBasedOnNavigation };
}

export default {
  useEventos,
  useCoreografias,
  useFotos,
  useFotosInfinite,
  useThumbnails,
  useEventoEstrutura,
  useBatchCoreografias,
  useBatchFotosMetadata,
  useBuscarPorSelfie,
  useCacheManager,
  useSmartPreload,
}; 
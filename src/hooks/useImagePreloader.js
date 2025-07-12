import { useEffect, useRef } from 'react';

const useImagePreloader = (urls, preloadCount = 5) => {
  const preloadedImagesRef = useRef(new Set());
  const preloadQueueRef = useRef([]);

  useEffect(() => {
    if (!urls || urls.length === 0) return;

    // Limpar queue anterior
    preloadQueueRef.current = [...urls];

    // Função para pré-carregar próximas imagens
    const preloadNextImages = () => {
      let loaded = 0;
      
      while (loaded < preloadCount && preloadQueueRef.current.length > 0) {
        const url = preloadQueueRef.current.shift();
        
        if (!preloadedImagesRef.current.has(url)) {
          const img = new Image();
          img.onload = () => {
            preloadedImagesRef.current.add(url);
          };
          img.onerror = () => {
            // Ainda marcar como "tentado" para não tentar novamente
            preloadedImagesRef.current.add(url);
          };
          img.src = url;
          loaded++;
        }
      }
    };

    // Começar pré-carregamento
    preloadNextImages();

    // Cleanup function
    return () => {
      preloadQueueRef.current = [];
    };
  }, [urls, preloadCount]);

  return {
    isPreloaded: (url) => preloadedImagesRef.current.has(url),
    preloadedCount: preloadedImagesRef.current.size
  };
};

export default useImagePreloader;
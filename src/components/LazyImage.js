import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useImageCache } from '../utils/serviceWorkerUtils';

const LazyImage = ({
  src,
  alt = '',
  className = '',
  style = {},
  placeholder = '/img/sem_capa.jpg',
  threshold = 0.1,
  rootMargin = '50px',
  onLoad = () => {},
  onError = () => {},
  preload = false,
  priority = false,
  sizes = '',
  width,
  height,
  fallbackSrc = '/img/sem_capa.jpg',
  retryAttempts = 3,
  retryDelay = 1000,
  optimized = true,
  quality = 'medium', // low, medium, high
  ...props
}) => {
  const [imageState, setImageState] = useState({
    loading: true,
    error: false,
    loaded: false,
    currentSrc: null,
    retryCount: 0
  });

  const imgRef = useRef(null);
  const { preloadImages, getCachedImageUrl, isOnline } = useImageCache();

  // Intersection Observer otimizado
  const { ref: inViewRef, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce: true, // Só dispara uma vez
    skip: priority || preload, // Pula se for prioridade ou preload
  });

  // Combina refs
  const setRefs = useCallback((node) => {
    imgRef.current = node;
    inViewRef(node);
  }, [inViewRef]);

  // Gera URLs otimizadas baseadas na qualidade
  const getOptimizedSrc = useCallback((originalSrc) => {
    if (!optimized || !originalSrc) return originalSrc;

    try {
      const url = new URL(originalSrc, window.location.origin);
      
      // Adiciona parâmetros de otimização se for do MinIO
      if (url.hostname.includes('minio') || url.pathname.includes('photos')) {
        switch (quality) {
          case 'low':
            url.searchParams.set('q', '60');
            url.searchParams.set('w', width ? Math.min(width, 800) : '800');
            break;
          case 'high':
            url.searchParams.set('q', '90');
            if (width) url.searchParams.set('w', width);
            break;
          default: // medium
            url.searchParams.set('q', '75');
            url.searchParams.set('w', width ? Math.min(width, 1200) : '1200');
        }
        
        if (height) url.searchParams.set('h', height);
      }
      
      return url.toString();
    } catch {
      return originalSrc;
    }
  }, [optimized, quality, width, height]);

  // Função para carregar imagem com retry
  const loadImage = useCallback(async (srcToLoad, retryCount = 0) => {
    try {
      setImageState(prev => ({ ...prev, loading: true, error: false }));

      // Verifica se está em cache primeiro
      const cachedUrl = await getCachedImageUrl(srcToLoad);
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          setImageState(prev => ({
            ...prev,
            loading: false,
            loaded: true,
            error: false,
            currentSrc: srcToLoad
          }));
          onLoad(img);
          resolve(img);
        };
        
        img.onerror = () => {
          if (retryCount < retryAttempts) {
            // Retry com delay exponencial
            setTimeout(() => {
              loadImage(srcToLoad, retryCount + 1);
            }, retryDelay * Math.pow(2, retryCount));
          } else {
            // Tenta fallback
            if (srcToLoad !== fallbackSrc) {
              loadImage(fallbackSrc, 0);
            } else {
              setImageState(prev => ({
                ...prev,
                loading: false,
                error: true,
                retryCount: retryCount + 1
              }));
              onError(new Error('Failed to load image'));
              reject(new Error('Failed to load image'));
            }
          }
        };
        
        img.src = cachedUrl || srcToLoad;
      });
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
      setImageState(prev => ({ ...prev, loading: false, error: true }));
    }
  }, [getCachedImageUrl, retryAttempts, retryDelay, fallbackSrc, onLoad, onError]);

  // Efeito para pré-carregamento
  useEffect(() => {
    if (preload && src) {
      const optimizedSrc = getOptimizedSrc(src);
      preloadImages([optimizedSrc]);
    }
  }, [preload, src, getOptimizedSrc, preloadImages]);

  // Efeito principal para carregamento
  useEffect(() => {
    const shouldLoad = priority || preload || inView;
    
    if (shouldLoad && src && !imageState.loaded && !imageState.loading) {
      const optimizedSrc = getOptimizedSrc(src);
      loadImage(optimizedSrc);
    }
  }, [priority, preload, inView, src, imageState.loaded, imageState.loading, getOptimizedSrc, loadImage]);

  // Função para retry manual
  const retryLoad = useCallback(() => {
    if (src) {
      const optimizedSrc = getOptimizedSrc(src);
      loadImage(optimizedSrc, 0);
    }
  }, [src, getOptimizedSrc, loadImage]);

  // Renderização condicional baseada no estado
  const renderContent = () => {
    if (imageState.error) {
      return (
        <div 
          className={`lazy-image-error ${className}`}
          style={{ 
            ...style, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            color: '#666',
            minHeight: height || '200px'
          }}
          onClick={retryLoad}
        >
          <div style={{ textAlign: 'center', cursor: 'pointer' }}>
            <div>❌ Erro ao carregar</div>
            <small>Clique para tentar novamente</small>
            {!isOnline && <div><small>📴 Offline</small></div>}
          </div>
        </div>
      );
    }

    if (imageState.loading || (!inView && !priority && !preload)) {
      return (
        <div 
          className={`lazy-image-placeholder ${className}`}
          style={{
            ...style,
            backgroundColor: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: height || '200px',
            backgroundImage: placeholder ? `url(${placeholder})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(2px)',
            transition: 'filter 0.3s ease'
          }}
        >
          {imageState.loading && (
            <div className="loading-spinner" style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <style>
                {`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}
              </style>
            </div>
          )}
        </div>
      );
    }

    return (
      <img
        ref={imgRef}
        src={imageState.currentSrc}
        alt={alt}
        className={className}
        style={{
          ...style,
          opacity: imageState.loaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...props}
      />
    );
  };

  return (
    <div 
      ref={setRefs} 
      className="lazy-image-container"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {renderContent()}
      
      {/* Indicador de cache/offline */}
      {!isOnline && imageState.loaded && (
        <div style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '10px',
          zIndex: 1
        }}>
          📴 Cache
        </div>
      )}
    </div>
  );
};

// Hook para gerenciar listas de imagens lazy
export const useLazyImageList = (images = [], preloadCount = 3) => {
  const [visibleCount, setVisibleCount] = useState(preloadCount);
  const { preloadImages } = useImageCache();

  // Pré-carrega primeiras imagens
  useEffect(() => {
    if (images.length > 0) {
      const toPreload = images
        .slice(0, preloadCount)
        .map(img => typeof img === 'string' ? img : img.src)
        .filter(Boolean);
      
      if (toPreload.length > 0) {
        preloadImages(toPreload);
      }
    }
  }, [images, preloadCount, preloadImages]);

  const loadMore = useCallback((count = 10) => {
    setVisibleCount(prev => Math.min(prev + count, images.length));
  }, [images.length]);

  const reset = useCallback(() => {
    setVisibleCount(preloadCount);
  }, [preloadCount]);

  return {
    visibleImages: images.slice(0, visibleCount),
    hasMore: visibleCount < images.length,
    loadMore,
    reset,
    totalCount: images.length,
    visibleCount
  };
};

// Hook para pré-carregamento baseado em navegação
export const useSmartPreload = () => {
  const { preloadImages } = useImageCache();

  const preloadByPattern = useCallback((currentUrl, allUrls) => {
    if (!currentUrl || !allUrls.length) return;

    // Encontra índice atual
    const currentIndex = allUrls.findIndex(url => url.includes(currentUrl));
    if (currentIndex === -1) return;

    // Pré-carrega próximas 3 imagens
    const nextImages = allUrls
      .slice(currentIndex + 1, currentIndex + 4)
      .filter(Boolean);

    if (nextImages.length > 0) {
      preloadImages(nextImages);
    }
  }, [preloadImages]);

  const preloadThumbnails = useCallback((thumbnailUrls) => {
    if (Array.isArray(thumbnailUrls) && thumbnailUrls.length > 0) {
      // Pré-carrega até 10 thumbnails
      preloadImages(thumbnailUrls.slice(0, 10));
    }
  }, [preloadImages]);

  return {
    preloadByPattern,
    preloadThumbnails
  };
};

export default LazyImage; 
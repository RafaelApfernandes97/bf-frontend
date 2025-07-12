import React, { useState, useEffect, useMemo, useRef } from 'react';
import LazyImage from './LazyImage';

const VirtualizedPhotoGrid = ({ 
  fotos, 
  isSelected, 
  onPhotoClick, 
  itemsPerPage = 20,
  className = "fotos-grid" 
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef();

  // Se há poucas fotos (menos de 50), mostrar todas de uma vez
  const shouldPaginate = fotos.length > 50;

  // Dividir fotos em páginas
  const paginatedPhotos = useMemo(() => {
    if (!shouldPaginate) {
      return {
        photos: fotos,
        hasMore: false,
        totalPages: 1
      };
    }

    const totalPages = Math.ceil(fotos.length / itemsPerPage);
    const pages = [];
    
    for (let i = 0; i <= currentPage; i++) {
      const start = i * itemsPerPage;
      const end = start + itemsPerPage;
      pages.push(...fotos.slice(start, end));
    }
    
    return {
      photos: pages,
      hasMore: currentPage < totalPages - 1,
      totalPages
    };
  }, [fotos, currentPage, itemsPerPage, shouldPaginate]);

  // Scroll infinito (apenas se shouldPaginate for true)
  useEffect(() => {
    if (!shouldPaginate) return;

    const handleScroll = () => {
      if (isLoading || !paginatedPhotos.hasMore) return;

      // Detectar scroll na janela principal
      const { scrollY, innerHeight } = window;
      const { scrollHeight } = document.documentElement;
      
      if (scrollY + innerHeight >= scrollHeight - 1000) {
        setIsLoading(true);
        
        // Simular delay de carregamento para UX
        setTimeout(() => {
          setCurrentPage(prev => prev + 1);
          setIsLoading(false);
        }, 300);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, paginatedPhotos.hasMore, shouldPaginate]);

  // Reset quando fotos mudam
  useEffect(() => {
    setCurrentPage(0);
    console.log('[VirtualizedPhotoGrid] Fotos alteradas:', {
      totalFotos: fotos.length,
      shouldPaginate,
      itemsPerPage
    });
  }, [fotos, shouldPaginate, itemsPerPage]);

  // Debug do estado atual
  useEffect(() => {
    console.log('[VirtualizedPhotoGrid] Estado:', {
      currentPage,
      totalFotos: fotos.length,
      fotosExibidas: paginatedPhotos.photos.length,
      hasMore: paginatedPhotos.hasMore,
      shouldPaginate,
      isLoading
    });
  }, [currentPage, fotos.length, paginatedPhotos.photos.length, paginatedPhotos.hasMore, shouldPaginate, isLoading]);

  return (
    <>
      <div className={className} ref={containerRef}>
        {paginatedPhotos.photos.map(foto => (
          <LazyImage
            key={foto.nome}
            src={foto.url}
            alt={foto.nome}
            className={isSelected(foto) ? 'foto-card foto-card-selected' : 'foto-card'}
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => onPhotoClick(foto)}
          >
            <div className="foto-nome-overlay">{foto.nome}</div>
            {isSelected(foto) && (
              <span className="foto-check">✓</span>
            )}
          </LazyImage>
        ))}
      </div>
      
      {isLoading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '20px',
          color: '#666'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div className="loading-spinner"></div>
            Carregando mais fotos...
          </div>
        </div>
      )}
      
      {paginatedPhotos.hasMore && shouldPaginate && !isLoading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <button 
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => {
                setCurrentPage(prev => prev + 1);
                setIsLoading(false);
              }, 300);
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Carregar mais fotos
          </button>
        </div>
      )}
      
      {!paginatedPhotos.hasMore && fotos.length > itemsPerPage && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '20px',
          color: '#666',
          fontSize: '14px'
        }}>
          Todas as {fotos.length} fotos foram carregadas
        </div>
      )}
    </>
  );
};

export default VirtualizedPhotoGrid;
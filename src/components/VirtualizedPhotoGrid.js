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

  // Dividir fotos em páginas
  const paginatedPhotos = useMemo(() => {
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
  }, [fotos, currentPage, itemsPerPage]);

  // Scroll infinito
  useEffect(() => {
    const handleScroll = () => {
      if (isLoading || !paginatedPhotos.hasMore) return;

      const container = containerRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container.parentElement;
      
      if (scrollTop + clientHeight >= scrollHeight - 1000) {
        setIsLoading(true);
        
        // Simular delay de carregamento para UX
        setTimeout(() => {
          setCurrentPage(prev => prev + 1);
          setIsLoading(false);
        }, 300);
      }
    };

    const container = containerRef.current?.parentElement;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [isLoading, paginatedPhotos.hasMore]);

  // Reset quando fotos mudam
  useEffect(() => {
    setCurrentPage(0);
  }, [fotos]);

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
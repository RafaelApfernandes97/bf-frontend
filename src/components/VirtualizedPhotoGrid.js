import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { FixedSizeList as List } from 'react-window';
import LazyImage from './LazyImage';
import { useFotosInfinite } from '../hooks/usePhotoCache';
import { useSmartPreload } from './LazyImage';

// Componente de célula individual para o grid
const PhotoGridCell = React.memo(({ columnIndex, rowIndex, style, data }) => {
  const { 
    photos, 
    columnCount, 
    onPhotoClick, 
    onPhotoSelect, 
    selectedPhotos, 
    itemHeight,
    itemWidth,
    gap,
    showSelection = true 
  } = data;

  const photoIndex = rowIndex * columnCount + columnIndex;
  const photo = photos[photoIndex];

  if (!photo) {
    return <div style={style} />; // Célula vazia
  }

  const isSelected = selectedPhotos?.has(photo.nome);

  return (
    <div
      style={{
        ...style,
        padding: gap / 2,
      }}
    >
      <div
        className={`photo-grid-item ${isSelected ? 'selected' : ''}`}
        style={{
          width: itemWidth - gap,
          height: itemHeight - gap,
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          cursor: 'pointer',
          border: isSelected ? '3px solid #007bff' : '1px solid #e1e5e9',
          transition: 'all 0.2s ease',
        }}
        onClick={() => onPhotoClick?.(photo, photoIndex)}
      >
        <LazyImage
          src={photo.url}
          alt={photo.nome}
          width={itemWidth - gap}
          height={itemHeight - gap}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          quality="medium"
          threshold={0.1}
          rootMargin="200px"
        />

        {/* Overlay de seleção */}
        {showSelection && (
          <div
            className="photo-selection-overlay"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: isSelected ? '#007bff' : 'rgba(255, 255, 255, 0.8)',
              border: '2px solid #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2,
              fontSize: '12px',
              transition: 'all 0.2s ease',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPhotoSelect?.(photo, !isSelected);
            }}
          >
            {isSelected ? '✓' : '+'}
          </div>
        )}

        {/* Nome da foto */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            color: 'white',
            padding: '20px 8px 8px',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          {photo.nome}
        </div>
      </div>
    </div>
  );
});

PhotoGridCell.displayName = 'PhotoGridCell';

// Hook para calcular dimensões do grid
const useGridDimensions = (containerWidth, containerHeight, targetItemWidth = 200) => {
  return useMemo(() => {
    if (!containerWidth) return { columnCount: 0, itemWidth: 0, itemHeight: 0 };

    const gap = 16;
    const minItemWidth = 150;
    const maxItemWidth = 300;
    const aspectRatio = 1; // 1:1 para fotos quadradas

    // Calcula quantas colunas cabem
    let columnCount = Math.floor((containerWidth + gap) / (targetItemWidth + gap));
    columnCount = Math.max(1, columnCount);

    // Calcula largura real dos itens
    const itemWidth = Math.min(
      maxItemWidth,
      Math.max(minItemWidth, (containerWidth - gap * (columnCount - 1)) / columnCount)
    );

    const itemHeight = itemWidth * aspectRatio;

    return {
      columnCount,
      itemWidth: Math.floor(itemWidth),
      itemHeight: Math.floor(itemHeight),
      gap,
    };
  }, [containerWidth, targetItemWidth]);
};

// Componente principal do grid virtualizado
const VirtualizedPhotoGrid = ({
  evento,
  coreografia,
  dia = null,
  onPhotoClick,
  onPhotoSelect,
  selectedPhotos = new Set(),
  showSelection = true,
  targetItemWidth = 200,
  height = 600,
  infiniteLoading = true,
  itemsPerPage = 50,
  className = '',
  style = {},
  onLoadMore,
  ...props
}) => {
  const [containerSize, setContainerSize] = useState({ width: 0, height });
  const containerRef = useRef(null);
  const gridRef = useRef(null);
  const { preloadThumbnails } = useSmartPreload();

  // Hook para dados infinitos ou paginados
  const {
    data: photosData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useFotosInfinite(
    evento,
    coreografia,
    dia,
    itemsPerPage
  );

  // Combina todas as páginas de fotos
  const allPhotos = useMemo(() => {
    if (!photosData?.pages) return [];
    return photosData.pages.flatMap(page => page.fotos || []);
  }, [photosData]);

  // Dimensões do grid
  const { columnCount, itemWidth, itemHeight, gap } = useGridDimensions(
    containerSize.width,
    containerSize.height,
    targetItemWidth
  );

  // Calcula número de linhas
  const rowCount = Math.ceil(allPhotos.length / columnCount);

  // Observer para redimensionamento
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Pré-carrega thumbnails quando fotos são carregadas
  useEffect(() => {
    if (allPhotos.length > 0) {
      const urls = allPhotos.slice(0, 20).map(photo => photo.url);
      preloadThumbnails(urls);
    }
  }, [allPhotos, preloadThumbnails]);

  // Callback para carregamento infinito
  const onItemsRendered = useCallback(({ visibleRowStartIndex, visibleRowStopIndex }) => {
    if (!infiniteLoading || !hasNextPage || isFetchingNextPage) return;

    const itemsShown = (visibleRowStopIndex + 1) * columnCount;
    const totalItems = allPhotos.length;
    const threshold = totalItems - itemsPerPage * 0.5; // Carrega quando resta 50% da última página

    if (itemsShown >= threshold) {
      fetchNextPage();
    }
  }, [
    infiniteLoading,
    hasNextPage,
    isFetchingNextPage,
    columnCount,
    allPhotos.length,
    itemsPerPage,
    fetchNextPage
  ]);

  // Props para as células do grid
  const itemData = useMemo(() => ({
    photos: allPhotos,
    columnCount,
    onPhotoClick,
    onPhotoSelect,
    selectedPhotos,
    itemHeight,
    itemWidth,
    gap,
    showSelection
  }), [
    allPhotos,
    columnCount,
    onPhotoClick,
    onPhotoSelect,
    selectedPhotos,
    itemHeight,
    itemWidth,
    gap,
    showSelection
  ]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`photo-grid-loading ${className}`}
        style={{
          ...style,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div className="loading-spinner">⏳ Carregando fotos...</div>
        <div>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`photo-grid-error ${className}`}
        style={{
          ...style,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
          color: '#dc3545'
        }}
      >
        <div>❌ Erro ao carregar fotos</div>
        <div style={{ fontSize: '14px', textAlign: 'center' }}>
          {error.message || 'Tente novamente mais tarde'}
        </div>
      </div>
    );
  }

  // Empty state
  if (allPhotos.length === 0) {
    return (
      <div
        className={`photo-grid-empty ${className}`}
        style={{
          ...style,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div>📷 Nenhuma foto encontrada</div>
        <div style={{ fontSize: '14px', opacity: 0.7 }}>
          Não há fotos disponíveis para esta coreografia
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`virtualized-photo-grid ${className}`}
      style={{
        ...style,
        height,
        width: '100%',
        position: 'relative'
      }}
      {...props}
    >
      {containerSize.width > 0 && (
        <Grid
          ref={gridRef}
          height={height}
          width={containerSize.width}
          columnCount={columnCount}
          rowCount={rowCount}
          columnWidth={itemWidth}
          rowHeight={itemHeight}
          itemData={itemData}
          onItemsRendered={onItemsRendered}
          overscanRowCount={2}
          overscanColumnCount={1}
        >
          {PhotoGridCell}
        </Grid>
      )}

      {/* Indicador de carregamento no final */}
      {isFetchingNextPage && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            zIndex: 10
          }}
        >
          ⏳ Carregando mais fotos...
        </div>
      )}

      {/* Estatísticas no canto */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 10
        }}
      >
        {allPhotos.length} fotos
        {selectedPhotos.size > 0 && ` • ${selectedPhotos.size} selecionadas`}
      </div>
    </div>
  );
};

// Hook para gerenciar seleção de fotos
export const usePhotoSelection = (initialSelection = new Set()) => {
  const [selectedPhotos, setSelectedPhotos] = useState(initialSelection);

  const togglePhoto = useCallback((photo, forceValue = null) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      const isSelected = forceValue !== null ? !forceValue : newSet.has(photo.nome);
      
      if (isSelected) {
        newSet.delete(photo.nome);
      } else {
        newSet.add(photo.nome);
      }
      
      return newSet;
    });
  }, []);

  const selectAll = useCallback((photos) => {
    setSelectedPhotos(new Set(photos.map(photo => photo.nome)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPhotos(new Set());
  }, []);

  const getSelectedPhotos = useCallback((allPhotos) => {
    return allPhotos.filter(photo => selectedPhotos.has(photo.nome));
  }, [selectedPhotos]);

  return {
    selectedPhotos,
    togglePhoto,
    selectAll,
    clearSelection,
    getSelectedPhotos,
    selectionCount: selectedPhotos.size
  };
};

export default VirtualizedPhotoGrid; 
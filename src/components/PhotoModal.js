import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from './CartContext';
import './PhotoModal.css';
import ShoppingCart2Line from '../assets/icons/shopping_cart_2_line.svg';

const PhotoModal = ({ 
  isOpen, 
  onClose, 
  photos, 
  currentPhotoIndex, 
  onNavigate,
  tabelaPreco,
  evento,
  coreografia,
  dia
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const { cart, addToCart, removeFromCart } = useCart();

  const currentPhoto = photos[currentPhotoIndex];

  // Verifica se a foto está no carrinho
  const isInCart = useCallback(() => {
    if (!currentPhoto) return false;
    return cart.some(item => 
      item.nome === currentPhoto.nome && 
      item.url === currentPhoto.url
    );
  }, [cart, currentPhoto]);

  // Navegação por teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentPhotoIndex > 0) {
            onNavigate(currentPhotoIndex - 1);
          }
          break;
        case 'ArrowRight':
          if (currentPhotoIndex < photos.length - 1) {
            onNavigate(currentPhotoIndex + 1);
          }
          break;
        case ' ':
          e.preventDefault();
          setIsZoomed(!isZoomed);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPhotoIndex, photos.length, onNavigate, onClose, isZoomed]);

  // Reset zoom quando trocar de foto
  useEffect(() => {
    setIsZoomed(false);
  }, [currentPhotoIndex]);

  const handleImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  const handleAddToCart = () => {
    if (!currentPhoto) return;

    if (isInCart()) {
      // Remove do carrinho
      removeFromCart(currentPhoto);
    } else {
      // Adiciona ao carrinho
      const precoFoto = tabelaPreco?.precoFoto || 0;
      addToCart({
        ...currentPhoto,
        tipo: 'foto',
        preco: precoFoto,
        evento,
        coreografia,
        dia
      });
    }
  };

  const navigatePrev = () => {
    if (currentPhotoIndex > 0) {
      onNavigate(currentPhotoIndex - 1);
    }
  };

  const navigateNext = () => {
    if (currentPhotoIndex < photos.length - 1) {
      onNavigate(currentPhotoIndex + 1);
    }
  };

  if (!isOpen || !currentPhoto) return null;

  return (
    <div className="photo-modal-overlay" onClick={onClose}>
      <div className="photo-modal-content" onClick={e => e.stopPropagation()}>
        {/* Navegação anterior */}
        {currentPhotoIndex > 0 && (
          <button className="photo-modal-nav prev" onClick={navigatePrev}>
            ‹
          </button>
        )}

        {/* Container da imagem */}
        <div className="photo-modal-image-container">
          {/* Botão de fechar */}
          <button className="photo-modal-close" onClick={onClose}>
            ×
          </button>

          <img
            src={currentPhoto.url}
            alt={currentPhoto.nome}
            className={`photo-modal-image ${isZoomed ? 'zoomed' : ''}`}
            onClick={handleImageClick}
          />

          {/* Botão de adicionar ao carrinho */}
          <button 
            className={`photo-modal-add-cart ${isInCart() ? 'added' : ''}`}
            onClick={handleAddToCart}
            title={isInCart() ? 'Remover do carrinho' : 'Adicionar ao carrinho'}
          >
            {isInCart() ? '−' : '+'}
          </button>
        </div>

        {/* Navegação próxima */}
        {currentPhotoIndex < photos.length - 1 && (
          <button className="photo-modal-nav next" onClick={navigateNext}>
            ›
          </button>
        )}

        {/* Informações da foto */}
        <div className="photo-modal-info">
          <div className="photo-modal-name">
            {currentPhoto.nome}
          </div>
          
          <div className="photo-modal-counter">
            {currentPhotoIndex + 1} de {photos.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoModal; 
import React from 'react';
import './ValeModal.css';
import IconPoster from '../assets/img/carrinhoposter.png';

export default function PosterModal({ onClose, onAddToCart, evento, valorPoster }) {

  const handleAddToCart = () => {
    const posterItem = {
      nome: 'Placa Pôster',
      tipo: 'poster',
      evento: evento,
      url: IconPoster, // Ícone do poster para o carrinho
      coreografia: 'Pôster',
      valor: valorPoster
    };
    
    onAddToCart(posterItem);
    onClose();
  };

  return (
    <div className="vale-modal-overlay" onClick={onClose}>
      <div className="vale-modal-content" onClick={e => e.stopPropagation()}>
        <div className="vale-modal-header">
          <h2>🎭 Placa Pôster</h2>
          <button className="vale-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="vale-modal-body">
          <div className="vale-modal-text">
            <p>
              <strong>Placa Pôster personalizada com a sua foto!</strong>
            </p>
            <ul>
              <li>Material personalizado de alta qualidade</li>
              <li>Tamanho 50x70cm - vertical ou horizontal</li>
              <li>Material PS 0.30mm - resistente e durável</li>
              <li>Frete incluso para todo o Brasil</li>
            </ul>
          </div>
          
          <div className="vale-modal-info">
            <div className="vale-info-item">
              <strong>Evento:</strong> {evento}
            </div>
            <div className="vale-info-item">
              <strong>Produto:</strong> Placa Pôster
            </div>
            <div className="vale-info-item">
              <strong>Valor:</strong> R$ {valorPoster?.toFixed(2)}
            </div>
          </div>
        </div>
        
        <div className="vale-modal-footer">
          <button className="vale-add-cart-btn" onClick={handleAddToCart}>
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
} 
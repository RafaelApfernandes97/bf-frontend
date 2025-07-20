import React from 'react';
import './ValeModal.css';
import IconVale from '../assets/img/iconvale.png';

export default function ValeModal({ 
  isOpen, 
  onClose, 
  evento, 
  coreografia, 
  valorVale, 
  onAddToCart 
}) {
  if (!isOpen) return null;

  const handleAddToCart = () => {
    console.log('🎟️ [VALE MODAL] Adicionando ao carrinho:', {
      valorVale,
      tipo: 'vale',
      nome: `Vale - ${coreografia}`,
      evento,
      coreografia
    });
    
    onAddToCart({
      tipo: 'vale',
      nome: `Vale - ${coreografia}`,
      evento,
      coreografia,
      valor: valorVale,
      url: IconVale // Ícone do vale para o carrinho
    });
    onClose();
  };

  return (
    <div className="vale-modal-overlay" onClick={onClose}>
      <div className="vale-modal-content" onClick={e => e.stopPropagation()}>
        <div className="vale-modal-header">
          <h2>🎟️ Vale Coreografia</h2>
          <button className="vale-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="vale-modal-body">
          <div className="vale-modal-text">
            <p>
              O vale coreografia é um pacote promocional com todas as fotos da sua coreografia. 
              Para conferir o valor do vale é só clicar abaixo e adicionar ao carrinho.
            </p>
          </div>
          
          <div className="vale-modal-info">
            <div className="vale-info-item">
              <strong>Evento:</strong> {evento}
            </div>
            <div className="vale-info-item">
              <strong>Coreografia:</strong> {coreografia}
            </div>
            <div className="vale-info-item">
              <strong>Valor:</strong> R$ {valorVale?.toFixed(2)}
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
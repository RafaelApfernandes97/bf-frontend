import React from 'react';
import './ValeModal.css';
import IconVideo from '../assets/img/iconvideo.png';

export default function VideoModal({ 
  isOpen, 
  onClose, 
  evento, 
  coreografia, 
  valorVideo, 
  onAddToCart 
}) {
  if (!isOpen) return null;

  const handleAddToCart = () => {
    console.log('🎥 [VIDEO MODAL] Adicionando ao carrinho:', {
      valorVideo,
      tipo: 'video',
      nome: `Vídeo - ${coreografia}`,
      evento,
      coreografia
    });
    
    onAddToCart({
      tipo: 'video',
      nome: `Vídeo - ${coreografia}`,
      evento,
      coreografia,
      valor: valorVideo,
      url: IconVideo // Ícone do vídeo para o carrinho
    });
    onClose();
  };

  return (
    <div className="vale-modal-overlay" onClick={onClose}>
      <div className="vale-modal-content" onClick={e => e.stopPropagation()}>
        <div className="vale-modal-header">
          <h2>🎥 Vídeo Coreografia</h2>
          <button className="vale-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="vale-modal-body">
          <div className="vale-modal-text">
            <p>
              O vídeo da coreografia é gravado em um ângulo frontal fixo. 
              Se você deseja visualizar uma prévia do material, pode adicionar o produto ao carrinho 
              e solicitar uma amostra pelo WhatsApp.
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
              <strong>Valor:</strong> R$ {valorVideo?.toFixed(2)}
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
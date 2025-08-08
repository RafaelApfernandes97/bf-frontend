import React from 'react';
import './OrderSuccessModal.css';

function OrderSuccessModal({ isOpen, onClose, pedidoId }) {
  if (!isOpen) return null;

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/5511986879746', '_blank');
  };

  return (
    <div className="order-success-overlay">
      <div className="order-success-modal">
        <button className="order-success-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className="order-success-content">
          <div className="order-success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#4CAF50" strokeWidth="2"/>
              <path d="M9 12L11 14L15 10" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h2 className="order-success-title">Pedido enviado com sucesso!</h2>
          
          <p className="order-success-message">
            Seu pedido <strong>{pedidoId}</strong> foi enviado com sucesso!
          </p>
          
          <p className="order-success-subtitle">
            Você receberá uma mensagem no WhatsApp com o resumo do seu pedido.
          </p>
          
          <div className="order-success-actions">
            <button 
              className="order-success-whatsapp-btn"
              onClick={handleWhatsAppClick}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 21L6.5 18.5C7.5 19.5 9 20 10.5 20C15.5 20 19.5 16 19.5 11C19.5 6 15.5 2 10.5 2C5.5 2 1.5 6 1.5 11C1.5 13.5 2.5 15.5 4 17L3 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 8C8 8 8.5 7 10 7C11.5 7 12 8 12 9C12 10 11 11 10 11C9 11 8 10 8 9C8 8 8 8 8 8Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 9C12 9 12.5 8 14 8C15.5 8 16 9 16 10C16 11 15 12 14 12C13 12 12 11 12 10C12 9 12 9 12 9Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Atendimento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccessModal; 

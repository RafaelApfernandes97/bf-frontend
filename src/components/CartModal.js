import React from 'react';
import './CartModal.css';

export default function CartModal({ fotos, onClose, onRemove, onCheckout, valorUnitario, checkoutLoading = false, checkoutMsg = '' }) {
  const total = fotos.length * (Number(valorUnitario) || 0);

  return (
    <div className="cart-modal-overlay">
      <div className="cart-container">
        <div className="cart-header">
          <span>Seu carrinho</span>
          <button className="cart-close-btn" onClick={onClose} disabled={checkoutLoading}>&times;</button>
        </div>
        <div className="cart-list">
          {fotos.length === 0 ? (
            <div className="cart-empty">Nenhuma foto selecionada.</div>
          ) : (
            fotos.map((foto, idx) => (
              <div className="cart-item" key={foto.nome + idx}>
                <div className="cart-thumb">
                  <img src={foto.url} alt={foto.nome} />
                </div>
                <div className="cart-info">
                  <div className="cart-preco">R${(Number(valorUnitario) || 0).toFixed(2).replace('.', ',')}</div>
                  <div className="cart-nome">
                    <div>#{foto.nome}</div>
                    {foto.coreografia && (
                      <div style={{ color: '#ffe001' }}>{foto.coreografia}</div>
                    )}
                    {foto.evento && (
                      <div style={{ color: '#faf782', fontStyle: 'italic' }}>{foto.evento}</div>
                    )}
                  </div>
                </div>
                <button className="cart-remove-btn" onClick={() => onRemove(foto)} title="Remover foto" disabled={checkoutLoading}>×</button>
              </div>
            ))
          )}
        </div>
        <div className="cart-summary">
          <div className="cart-summary-row">
            <span>Itens ({fotos.length})</span>
            <span>R${(Number(total) || 0).toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="cart-summary-row cart-summary-total">
            <span>Total</span>
            <span>R${(Number(total) || 0).toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
        {checkoutMsg && (
          <div style={{ color: checkoutMsg.includes('sucesso') ? '#4caf50' : '#FF5A5A', textAlign: 'center', margin: '10px 0', fontWeight: 600, fontSize: 15 }}>
            {checkoutMsg}
          </div>
        )}
        <button className="cart-checkout-btn" onClick={onCheckout} disabled={checkoutLoading || fotos.length === 0}>
          {checkoutLoading ? 'Enviando pedido...' : 'Finalizar compra'} <span className="cart-checkout-arrow">→</span>
        </button>
      </div>
    </div>
  );
} 
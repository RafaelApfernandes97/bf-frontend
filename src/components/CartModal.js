import React from 'react';
import './CartModal.css';

export default function CartModal({ fotos, onClose, onRemove, onCheckout, valorUnitario, checkoutLoading = false, checkoutMsg = '', isLoggedIn = true, onShowLogin, onShowRegister }) {
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
        {!isLoggedIn && (
          <div style={{ 
            color: '#ffe001', 
            textAlign: 'center', 
            margin: '10px 0', 
            fontWeight: 600, 
            fontSize: 14,
            background: 'rgba(255, 224, 1, 0.1)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 224, 1, 0.3)'
          }}>
            Atenção: Para continuar com a compra, é necessário estar logado em sua conta.<br/>
            <button 
              onClick={onShowLogin}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffe001',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                padding: '0',
                margin: '0 4px'
              }}
            >
              Faça login
            </button>
            ou
            <button 
              onClick={onShowRegister}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffe001',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                padding: '0',
                margin: '0 4px'
              }}
            >
              crie uma conta
            </button>
            para prosseguir.
          </div>
        )}
        {checkoutMsg && (
          <div style={{ color: checkoutMsg.includes('sucesso') ? '#4caf50' : '#FF5A5A', textAlign: 'center', margin: '10px 0', fontWeight: 600, fontSize: 15 }}>
            {checkoutMsg}
          </div>
        )}
        <button
          className="cart-checkout-btn"
          onClick={isLoggedIn ? onCheckout : onShowLogin}
          disabled={checkoutLoading || fotos.length === 0}
        >
          {checkoutLoading
            ? 'Enviando pedido...'
            : isLoggedIn
              ? 'Finalizar compra'
              : 'Fazer login'}
          <span className="cart-checkout-arrow">→</span>
        </button>
      </div>
    </div>
  );
} 
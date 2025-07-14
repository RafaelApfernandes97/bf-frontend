import React, { useState } from 'react';
import './CartModal.css';

export default function CartModal({ fotos, onClose, onRemove, onCheckout, valorUnitario, checkoutLoading = false, checkoutMsg = '', isLoggedIn = true, onShowLogin, onShowRegister }) {
  // Separar banners de fotos normais
  const banners = fotos.filter(item => item.tipo === 'banner');
  const fotosNormais = fotos.filter(item => item.tipo !== 'banner');
  
  // Calcular valor das fotos normais
  const valorFotosNormais = fotosNormais.length * (Number(valorUnitario) || 0);
  
  // Calcular valor dos banners (soma dos preços individuais)
  const valorBanners = banners.reduce((acc, banner) => acc + (Number(banner.preco) || 0), 0);
  
  // Total = fotos normais + banners
  const total = valorFotosNormais + valorBanners;

  const [fotoExpandida, setFotoExpandida] = useState(null);

  // Função para obter o preço correto de cada item
  const getPrecoItem = (foto) => {
    if (foto.tipo === 'banner') {
      return Number(foto.preco) || 0;
    }
    return Number(valorUnitario) || 0;
  };

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
                <div className="cart-thumb" onClick={() => setFotoExpandida(foto)} style={{cursor: 'pointer'}}>
                  <img src={foto.url} alt={foto.nome} />
                </div>
                <div className="cart-info">
                  <div className="cart-preco">R${getPrecoItem(foto).toFixed(2).replace('.', ',')}</div>
                  <div className="cart-nome">
                    <div>#{foto.nome}</div>
                    {foto.coreografia && (
                      <div style={{ color: '#ffe001' }}>{foto.coreografia}</div>
                    )}
                    {foto.evento && (
                      <div style={{ color: '#faf782', fontStyle: 'italic' }}>{foto.evento}</div>
                    )}
                    {foto.tipo === 'banner' && (
                      <div style={{ color: '#ff6b35', fontStyle: 'italic', fontSize: '0.9em' }}>
                        {foto.categoria === 'vale' ? '📄 Vale Coreografia' : '🎥 Vídeo'}
                      </div>
                    )}
                  </div>
                </div>
                <button className="cart-remove-btn" onClick={() => onRemove(foto)} title="Remover foto" disabled={checkoutLoading}>×</button>
              </div>
            ))
          )}
        </div>
        {fotoExpandida && (
          <div className="foto-expandida-overlay" onClick={() => setFotoExpandida(null)}>
            <div className="foto-expandida-content" onClick={e => e.stopPropagation()}>
              <div className="foto-expandida-img-wrapper" style={{position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%'}}>
                <div className="foto-expandida-nome">{fotoExpandida.nome}</div>
                <img
                  src={fotoExpandida.url || '/img/sem_foto.jpg'}
                  alt={fotoExpandida.nome}
                  onError={e => e.target.src='/img/sem_foto.jpg'}
                  className="foto-expandida-img"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        )}
        <div className="cart-summary">
          {fotosNormais.length > 0 && (
            <div className="cart-summary-row">
              <span>Fotos ({fotosNormais.length})</span>
              <span>R${valorFotosNormais.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          {banners.length > 0 && (
            <div className="cart-summary-row">
              <span>Produtos ({banners.length})</span>
              <span>R${valorBanners.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          <div className="cart-summary-row cart-summary-total">
            <span>Total ({fotos.length} itens)</span>
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
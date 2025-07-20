import React, { useState } from 'react';
import './CartModal.css';
import { API_ENDPOINTS } from '../config/api';

export default function CartModal({ fotos, onClose, onRemove, onCheckout, valorUnitario, checkoutLoading = false, checkoutMsg = '', isLoggedIn = true, onShowLogin, onShowRegister }) {
  // Função para calcular o preço de um item individual
  const getPrecoItem = (foto) => {
    // Se é banner (vale/vídeo/poster), usar seu valor próprio
    if (foto.tipo === 'vale' || foto.tipo === 'video' || foto.tipo === 'poster') {
      return Number(foto.valor) || Number(foto.preco) || 0;
    }
    // Se é foto normal, usar valorUnitario
    return Number(valorUnitario) || 0;
  };

  // Estados para cupom de desconto
  const [codigoCupom, setCodigoCupom] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState(null);
  const [mensagemCupom, setMensagemCupom] = useState('');
  const [aplicandoCupom, setAplicandoCupom] = useState(false);

  // Calcular total antes do desconto
  const subtotal = fotos.reduce((acc, foto) => acc + getPrecoItem(foto), 0);
  
  // Calcular desconto e total final
  const desconto = cupomAplicado ? cupomAplicado.desconto : 0;
  const total = subtotal - desconto;
  
  const [fotoExpandida, setFotoExpandida] = useState(null);

  // Função para aplicar cupom
  const aplicarCupom = async () => {
    if (!codigoCupom.trim()) {
      setMensagemCupom('Digite um código de cupom válido');
      return;
    }

    setAplicandoCupom(true);
    setMensagemCupom('');

    try {
      const usuarioId = localStorage.getItem('user_id');
      const requestBody = {
        codigo: codigoCupom,
        valorTotal: subtotal
      };
      
      // Só inclui usuarioId se existir
      if (usuarioId) {
        requestBody.usuarioId = usuarioId;
      }
      
      const response = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/cupons/validar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        setCupomAplicado(data);
        setMensagemCupom(`✅ Cupom aplicado! Desconto de R$ ${data.desconto.toFixed(2).replace('.', ',')}`);
      } else {
        setMensagemCupom(`❌ ${data.error}`);
      }
    } catch (error) {
      setMensagemCupom('❌ Erro ao validar cupom. Tente novamente.');
    }

    setAplicandoCupom(false);
  };

  // Função para remover cupom
  const removerCupom = () => {
    setCupomAplicado(null);
    setCodigoCupom('');
    setMensagemCupom('');
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

        {/* Seção de Cupom de Desconto */}
        <div className="cart-coupon-section">
          <h4 className="cart-coupon-title">🎟️ Cupom de Desconto</h4>
          
          {!cupomAplicado ? (
            <div className="cart-coupon-input-group">
              <input
                type="text"
                placeholder="Digite o código do cupom"
                value={codigoCupom}
                onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())}
                className="cart-coupon-input"
                disabled={aplicandoCupom}
              />
              <button
                onClick={aplicarCupom}
                disabled={aplicandoCupom || !codigoCupom.trim()}
                className="cart-coupon-btn"
              >
                {aplicandoCupom ? 'Aplicando...' : 'Aplicar'}
              </button>
            </div>
          ) : (
            <div className="cart-coupon-applied">
              <span className="cart-coupon-applied-text">
                {cupomAplicado.cupom.codigo} - {cupomAplicado.cupom.descricao}
              </span>
              <button
                onClick={removerCupom}
                className="cart-coupon-remove-btn"
                title="Remover cupom"
              >
                ×
              </button>
            </div>
          )}
          
          {mensagemCupom && (
            <div className={`cart-coupon-message ${mensagemCupom.includes('✅') ? 'success' : 'error'}`}>
              {mensagemCupom}
            </div>
          )}
        </div>

        <div className="cart-summary">
          <div className="cart-summary-row">
            <span>Subtotal ({fotos.length} itens)</span>
            <span>R${(Number(subtotal) || 0).toFixed(2).replace('.', ',')}</span>
          </div>
          
          {cupomAplicado && (
            <div className="cart-summary-row" style={{ color: '#28a745' }}>
              <span>Desconto ({cupomAplicado.cupom.codigo})</span>
              <span>-R${(Number(desconto) || 0).toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          
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
          onClick={isLoggedIn ? () => onCheckout(cupomAplicado) : onShowLogin}
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
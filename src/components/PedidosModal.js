import React, { useState, useEffect } from 'react';
import './PedidosModal.css';
import { useCart } from './CartContext';

export default function PedidosModal({ onClose }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchPedidos() {
      setLoading(true);
      setErro('');
      try {
        const token = localStorage.getItem('user_token');
        const res = await fetch('http://localhost:3001/api/usuarios/meus-pedidos', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('Erro ao buscar pedidos');
        const data = await res.json();
        setPedidos(data.pedidos || []);
      } catch (e) {
        setErro('Erro ao carregar pedidos');
      }
      setLoading(false);
    }
    fetchPedidos();
  }, []);

  function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatarValor(valor) {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
  }

  function getStatusColor(status) {
    switch (status) {
      case 'pendente': return '#FFA500';
      case 'confirmado': return '#4CAF50';
      case 'cancelado': return '#F44336';
      default: return '#999';
    }
  }

  function getStatusText(status) {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'confirmado': return 'Confirmado';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  }

  function handleRefazerPedido(fotos) {
    fotos.forEach(foto => addToCart(foto));
    onClose && onClose();
  }

  return (
    <div className="pedidos-modal-overlay">
      <div className="pedidos-modal-container">
        <button className="pedidos-modal-close" onClick={onClose}>&times;</button>
        <h2>Meus Pedidos</h2>
        
        {loading ? (
          <div className="pedidos-loading">Carregando pedidos...</div>
        ) : erro ? (
          <div className="pedidos-error">{erro}</div>
        ) : pedidos.length === 0 ? (
          <div className="pedidos-empty">Nenhum pedido encontrado.</div>
        ) : (
          <div className="pedidos-list">
            {pedidos.map(pedido => (
              <div key={pedido._id} className="pedido-item">
                <div className="pedido-header">
                  <div className="pedido-id">#{pedido.pedidoId}</div>
                </div>
                <div className="pedido-info">
                  <div className="pedido-event">Evento: {pedido.evento}</div>
                  <div className="pedido-date">Data: {formatarData(pedido.dataCriacao)}</div>
                  <div className="pedido-value">Total: {formatarValor(pedido.valorTotal)}</div>
                  <div className="pedido-photos">Fotos: {pedido.fotos.length}</div>
                </div>
                <div className="pedido-photos-list">
                  {pedido.fotos.map((foto, idx) => (
                    <div key={idx} className="pedido-photo-item">
                      <img src={foto.url} alt={foto.nome} />
                      <div className="pedido-photo-info">
                        <div className="pedido-photo-name">{foto.nome}</div>
                        {foto.coreografia && (
                          <div className="pedido-photo-coreo">{foto.coreografia}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="refazer-pedido-btn" onClick={() => handleRefazerPedido(pedido.fotos)}>
                  Refazer pedido
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
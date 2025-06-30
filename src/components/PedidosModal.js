import React, { useState, useEffect, useRef } from 'react';
import './PedidosModal.css';
import { useCart } from './CartContext';

const BACKEND_URL = 'https://backend.rfsolutionbr.com.br';
const MINIO_ENDPOINT = 'https://balletemfoco-minio.ul08ww.easypanel.host';
const MINIO_BUCKET = 'balletemfoco';

function montarUrlPublica(evento, coreografia, nome) {
  const url = `${MINIO_ENDPOINT}/${MINIO_BUCKET}/${encodeURIComponent(evento)}/${encodeURIComponent(coreografia)}/${encodeURIComponent(nome)}`;
  return url;
}

// Função para criar uma imagem de placeholder
function criarPlaceholder(nome) {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  // Fundo cinza
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, 200, 200);
  
  // Ícone de câmera
  ctx.fillStyle = '#666';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('📷', 100, 100);
  
  // Nome da foto
  ctx.fillStyle = '#999';
  ctx.font = '12px Arial';
  ctx.fillText(nome || 'Foto', 100, 180);
  
  // Texto de erro
  ctx.fillStyle = '#ff6b6b';
  ctx.font = '10px Arial';
  ctx.fillText('Erro ao carregar', 100, 160);
  
  return canvas.toDataURL();
}

export default function PedidosModal({ onClose }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const { addToCart } = useCart();
  const [expandedId, setExpandedId] = useState(null);
  const [fotoExpandida, setFotoExpandida] = useState(null);

  useEffect(() => {
    async function fetchPedidos() {
      setLoading(true);
      setErro('');
      try {
        const token = localStorage.getItem('user_token');
        const res = await fetch(`${BACKEND_URL}/api/usuarios/meus-pedidos`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('Erro ao buscar pedidos');
        const data = await res.json();
        
        // Garantir que cada foto tenha uma URL pública
        const pedidosComUrls = (data.pedidos || []).map(pedido => {
          const fotosComUrls = (pedido.fotos || []).map(foto => {
            let url = foto.url;
            if (!url || url.includes('sem_foto')) {
              url = montarUrlPublica(pedido.evento, foto.coreografia, foto.nome);
            }
            return { ...foto, url };
          });
          return { ...pedido, fotos: fotosComUrls };
        });
        
        setPedidos(pedidosComUrls);
      } catch (e) {
        console.error('Erro ao carregar pedidos:', e);
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

  function toggleExpand(id) {
    setExpandedId(prevId => (prevId === id ? null : id));
  }

  function handleImageError(e, foto) {
    // Criar placeholder quando a imagem falhar
    e.target.src = criarPlaceholder(foto.nome);
    e.target.style.objectFit = 'contain';
    e.target.style.backgroundColor = '#333';
  }

  return (
    <div className="pedidos-modal-overlay">
      <div className="pedidos-modal-container">
        <button className="pedidos-modal-close" onClick={onClose}>&times;</button>
        <div className="pedidos-modal-title-left">Meus Pedidos</div>
        
        {loading ? (
          <div className="pedidos-loading">Carregando pedidos...</div>
        ) : erro ? (
          <div className="pedidos-error">{erro}</div>
        ) : pedidos.length === 0 ? (
          <div className="pedidos-empty">Nenhum pedido encontrado.</div>
        ) : (
          <div className="pedidos-list">
            {pedidos.map(pedido => (
              <div key={pedido._id} className="pedido-item-resumo">
                <div className="pedido-header-resumo">
                  <div className="pedido-id-resumo font-inter">Pedido #{pedido.pedidoId}</div>
                  <div className="pedido-data-resumo font-inter">Realizado em {formatarData(pedido.dataCriacao)}</div>
                </div>
                <div className="pedido-info-resumo">
                  <div className="pedido-info-row">
                    <div className="font-inter pedido-info-label">Itens ({pedido.fotos.length})</div>
                    <div className="font-inter pedido-info-value">{formatarValor(pedido.valorUnitario * pedido.fotos.length)}</div>
                  </div>
                  <div className="pedido-info-row">
                    <div className="font-inter pedido-info-label">Valor unitário</div>
                    <div className="font-inter pedido-info-value">{formatarValor(pedido.valorUnitario)}</div>
                  </div>
                  <div className="pedido-info-row">
                    <div className="font-inter pedido-info-label">Total</div>
                    <div className="font-inter pedido-info-value pedido-info-total">{formatarValor(pedido.valorTotal)}</div>
                  </div>
                  <div className="pedido-info-divider" />
                  <div className="pedido-acoes-row">
                    <button className="visualizar-pedido-btn font-inter" onClick={() => toggleExpand(pedido._id)}>
                      Visualizar pedido
                    </button>
                    <button className="refazer-pedido-btn font-inter" onClick={() => handleRefazerPedido(pedido.fotos)}>
                      Refazer pedido
                    </button>
                  </div>
                </div>
                {expandedId === pedido._id && (
                  <div className="pedido-photos-list-wrapper">
                    <div className="pedido-photos-list">
                      {pedido.fotos.map((foto, idx) => {
                        return (
                          <div key={idx} className="pedido-photo-item" onClick={() => setFotoExpandida(foto)} style={{cursor: 'pointer'}}>
                            <img 
                              src={foto.url} 
                              alt={foto.nome} 
                              onError={(e) => handleImageError(e, foto)}
                            />
                            <div className="pedido-photo-info">
                              <div className="pedido-photo-name">{foto.nome}</div>
                              {foto.coreografia && (
                                <div className="pedido-photo-coreo">{foto.coreografia}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {fotoExpandida && (
          <div className="foto-expandida-overlay" onClick={() => setFotoExpandida(null)}>
            <div className="foto-expandida-content" onClick={e => e.stopPropagation()}>
              <div className="foto-expandida-img-wrapper" style={{position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%'}}>
                <div className="foto-expandida-nome">{fotoExpandida.nome}</div>
                <img
                  src={fotoExpandida.url}
                  alt={fotoExpandida.nome}
                  onError={(e) => handleImageError(e, fotoExpandida)}
                  className="foto-expandida-img"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
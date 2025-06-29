import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import CoreografiaTop from '../components/CoreografiaTop';
import './FotosPage.css';
import { useCart } from '../components/CartContext';
import CartBtn from '../components/CartBtn';

function FotosPage() {
  const { eventoId, coreografiaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [fotos, setFotos] = useState([]);
  const [coreografias, setCoreografias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { cart, addToCart, removeFromCart } = useCart();
  const [evento, setEvento] = useState(null);
  const [tabelaPreco, setTabelaPreco] = useState(null);

  // Buscar todas as coreografias do evento para navegação
  useEffect(() => {
    fetch(`http://localhost:3001/api/eventos/${encodeURIComponent(eventoId)}/coreografias`)
      .then(res => res.json())
      .then(data => {
        setCoreografias(data.coreografias || []);
      });
  }, [eventoId]);

  // Buscar fotos da coreografia
  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:3001/api/eventos/${encodeURIComponent(eventoId)}/${encodeURIComponent(coreografiaId)}/fotos`)
      .then(res => res.json())
      .then(data => {
        setFotos(data.fotos || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Erro ao carregar fotos');
        setLoading(false);
      });
  }, [eventoId, coreografiaId]);

  // Buscar dados do evento (incluindo tabela de preço)
  useEffect(() => {
    function normalize(str) {
      return decodeURIComponent(str)
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
        .replace(/\s+/g, ' ') // normaliza espaços
        .trim();
    }
    fetch(`http://localhost:3001/api/admin/eventos`)
      .then(res => res.json())
      .then(async data => {
        // Encontrar o evento pelo nome (ignorando case, acentos e espaços)
        const ev = Array.isArray(data)
          ? data.find(e => normalize(e.nome) === normalize(eventoId))
          : null;
        setEvento(ev || null);
        if (ev && ev.tabelaPrecoId) {
          setTabelaPreco(ev.tabelaPrecoId);
        } else {
          // Buscar tabela default
          const resTabela = await fetch('http://localhost:3001/api/admin/tabelas-preco');
          const tabelas = await resTabela.json();
          const tabelaDefault = Array.isArray(tabelas) ? tabelas.find(t => t.isDefault) : null;
          setTabelaPreco(tabelaDefault || null);
        }
      });
  }, [eventoId]);

  // Navegação entre coreografias
  const idx = coreografias.findIndex(c => c.nome === coreografiaId);
  const coreografiaAtual = coreografias[idx];
  const coreografiaAnterior = coreografias[idx - 1];
  const coreografiaProxima = coreografias[idx + 1];

  function isSelected(foto) {
    return cart.some(f => f.nome === foto.nome && f.url === foto.url);
  }

  function toggleFoto(foto) {
    if (isSelected(foto)) {
      removeFromCart(foto);
    } else {
      addToCart({
        ...foto,
        evento: eventoId,
        coreografia: coreografiaId
      });
    }
  }

  function calcularValorUnitario(qtd) {
    if (evento && evento.valorFixo) return Number(evento.valorFixo);
    if (tabelaPreco && tabelaPreco.faixas) {
      // Ordena faixas por min
      const faixas = [...tabelaPreco.faixas].sort((a, b) => a.min - b.min);
      for (const faixa of faixas) {
        const min = Number(faixa.min);
        const max = faixa.max !== undefined && faixa.max !== null && faixa.max !== '' ? Number(faixa.max) : null;
        if (max === null) {
          if (qtd >= min) return Number(faixa.valor);
        } else {
          if (qtd >= min && qtd <= max) return Number(faixa.valor);
        }
      }
    }
    return 0;
  }

  if (loading) return <div>Carregando fotos...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <CoreografiaTop nome={eventoId.replace(/%20/g, ' ')} coreografia={coreografiaId}>
        <div className="coreografia-nav">
          {coreografiaAnterior && (
            <button className="nav-btn" onClick={() => navigate(`/eventos/${eventoId}/${encodeURIComponent(coreografiaAnterior.nome)}/fotos`)}>
              &#8592;
            </button>
          )}
          <span className="coreografia-nav-nome">{coreografiaId}</span>
          {coreografiaProxima && (
            <button className="nav-btn" onClick={() => navigate(`/eventos/${eventoId}/${encodeURIComponent(coreografiaProxima.nome)}/fotos`)}>
              &#8594;
            </button>
          )}
        </div>
        <button
          className="voltar-btn"
          onClick={() => navigate(`/eventos/${eventoId}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'none',
            border: 'none',
            color: '#444',
            fontSize: '1.18rem',
            fontWeight: 500,
            cursor: 'pointer',
            padding: 0,
            
          }}
        >
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '2px solid #888',
            marginRight: 8,
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="9" r="8" stroke="#888" strokeWidth="2" fill="none"/>
              <path d="M10.5 6L7.5 9L10.5 12" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          Voltar a página anterior
        </button>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ cursor: 'pointer' }}>
              <CartBtn />
              {cart.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: '#ffe001',
                  color: '#131313',
                  borderRadius: '50%',
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  border: '2px solid #131313',
                }}>{cart.length}</span>
              )}
            </div>
          </div>
        </div>
      </CoreografiaTop>
      <div className="fotos-grid">
        {fotos.map(foto => (
          <div
            key={foto.nome}
            className={isSelected(foto) ? 'foto-card foto-card-selected' : 'foto-card'}
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => toggleFoto(foto)}
          >
            <img src={foto.url} alt={foto.nome} />
            <div className="foto-nome-overlay">{foto.nome}</div>
            {isSelected(foto) && (
              <span className="foto-check">✓</span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default FotosPage; 
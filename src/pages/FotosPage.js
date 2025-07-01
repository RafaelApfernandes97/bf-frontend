import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import CoreografiaTop from '../components/CoreografiaTop';
import './FotosPage.css';
import '../CoreografiasBody.css';
import { useCart } from '../components/CartContext';
import CartBtn from '../components/CartBtn';
import SquareArrowLeft from '../assets/icons/square_arrow_left_line.svg';
import SquareArrowRight from '../assets/icons/square_arrow_right_line.svg';
import LeftFill from '../assets/icons/left_fill.svg';
import ShoppingCart2Line from '../assets/icons/shopping_cart_2_line.svg';
import CalendarIcon from '../assets/icons/calendar_fill.svg';
import LocationIcon from '../assets/icons/location_on.svg';
import CameraIcon from '../assets/icons/Camera.svg';

const BACKEND_URL = 'https://backend.rfsolutionbr.com.br';

function FotosPage({ setShowCart }) {
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
  const [tabelas, setTabelas] = useState([]);

  // Buscar todas as coreografias do evento para navegação
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/eventos/${encodeURIComponent(eventoId)}/coreografias`)
      .then(res => res.json())
      .then(data => {
        setCoreografias(data.coreografias || []);
      });
  }, [eventoId]);

  // Buscar fotos da coreografia
  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/eventos/${encodeURIComponent(eventoId)}/${encodeURIComponent(coreografiaId)}/fotos`)
      .then(res => res.json())
      .then(async data => {
        const token = localStorage.getItem('user_token');
        const fotosComUrls = await Promise.all(
          (data.fotos || []).map(async (foto) => {
            try {
              const res = await fetch(
                `${BACKEND_URL}/api/usuarios/foto-url/${encodeURIComponent(eventoId)}/${encodeURIComponent(coreografiaId)}/${encodeURIComponent(foto.nome)}`,
                { headers: { Authorization: 'Bearer ' + token } }
              );
              if (res.ok) {
                const d = await res.json();
                return { ...foto, url: d.url };
              }
            } catch {}
            return { ...foto, url: '' };
          })
        );
        setFotos(fotosComUrls);
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
    fetch(`${BACKEND_URL}/api/admin/eventos`)
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
          const resTabela = await fetch(`${BACKEND_URL}/api/admin/tabelas-preco`);
          const tabelasData = await resTabela.json();
          setTabelas(tabelasData);
          const tabelaDefault = Array.isArray(tabelasData) ? tabelasData.find(t => t.isDefault) : null;
          setTabelaPreco(tabelaDefault || null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao carregar dados do evento');
        setLoading(false);
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
              <img src={SquareArrowLeft} alt="Anterior" width={24} height={24} />
            </button>
          )}
          <span className="coreografia-nav-nome">{coreografiaId}</span>
          {coreografiaProxima && (
            <button className="nav-btn" onClick={() => navigate(`/eventos/${eventoId}/${encodeURIComponent(coreografiaProxima.nome)}/fotos`)}>
              <img src={SquareArrowRight} alt="Próxima" width={24} height={24} />
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
            <img src={LeftFill} alt="Voltar" width={18} height={18} />
          </span>
          Voltar a página anterior
        </button>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ cursor: 'pointer' }}>
              <CartBtn
                onClick={() => setShowCart(true)}
                style={{ marginLeft: 16, background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
                icon={<img src={ShoppingCart2Line} alt="Carrinho" width={24} height={24} />}
              />
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
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CoreografiaCard from '../components/CoreografiaCard';
import CoreografiaTop from '../components/CoreografiaTop';
import CartBtn from '../components/CartBtn';
import { useCart } from '../components/CartContext';
import './CoreografiasBody.css';
import '../CoreografiasBody.css';
import './FotosPage.css';
import CalendarIcon from '../assets/icons/calendar_fill.svg';
import LocationIcon from '../assets/icons/location_on.svg';
import CameraIcon from '../assets/icons/Camera.svg';
import LeftFill from '../assets/icons/left_fill.svg';
import ShoppingCart2Line from '../assets/icons/shopping_cart_2_line.svg';

const BACKEND_URL = 'https://backend.rfsolutionbr.com.br/';

function isDiaFolder(nome) {
  // Regex para detectar formato 'dd-mm DiaSemana' ou 'dd-mm Dia'
  return /\d{2}-\d{2} [A-Za-zÀ-ú]+/.test(nome);
}

function isCoreografiaFolder(nome) {
  // Detecta se é uma pasta de coreografia (contém "COREOGRAFIA" no nome)
  return nome.toLowerCase().includes('coreografia');
}

function CoreografiasPage({ setShowCart }) {
  const { eventoId, diaId } = useParams();
  const [dias, setDias] = useState([]); // lista de dias se houver
  const [diaSelecionado, setDiaSelecionado] = useState('');
  const [coreografias, setCoreografias] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evento, setEvento] = useState(null);
  const [caminhoAtual, setCaminhoAtual] = useState('');
  const [historicoNavegacao, setHistoricoNavegacao] = useState([]);
  const { cart, addToCart, removeFromCart } = useCart();
  const navigate = useNavigate();

  // Carregar pastas de dias ou coreografias do evento
  useEffect(() => {
    setLoading(true);
    
    // Primeiro verifica se tem dias
    fetch(`${BACKEND_URL}/api/eventos/${encodeURIComponent(eventoId)}/coreografias`)
      .then(res => res.json())
      .then(data => {
        if (data.coreografias && data.coreografias.length > 0 && isDiaFolder(data.coreografias[0].nome)) {
          // Evento com múltiplos dias
          setDias(data.coreografias);
          setDiaSelecionado(data.coreografias[0].nome); // Seleciona o primeiro dia automaticamente
          setCoreografias([]);
          setFotos([]);
        } else {
          // Evento sem dias - buscar pastas e fotos diretamente
          setDias([]);
          buscarPastasEFotos(eventoId);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Erro ao carregar coreografias');
        setLoading(false);
      });
  }, [eventoId]);

  // Se for múltiplos dias, buscar coreografias do dia selecionado
  useEffect(() => {
    if (dias.length > 0 && diaSelecionado) {
      setLoading(true);
      buscarPastasEFotos(`${eventoId}/${diaSelecionado}`);
    }
  }, [dias, diaSelecionado, eventoId]);

  // Função para buscar pastas e fotos via API unificada
  async function buscarPastasEFotos(caminho) {
    try {
      console.log('[CoreografiasPage] Buscando pastas e fotos para:', caminho);
      setCaminhoAtual(caminho);
      setLoading(true);
      
      const response = await fetch(`${BACKEND_URL}/api/eventos/pasta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caminho }),
      });
      const data = await response.json();
      console.log('[CoreografiasPage] Dados recebidos:', data);
      
      // Ordenar pastas
      const pastasOrdenadas = (data.subpastas || []).slice().sort((a, b) => {
        const nomeA = a.nome || a;
        const nomeB = b.nome || b;
        const numA = parseInt((nomeA.match(/\d+/) || [null])[0], 10);
        const numB = parseInt((nomeB.match(/\d+/) || [null])[0], 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        } else if (!isNaN(numA)) {
          return -1;
        } else if (!isNaN(numB)) {
          return 1;
        } else {
          return nomeA.localeCompare(nomeB, 'pt', { sensitivity: 'base' });
        }
      });
      
      setCoreografias(pastasOrdenadas);
      
      // Processar fotos com URLs assinadas se houver
      if (data.fotos && data.fotos.length > 0) {
        const token = localStorage.getItem('user_token');
        const fotosComUrls = await Promise.all(
          data.fotos.map(async (foto) => {
            try {
              // Construir URL baseada no número de partes do caminho
              const pathParts = caminho.split('/');
              let urlFoto;
              
              if (pathParts.length === 4) {
                // evento/dia/pasta/coreografia
                urlFoto = `${BACKEND_URL}/api/usuarios/foto-url/${encodeURIComponent(pathParts[0])}/${encodeURIComponent(pathParts[1])}/${encodeURIComponent(pathParts[2])}/${encodeURIComponent(pathParts[3])}/${encodeURIComponent(foto.nome)}`;
              } else if (pathParts.length === 2) {
                // evento/coreografia
                urlFoto = `${BACKEND_URL}/api/usuarios/foto-url/${encodeURIComponent(pathParts[0])}/${encodeURIComponent(pathParts[1])}/${encodeURIComponent(foto.nome)}`;
              } else {
                // Usar URL direta se não conseguir determinar
                return { ...foto, url: foto.url || '' };
              }
              
              const res = await fetch(urlFoto, { headers: { Authorization: 'Bearer ' + token } });
              if (res.ok) {
                const d = await res.json();
                return { ...foto, url: d.url, caminho };
              }
            } catch {}
            return { ...foto, url: foto.url || '', caminho };
          })
        );
        setFotos(fotosComUrls);
      } else {
        setFotos([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar pastas e fotos:', error);
      setError('Erro ao carregar dados');
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/admin/eventos`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          setEvento(null);
          return;
        }
        const ev = data.find(e => e.nome === eventoId) || data.find(e => e.nome.toLowerCase() === eventoId.toLowerCase());
        if (ev) {
          setEvento({ ...ev, data: ev.data ? new Date(ev.data).toLocaleDateString('pt-BR') : null });
        } else {
          setEvento(null);
        }
      })
      .catch(() => setEvento(null));
  }, [eventoId]);

  const totalFotos = coreografias.reduce((acc, c) => acc + (c.quantidade || 0), 0) + fotos.length;

  // Funções para carrinho
  function isSelected(foto) {
    return cart.some(f => f.nome === foto.nome && f.url === foto.url);
  }

  function toggleFoto(foto) {
    if (isSelected(foto)) {
      removeFromCart(foto);
    } else {
      const pathParts = foto.caminho.split('/');
      const evento = pathParts[0];
      const dia = pathParts.length > 1 ? pathParts[1] : null;
      const pasta = pathParts.length > 2 ? pathParts[2] : null;
      const coreografia = pathParts.length > 3 ? pathParts[3] : null;
      
      addToCart({ 
        ...foto, 
        evento, 
        dia,
        pasta,
        coreografia
      });
    }
  }

  if (loading) return <div>Carregando coreografias...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <CoreografiaTop nome={eventoId.replace(/%20/g, ' ')}>
        <button
          className="voltar-btn"
          onClick={() => {
            if (caminhoAtual) {
              // Voltar um nível na navegação
              const partesAtual = caminhoAtual.split('/');
              if (dias.length > 0) {
                // Se tem dias, deve ter pelo menos evento/dia
                if (partesAtual.length > 2) {
                  const novoCaminho = partesAtual.slice(0, -1).join('/');
                  buscarPastasEFotos(novoCaminho);
                } else {
                  // Voltar para o dia (mostrar pastas do dia)
                  setCaminhoAtual('');
                  setFotos([]);
                  buscarPastasEFotos(`${eventoId}/${diaSelecionado}`);
                }
              } else {
                // Sem dias
                if (partesAtual.length > 1) {
                  const novoCaminho = partesAtual.slice(0, -1).join('/');
                  buscarPastasEFotos(novoCaminho);
                } else {
                  // Voltar para o evento
                  setCaminhoAtual('');
                  setFotos([]);
                  buscarPastasEFotos(eventoId);
                }
              }
            } else {
              // Voltar para lista de eventos
              navigate('/eventos');
            }
          }}
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
      <div className="evento-info-bar">
        {evento && evento.data && (
          <span className="evento-info-item">
            <img src={CalendarIcon} alt="Data" style={{width:16,marginRight:6,verticalAlign:'middle'}} />
            {evento.data}
          </span>
        )}
        {evento && evento.local && (
          <span className="evento-info-item">
            <img src={LocationIcon} alt="Local" style={{width:16,marginRight:6,verticalAlign:'middle'}} />
            {evento.local}
          </span>
        )}
        <span className="evento-info-item">
          <img src={CameraIcon} alt="Fotos" style={{width:16,marginRight:6,verticalAlign:'middle'}} />
          {totalFotos} fotos
        </span>
      </div>
      
      
      
      {dias.length > 0 && (
        <div className="dias-nav-bar">
          {dias.map((dia) => (
            <button
              key={dia.nome}
              className={diaSelecionado === dia.nome ? 'dia-btn dia-btn-selected' : 'dia-btn'}
              onClick={() => {
                setDiaSelecionado(dia.nome);
                // Resetar caminho quando trocar de dia
                setCaminhoAtual('');
                setFotos([]);
              }}
            >
              {dia.nome}
            </button>
          ))}
        </div>
      )}
      {/* Navegação entre pastas */}
      {coreografias.length > 0 && (
        <div className="body">
          {coreografias.map((coreografia, idx) => (
            <div key={coreografia.nome || coreografia} onClick={() => {
              const nomePasta = coreografia.nome || coreografia;
              const novoCaminho = caminhoAtual ? `${caminhoAtual}/${nomePasta}` : `${eventoId}/${nomePasta}`;
              console.log('[CoreografiasPage] Clicou em pasta:', nomePasta);
              console.log('[CoreografiasPage] Caminho atual:', caminhoAtual);
              console.log('[CoreografiasPage] Novo caminho:', novoCaminho);
              buscarPastasEFotos(novoCaminho);
            }} style={{cursor: 'pointer'}}>
              <CoreografiaCard
                nome={coreografia.nome || coreografia}
                capa={coreografia.capa}
                quantidade={coreografia.quantidade}
                className={`coreografia-instance coreografia-${idx+1}`}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Grid de fotos */}
      {fotos.length > 0 && (
        <div className="fotos-grid">
          {fotos.map((foto, index) => (
            <div
              key={`foto-${index}-${foto.nome}`}
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
      )}
    </>
  );
}

export default CoreografiasPage; 
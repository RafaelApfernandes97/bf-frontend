import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../components/CartContext';
import { NavigationContext } from '../context/NavigationContext';
import CartBtn from '../components/CartBtn';
import CoreografiaCard from '../components/CoreografiaCard';
import CoreografiaTop from '../components/CoreografiaTop';
import VirtualizedPhotoGrid from '../components/VirtualizedPhotoGrid';
import LeftFill from '../assets/icons/left_fill.svg';
import ShoppingCart2Line from '../assets/icons/shopping_cart_2_line.svg';
import SquareArrowLeft from '../assets/icons/square_arrow_left_line.svg';
import SquareArrowRight from '../assets/icons/square_arrow_right_line.svg';
import CalendarIcon from '../assets/icons/calendar_fill.svg';
import LocationIcon from '../assets/icons/location_on.svg';
import CameraIcon from '../assets/icons/Camera.svg';
import './FotosPage.css';
import '../CoreografiasBody.css';
import api, { API_ENDPOINTS, BACKEND_URL } from '../config/api';
import useImagePreloader from '../hooks/useImagePreloader';

function isCoreografiaFolder(nome) {
  return nome.toLowerCase().includes('coreografia');
}

function NavegadorPastasFotosPage({ setShowCart }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, addToCart, removeFromCart } = useCart();
  const { fotosEncontradasIA, filtroIAAtivo } = useContext(NavigationContext);
  const [subpastas, setSubpastas] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evento, setEvento] = useState(null);
  const [coreografias, setCoreografias] = useState([]);
  const [isInCoreografia, setIsInCoreografia] = useState(false);
  const [pastaSelecionada, setPastaSelecionada] = useState(''); // NOVO

  // Extrai o caminho da URL após /eventos/pasta/
  const caminho = decodeURIComponent(location.pathname.replace(/^\/eventos\/pasta\//, ''));
  const partes = caminho ? caminho.split('/').filter(Boolean) : [];
  const eventoNome = partes[0] || '';
  const ultimaParte = partes[partes.length - 1] || '';
  const estaNaCoreografia = isCoreografiaFolder(ultimaParte);

  useEffect(() => {
    setLoading(true);
    setIsInCoreografia(estaNaCoreografia);
    
    if (estaNaCoreografia) {
      // Se estiver em uma coreografia, buscar fotos via API de pastas usando caminho completo
      
      api.post('/eventos/pasta', { caminho })
        .then(res => {
          const data = res.data;
          return (async () => {
          
          // Processar fotos com URLs assinadas
          const fotosComUrls = await Promise.all(
            (data.fotos || []).map(async (foto) => {
              try {
                // Usar caminho completo para gerar URL assinada
                const pathParts = caminho.split('/');
                const evento = pathParts[0];
                const dia = pathParts[1];
                const pastaIntermediaria = pathParts[2];
                const coreografia = pathParts[3];
                
                const urlFoto = `${BACKEND_URL}/api/usuarios/foto-url/${encodeURIComponent(evento)}/${encodeURIComponent(dia)}/${encodeURIComponent(pastaIntermediaria)}/${encodeURIComponent(coreografia)}/${encodeURIComponent(foto.nome)}`;
                const token = localStorage.getItem('user_token');
                const res = await fetch(urlFoto, { headers: { Authorization: 'Bearer ' + token } });
                if (res.ok) {
                  const d = await res.json();
                  return { ...foto, url: d.url };
                }
              } catch {}
              return { ...foto, url: foto.url || '' };
            })
          );
          
          setFotos(fotosComUrls);
          setSubpastas([]);
          setLoading(false);
          })();
        })
        .catch(err => {
          console.error('[NavegadorPastas] Erro ao carregar fotos:', err);
          setError('Erro ao carregar fotos');
          setLoading(false);
        });
    } else {
      // Navegação normal entre pastas
      
      api.post('/eventos/pasta', { caminho })
        .then(res => {
          const data = res.data;
          
          setSubpastas(data.subpastas || []);
          setFotos(data.fotos || []);
          setLoading(false);
          // Se houver subpastas e não estiver em nenhuma, abrir a primeira automaticamente
          if ((data.subpastas || []).length > 0 && partes.length === 1) {
            const primeira = data.subpastas[0].nome || data.subpastas[0];
            setTimeout(() => {
              navigate(`/eventos/pasta/${encodeURIComponent(caminho + '/' + primeira)}`);
            }, 0);
          }
        })
        .catch(err => {
          console.error('[NavegadorPastas] Erro ao carregar pastas:', err);
          setError('Erro ao carregar pastas/fotos');
          setLoading(false);
        });
    }
  }, [caminho, estaNaCoreografia]);

  function isSelected(foto) {
    return cart.some(f => f.nome === foto.nome && f.url === foto.url);
  }

  // Buscar dados do evento
  useEffect(() => {
    if (eventoNome) {
      function normalize(str) {
        return decodeURIComponent(str)
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      api.get('/admin/eventos')
        .then(res => {
          const data = res.data;
          const ev = Array.isArray(data)
            ? data.find(e => normalize(e.nome) === normalize(eventoNome))
            : null;
          setEvento(ev || null);
        })
        .catch(() => setEvento(null));
    }
  }, [eventoNome]);

  // Buscar coreografias para navegação (apenas se estiver em coreografia)
  useEffect(() => {
    if (estaNaCoreografia && partes.length >= 2) {
      const evento = partes[0];
      const dia = partes.length >= 3 ? partes[1] : null;
      
      const endpoint = dia 
        ? `/eventos/${encodeURIComponent(evento)}/${encodeURIComponent(dia)}/coreografias`
        : `/eventos/${encodeURIComponent(evento)}/coreografias`;
      
      api.get(endpoint)
        .then(res => {
          const data = res.data;
          setCoreografias(data.coreografias || []);
        })
        .catch(() => setCoreografias([]));
    }
  }, [estaNaCoreografia, partes]);

  function toggleFoto(foto) {
    if (isSelected(foto)) {
      removeFromCart(foto);
    } else {
      const evento = partes[0];
      const coreografia = partes[partes.length - 1];
      const dia = partes.length >= 3 ? partes[1] : null;
      
      // Verificar se o evento é válido antes de adicionar ao carrinho
      if (!evento || evento === 'undefined') {
        console.error('Erro: tentativa de adicionar foto ao carrinho sem evento válido', { partes, caminho });
        alert('Erro: não foi possível identificar o evento desta foto.');
        return;
      }
      
      addToCart({ 
        ...foto, 
        evento, 
        coreografia: estaNaCoreografia ? coreografia : undefined,
        dia,
        caminho: estaNaCoreografia ? undefined : caminho 
      });
    }
  }

  // Navegação para pasta anterior
  function voltarUmNivel() {
    const partes = caminho ? caminho.split('/').filter(Boolean) : [];
    if (partes.length === 0) {
      navigate('/eventos');
    } else if (partes.length === 1) {
      // Se estiver no primeiro nível, voltar para a página do evento
      navigate(`/eventos/${encodeURIComponent(partes[0])}`);
    } else {
      const novoCaminho = partes.slice(0, -1).join('/');
      navigate(`/eventos/pasta/${encodeURIComponent(novoCaminho)}`);
    }
  }

  function handlePastaClick(pasta) {
    const nomePasta = pasta.nome || pasta;
    const novoCaminho = caminho ? `${caminho}/${nomePasta}` : nomePasta;
    
    // Continuar navegando sempre
    navigate(`/eventos/pasta/${encodeURIComponent(novoCaminho)}`);
  }

  // Navegação entre coreografias
  const coreografiaAtual = ultimaParte;
  const idx = coreografias.findIndex(c => c.nome === coreografiaAtual);
  const coreografiaAnterior = coreografias[idx - 1];
  const coreografiaProxima = coreografias[idx + 1];

  const totalFotos = fotos.length + subpastas.reduce((acc, p) => acc + (p.quantidade || 0), 0);

  // NOVO: Renderizar botões de navegação para subpastas (dias) se houver mais de uma
  const renderBotoesDias = subpastas.length > 1 && !estaNaCoreografia;

  // Determinar quais fotos mostrar (normais ou filtradas por IA)
  const fotosParaMostrar = filtroIAAtivo ? fotosEncontradasIA : fotos;

  // Otimização: Memoizar URLs para pré-carregamento
  const photoUrls = useMemo(() => 
    fotosParaMostrar.map(foto => foto.url), 
    [fotosParaMostrar]
  );

  // Pré-carregar próximas imagens
  useImagePreloader(photoUrls, 10);

  if (loading) return <div>Carregando pastas/fotos...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <CoreografiaTop 
        nome={eventoNome.replace(/%20/g, ' ')} 
        coreografia={!filtroIAAtivo && estaNaCoreografia ? coreografiaAtual : undefined}
        eventoAtual={eventoNome}
      >
        {!filtroIAAtivo && estaNaCoreografia && (
          <div className="coreografia-nav">
            {coreografiaAnterior && (
              <button className="nav-btn" onClick={() => {
                const novoPath = [...partes];
                novoPath[novoPath.length - 1] = coreografiaAnterior.nome;
                navigate(`/eventos/pasta/${encodeURIComponent(novoPath.join('/'))}`);
              }}>
                <img src={SquareArrowLeft} alt="Anterior" width={24} height={24} />
              </button>
            )}
            <span className="coreografia-nav-nome">{coreografiaAtual}</span>
            {coreografiaProxima && (
              <button className="nav-btn" onClick={() => {
                const novoPath = [...partes];
                novoPath[novoPath.length - 1] = coreografiaProxima.nome;
                navigate(`/eventos/pasta/${encodeURIComponent(novoPath.join('/'))}`);
              }}>
                <img src={SquareArrowRight} alt="Próxima" width={24} height={24} />
              </button>
            )}
          </div>
        )}
        {!filtroIAAtivo && (
          <button
            className="voltar-btn"
            onClick={voltarUmNivel}
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
        )}
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
      {!filtroIAAtivo && (
        <div className="evento-info-bar" style={{ margin: '0 16px', padding: '8px 16px' }}>
          {evento && evento.data && (
            <span className="evento-info-item">
              <img src={CalendarIcon} alt="Data" style={{width:16,marginRight:6,verticalAlign:'middle'}} />
              {evento.data ? new Date(evento.data).toLocaleDateString('pt-BR') : ''}
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
      )}
      {/* Botões de navegação de dias/pastas */}
      {!filtroIAAtivo && renderBotoesDias && (
        <div className="dias-nav-bar">
          {subpastas.map((pasta, idx) => {
            const nome = pasta.nome || pasta;
            const selecionado = partes[1] === nome;
            return (
              <button
                key={nome}
                className={selecionado ? 'dia-btn dia-btn-selected' : 'dia-btn'}
                onClick={() => {
                  const novoCaminho = partes[0] + '/' + nome;
                  navigate(`/eventos/pasta/${encodeURIComponent(novoCaminho)}`);
                }}
              >
                {nome}
              </button>
            );
          })}
        </div>
      )}
      {/* Navegação entre pastas */}
      {!filtroIAAtivo && subpastas.length > 0 && (
        <div className="body">
          {subpastas.map((pasta, index) => (
            <div 
              key={`pasta-${index}-${pasta.nome || pasta}`} 
              onClick={() => handlePastaClick(pasta)}
              style={{cursor: 'pointer'}}>
              <CoreografiaCard
                nome={pasta.nome || pasta}
                capa={pasta.capa}
                quantidade={pasta.quantidade}
                className={`coreografia-instance coreografia-${index+1}`}
              />
            </div>
          ))}
        </div>
      )}
      {/* Grid de fotos otimizado */}
      {fotosParaMostrar.length > 0 && (
        <VirtualizedPhotoGrid
          fotos={fotosParaMostrar}
          isSelected={isSelected}
          onPhotoClick={toggleFoto}
          itemsPerPage={15}
        />
      )}
      
      {filtroIAAtivo && fotosEncontradasIA.length === 0 && (
        <div className="no-photos-message">
          <p>Nenhuma foto encontrada com reconhecimento facial.</p>
          <p>Tente com uma selfie mais clara ou remova o filtro para ver todas as fotos.</p>
        </div>
      )}
    </>
  );
}

export default NavegadorPastasFotosPage; 
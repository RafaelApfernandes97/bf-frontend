import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CoreografiaCard from '../components/CoreografiaCard';
import CoreografiaTop from '../components/CoreografiaTop';
import CartBtn from '../components/CartBtn';
import { useCart } from '../components/CartContext';
import { useNavigation } from '../context/NavigationContext';
import './CoreografiasBody.css';
import '../CoreografiasBody.css';
import './FotosPage.css';
import CalendarIcon from '../assets/icons/calendar_fill.svg';
import LocationIcon from '../assets/icons/location_on.svg';
import CameraIcon from '../assets/icons/Camera.svg';
import LeftFill from '../assets/icons/left_fill.svg';
import ShoppingCart2Line from '../assets/icons/shopping_cart_2_line.svg';
import SquareArrowLeft from '../assets/icons/square_arrow_left_line.svg';
import SquareArrowRight from '../assets/icons/square_arrow_right_line.svg';

const BACKEND_URL = 'https://backend.oballetemfoco.com';

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
  const [coreografiasNivelPai, setCoreografiasNivelPai] = useState([]); // Para guardar as coreografias do nível pai
  const { cart, addToCart, removeFromCart } = useCart();
  const { registerBackButtonHandler, clearBackButtonHandler, setViewingPhotos } = useNavigation();
  const navigate = useNavigate();

  // Função para buscar pastas e fotos via API unificada
  async function buscarPastasEFotos(caminho) {
    try {
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
      
      // Se encontramos fotos, significa que estamos em uma pasta de coreografia
      // Então vamos guardar as coreografias do nível pai para navegação
      if (data.fotos && data.fotos.length > 0) {
        // Buscar coreografias do nível pai para navegação
        const caminhoPartes = caminho.split('/');
        if (caminhoPartes.length > 1) {
          const caminhoPai = caminhoPartes.slice(0, -1).join('/');
          
          // Buscar pastas do nível pai
          fetch(`${BACKEND_URL}/api/eventos/pasta`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ caminho: caminhoPai }),
          })
          .then(res => res.json())
          .then(dataPai => {
            if (dataPai.subpastas) {
              const pastasOrdenadas = dataPai.subpastas.slice().sort((a, b) => {
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
              setCoreografiasNivelPai(pastasOrdenadas);
            }
          })
          .catch(err => console.error('Erro ao buscar coreografias do pai:', err));
        }
      } else {
        // Se não há fotos, resetar coreografias do nível pai
        setCoreografiasNivelPai([]);
      }
      
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

  // Carregar pastas de dias ou coreografias do evento
  useEffect(() => {
    setLoading(true);
    
    // Aquece cache do evento em background
    fetch(`${BACKEND_URL}/api/eventos/${encodeURIComponent(eventoId)}/aquecer-cache`, {
      method: 'POST'
    }).catch(err => console.log('Cache warming:', err));
    
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

  // Navegação entre coreografias
  const partesAtual = caminhoAtual.split('/');
  const ultimaPasta = partesAtual.slice(-1)[0];
  
  // Encontrar coreografia atual na lista de coreografias do nível pai
  let idxCoreografiaAtual = -1;
  let coreografiaAtual = null;
  let coreografiaAnterior = null;
  let coreografiaProxima = null;
  
  // Se temos fotos sendo exibidas, significa que estamos dentro de uma pasta de coreografia
  if (fotos.length > 0 && caminhoAtual) {
    // Usar coreografiasNivelPai se disponível, senão usar coreografias
    const listaCoreografias = coreografiasNivelPai.length > 0 ? coreografiasNivelPai : coreografias;
    
    // Procurar pela coreografia atual na lista de coreografias disponíveis
    idxCoreografiaAtual = listaCoreografias.findIndex(c => (c.nome || c) === ultimaPasta);
    if (idxCoreografiaAtual >= 0) {
      coreografiaAtual = listaCoreografias[idxCoreografiaAtual];
      coreografiaAnterior = idxCoreografiaAtual > 0 ? listaCoreografias[idxCoreografiaAtual - 1] : null;
      coreografiaProxima = idxCoreografiaAtual < listaCoreografias.length - 1 ? listaCoreografias[idxCoreografiaAtual + 1] : null;
    }
  }
  
  // Determinar se devemos mostrar a navegação 
  const listaCoreografias = coreografiasNivelPai.length > 0 ? coreografiasNivelPai : coreografias;
  const mostrarNavegacao = fotos.length > 0 && listaCoreografias.length > 1 && idxCoreografiaAtual >= 0;

  // Função para lidar com o botão voltar - memoizada com useCallback
  const handleBackButton = useCallback(() => {
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
  }, [caminhoAtual, dias, eventoId, diaSelecionado, navigate]);

  // Registrar a função no contexto quando o componente monta
  useEffect(() => {
    registerBackButtonHandler(handleBackButton);
    return () => {
      clearBackButtonHandler();
      setViewingPhotos(false); // Limpar estado quando desmontar
    };
  }, [handleBackButton, clearBackButtonHandler, setViewingPhotos]);

  // Registrar quando está visualizando fotos
  useEffect(() => {
    setViewingPhotos(fotos.length > 0);
  }, [fotos.length, setViewingPhotos]);

  if (loading) return <div>Carregando coreografias...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <CoreografiaTop nome={eventoId.replace(/%20/g, ' ')} coreografia={coreografiaAtual?.nome}>
        {/* Navegação entre coreografias no header */}
        {mostrarNavegacao && (
          <div className="coreografia-nav">
            {coreografiaAnterior && (
              <button className="nav-btn" onClick={() => {
                // Navega para a coreografia anterior
                const partes = caminhoAtual.split('/');
                partes[partes.length - 1] = coreografiaAnterior.nome || coreografiaAnterior;
                buscarPastasEFotos(partes.join('/'));
              }}>
                <img src={SquareArrowLeft} alt="Anterior" width={24} height={24} />
              </button>
            )}
            <span className="coreografia-nav-nome">{coreografiaAtual.nome || coreografiaAtual}</span>
            {coreografiaProxima && (
              <button className="nav-btn" onClick={() => {
                // Navega para a próxima coreografia
                const partes = caminhoAtual.split('/');
                partes[partes.length - 1] = coreografiaProxima.nome || coreografiaProxima;
                buscarPastasEFotos(partes.join('/'));
              }}>
                <img src={SquareArrowRight} alt="Próxima" width={24} height={24} />
              </button>
            )}
          </div>
        )}
        {/* Botão voltar só aparece quando está visualizando fotos */}
        {fotos.length > 0 && (
          <button
            className="voltar-btn"
            onClick={handleBackButton}
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
      </CoreografiaTop>
      {/* <div className="evento-info-bar">
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
      </div> */}
      
      
      
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
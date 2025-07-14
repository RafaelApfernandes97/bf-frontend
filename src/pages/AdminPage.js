import React, { useState, useEffect } from 'react';
import FinanceiroAdmin from '../components/FinanceiroAdmin';
import FinanceiroAdminSimple from '../components/FinanceiroAdminSimple';
import './AdminPage.css';
import { API_ENDPOINTS } from '../config/api';

const API = API_ENDPOINTS.ADMIN_BASE;

export default function AdminPage() {
  const [logged, setLogged] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [eventos, setEventos] = useState([]);
  const [eventosMinio, setEventosMinio] = useState([]);
  const [tabelasPreco, setTabelasPreco] = useState([]);
  const [novoEvento, setNovoEvento] = useState({ nome: '', data: '', tabelaPrecoId: '' });
  const [novaTabela, setNovaTabela] = useState({ nome: '', descricao: '', faixas: [{ min: '', max: '', valor: '' }], precoValeCoreografia: '', precoVideo: '', isDefault: false });
  const [valorFixo, setValorFixo] = useState('');
  const [modoFixo, setModoFixo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('eventos'); // 'eventos', 'tabelas' ou 'financeiro'
  const [editEventoId, setEditEventoId] = useState(null);
  const [editEvento, setEditEvento] = useState({});
  const [editTabelaId, setEditTabelaId] = useState(null);
  const [editTabela, setEditTabela] = useState({});
  const [indexando, setIndexando] = useState({}); // { [evento]: true/false }
  const [statusIndexacao, setStatusIndexacao] = useState({}); // { [evento]: mensagem }
  const [progressoIndexacao, setProgressoIndexacao] = useState({}); // { [evento]: progresso }
  const [progressoCarregado, setProgressoCarregado] = useState(false); // Flag para saber se já carregou o progresso inicial
  const [criarPasta, setCriarPasta] = useState(false); // Para cadastro de evento
  const [showCreateModal, setShowCreateModal] = useState(false); // Modal de criar evento
  const [newEvent, setNewEvent] = useState({ nome: '', data: '', tabelaPrecoId: '', valorFixo: '', modoFixo: false, exibirBannerValeCoreografia: false, exibirBannerVideo: false }); // Dados do novo evento
  const [estatisticasIndexacao, setEstatisticasIndexacao] = useState({}); // { [evento]: estatisticas }

  useEffect(() => {
    if (token) {
      console.log('[DEBUG] useEffect - Token encontrado, verificando validade...');
      // Verificar se o token não está expirado
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = tokenPayload.exp * 1000; // Converter para milliseconds
        const currentTime = Date.now();

        console.log('[DEBUG] useEffect - Token expira em:', new Date(expirationTime));
        console.log('[DEBUG] useEffect - Hora atual:', new Date(currentTime));

        if (currentTime >= expirationTime) {
          console.log('[DEBUG] useEffect - Token expirado, fazendo logout...');
          handleLogout();
          return;
        }

        console.log('[DEBUG] useEffect - Token válido, fazendo login automático...');
        setLogged(true);
        fetchEventos();
        fetchEventosMinio();
        fetchTabelasPreco();
        // O progresso será verificado automaticamente pelo próximo useEffect
      } catch (error) {
        console.error('[DEBUG] useEffect - Erro ao decodificar token:', error);
        handleLogout();
      }
    }
    // eslint-disable-next-line
  }, [token]);

  // Carregar estatísticas quando eventos são carregados
  useEffect(() => {
    if (token && eventosMinio.length > 0) {
      fetchTodasEstatisticasIndexacao();
    }
  }, [token, eventosMinio]);

  // Atualizar duração em tempo real para indexações ativas
  useEffect(() => {
    const indexacoesAtivas = Object.keys(indexando).filter(evento => indexando[evento]);

    if (indexacoesAtivas.length === 0) return;

    const interval = setInterval(() => {
      // Força re-render para atualizar duração em tempo real
      setProgressoIndexacao(prev => ({ ...prev }));
    }, 1000); // Atualiza a cada segundo

    return () => clearInterval(interval);
  }, [indexando]);

  // Verificar progresso de indexação periodicamente
  useEffect(() => {
    if (!token || eventosMinio.length === 0) return;

    // Primeira verificação ou se há alguma indexação ativa
    const temIndexacaoAtiva = Object.values(indexando).some(valor => valor);
    if (!progressoCarregado || temIndexacaoAtiva) {
      // Verifica imediatamente se necessário
      if (!progressoCarregado) {
        verificarProgressoIndexacao();
      }

      const interval = setInterval(() => {
        verificarProgressoIndexacao();
      }, 3000); // Verificar a cada 3 segundos

      return () => clearInterval(interval);
    }
  }, [token, eventosMinio, indexando, progressoCarregado]);

  async function fetchEventos(customToken = null) {
    const tokenToUse = customToken || token;
    setLoading(true);
    try {
      console.log('[DEBUG] fetchEventos - Fazendo requisição com token:', tokenToUse ? tokenToUse.substring(0, 20) + '...' : 'undefined');
      const res = await fetch(`${API}/eventos`, {
        headers: { Authorization: `Bearer ${tokenToUse}` }
      });

      console.log('[DEBUG] fetchEventos - Status da resposta:', res.status);

      if (res.status === 401) {
        console.log('Token expirado ou inválido, fazendo logout...');
        const errorData = await res.json().catch(() => ({}));
        console.log('Detalhes do erro 401:', errorData);
        handleLogout();
        return;
      }

      const data = await res.json();
      setEventos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      setEventos([]);
    }
    setLoading(false);
  }

  async function fetchEventosMinio(customToken = null) {
    const tokenToUse = customToken || token;
    try {
      const res = await fetch(`${API}/eventos-minio`, {
        headers: { Authorization: `Bearer ${tokenToUse}` }
      });

      if (res.status === 401) {
        console.log('Token expirado, fazendo logout...');
        handleLogout();
        return;
      }

      const data = await res.json();
      setEventosMinio(Array.isArray(data) ? data : []);
      // Reset progresso quando a lista de eventos mudar
      setProgressoCarregado(false);
    } catch {
      setEventosMinio([]);
      setProgressoCarregado(false);
    }
  }

  async function fetchTabelasPreco(customToken = null) {
    const tokenToUse = customToken || token;
    try {
      const res = await fetch(`${API}/tabelas-preco`, {
        headers: { Authorization: `Bearer ${tokenToUse}` }
      });

      if (res.status === 401) {
        console.log('Token expirado, fazendo logout...');
        handleLogout();
        return;
      }

      const data = await res.json();
      setTabelasPreco(Array.isArray(data) ? data : []);
    } catch {
      setTabelasPreco([]);
    }
  }

  async function verificarProgressoIndexacao() {
    try {
      const novosProgressos = { ...progressoIndexacao };
      const novosIndexando = { ...indexando };
      const novosStatus = { ...statusIndexacao };

      // Na primeira vez, carrega o progresso de todos os eventos
      let eventosParaVerificar;
      if (!progressoCarregado) {
        eventosParaVerificar = eventosMinio;
      } else {
        // Depois, só verifica eventos que estão indexando
        eventosParaVerificar = eventosMinio.filter(evento => indexando[evento]);
      }

      // Se não há nenhum evento para verificar, sai
      if (eventosParaVerificar.length === 0) {
        return;
      }

      for (const evento of eventosParaVerificar) {
        const res = await fetch(`${API}/eventos/${evento}/progresso-indexacao`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const progresso = await res.json();

        novosProgressos[evento] = progresso;
        novosIndexando[evento] = progresso.ativo;

        if (progresso.ativo) {
          novosStatus[evento] = progresso.fotoAtual;
        } else if (progresso.finalizadoEm) {
          novosStatus[evento] = progresso.fotoAtual;
          // Atualizar estatísticas quando indexação terminar
          await fetchEstatisticasIndexacao(evento);

          // Limpar progresso após 10 segundos para dar tempo de ler a mensagem final
          setTimeout(() => {
            setProgressoIndexacao(prev => {
              const updated = { ...prev };
              delete updated[evento];
              return updated;
            });
            setStatusIndexacao(prev => {
              const updated = { ...prev };
              delete updated[evento];
              return updated;
            });
          }, 10000); // 10 segundos
        }
      }

      setProgressoIndexacao(novosProgressos);
      setIndexando(novosIndexando);
      setStatusIndexacao(novosStatus);

      // Marca como carregado após a primeira verificação
      if (!progressoCarregado) {
        setProgressoCarregado(true);
      }
    } catch (error) {
      console.error('Erro ao verificar progresso:', error);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    console.log('[DEBUG] handleLogin - Iniciando login...');
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      console.log('[DEBUG] handleLogin - Status da resposta:', res.status);
      const data = await res.json();
      console.log('[DEBUG] handleLogin - Dados da resposta:', data);

      if (data.token) {
        console.log('[DEBUG] handleLogin - Token recebido, salvando...');
        localStorage.setItem('admin_token', data.token);
        setToken(data.token);
        setLogged(true);

        // Fazer chamadas usando o token recebido diretamente
        console.log('[DEBUG] handleLogin - Fazendo chamadas pós-login...');
        await Promise.all([
          fetchEventos(data.token),
          fetchEventosMinio(data.token), 
          fetchTabelasPreco(data.token)
        ]);
      }
    } catch (error) {
      console.error('[DEBUG] handleLogin - Erro na requisição:', error);
      alert('Erro ao conectar ao servidor');
    }
  }

  async function handleAddEvento(e) {
    e.preventDefault();
    setLoading(true);
    const body = {
      nome: novoEvento.nome,
      data: novoEvento.data || undefined,
      valorFixo: modoFixo ? valorFixo : undefined,
      tabelaPrecoId: modoFixo ? undefined : novoEvento.tabelaPrecoId,
      criarPasta
    };
    try {
      await fetch(`${API}/eventos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      setNovoEvento({ nome: '', data: '', tabelaPrecoId: '' });
      setValorFixo('');
      setCriarPasta(false);
      fetchEventos();
    } catch {
      alert('Erro ao cadastrar evento');
    }
    setLoading(false);
  }

  async function handleAddTabela(e) {
    e.preventDefault();
    setLoading(true);
    const body = {
      ...novaTabela,
      faixas: novaTabela.faixas.filter(f => f.min && f.valor),
      precoValeCoreografia: novaTabela.precoValeCoreografia ? parseFloat(novaTabela.precoValeCoreografia) : 0,
      precoVideo: novaTabela.precoVideo ? parseFloat(novaTabela.precoVideo) : 0
    };
    try {
      const response = await fetch(`${API}/tabelas-preco`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setNovaTabela({ nome: '', descricao: '', faixas: [{ min: '', max: '', valor: '' }], precoValeCoreografia: '', precoVideo: '', isDefault: false });
      fetchTabelasPreco();
    } catch (error) {
      console.error('Erro ao cadastrar tabela de preço:', error);
      alert('Erro ao cadastrar tabela de preço');
    }
    setLoading(false);
  }

  async function handleDeleteEvento(id) {
    if (!window.confirm('Tem certeza que deseja remover este evento?')) return;
    setLoading(true);
    try {
      await fetch(`${API}/eventos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEventos();
    } catch {
      alert('Erro ao remover evento');
    }
    setLoading(false);
  }

  async function handleDeleteTabela(id) {
    if (!window.confirm('Tem certeza que deseja remover esta tabela de preço?')) return;
    setLoading(true);
    try {
      await fetch(`${API}/tabelas-preco/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTabelasPreco();
    } catch {
      alert('Erro ao remover tabela de preço');
    }
    setLoading(false);
  }

  function handleTabelaChange(idx, field, value) {
    setNovaTabela(tp => ({
      ...tp,
      faixas: tp.faixas.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    }));
  }

  function addFaixa() {
    setNovaTabela(tp => ({
      ...tp,
      faixas: [...tp.faixas, { min: '', max: '', valor: '' }]
    }));
  }

  function removeFaixa(idx) {
    setNovaTabela(tp => ({
      ...tp,
      faixas: tp.faixas.filter((_, i) => i !== idx)
    }));
  }

  function handleLogout() {
    setToken('');
    setLogged(false);
    localStorage.removeItem('admin_token');
    setEventos([]);
    setEventosMinio([]);
    setTabelasPreco([]);
    setEstatisticasIndexacao({});
    setIndexando({});
    setProgressoIndexacao({});
    setStatusIndexacao({});
    setProgressoCarregado(false);
  }

  async function handleEditEvento(ev) {
    setEditEventoId(ev._id);
    setEditEvento({
      nome: ev.nome,
      data: ev.data ? ev.data.slice(0, 10) : '',
      local: ev.local || '',
      valorFixo: ev.valorFixo || '',
      tabelaPrecoId: ev.tabelaPrecoId?._id || ev.tabelaPrecoId || '',
      exibirBannerValeCoreografia: ev.exibirBannerValeCoreografia || false,
      exibirBannerVideo: ev.exibirBannerVideo || false,
    });
  }

  async function handleSaveEditEvento(e) {
    e.preventDefault();
    setLoading(true);
    const body = {
      ...editEvento,
      valorFixo: editEvento.valorFixo || undefined,
      tabelaPrecoId: editEvento.valorFixo ? undefined : editEvento.tabelaPrecoId,
      exibirBannerValeCoreografia: editEvento.exibirBannerValeCoreografia,
      exibirBannerVideo: editEvento.exibirBannerVideo
    };
    
    try {
      const response = await fetch(`${API}/eventos/${editEventoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        setEditEventoId(null);
        fetchEventos();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Erro ao editar evento: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      alert(`Erro ao editar evento: ${error.message}`);
    }
    setLoading(false);
  }

  async function handleEditTabela(tp) {
    setEditTabelaId(tp._id);
    setEditTabela({
      nome: tp.nome || '',
      descricao: tp.descricao || '',
      isDefault: tp.isDefault || false,
      faixas: tp.faixas ? tp.faixas.map(f => ({ ...f })) : [{ min: '', max: '', valor: '' }],
      precoValeCoreografia: tp.precoValeCoreografia != null ? tp.precoValeCoreografia.toString() : '',
      precoVideo: tp.precoVideo != null ? tp.precoVideo.toString() : '',
    });
  }

  function handleEditTabelaChange(idx, field, value) {
    setEditTabela(tp => ({
      ...tp,
      faixas: tp.faixas.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    }));
  }

  function addEditFaixa() {
    setEditTabela(tp => ({
      ...tp,
      faixas: [...tp.faixas, { min: '', max: '', valor: '' }]
    }));
  }

  function removeEditFaixa(idx) {
    setEditTabela(tp => ({
      ...tp,
      faixas: tp.faixas.filter((_, i) => i !== idx)
    }));
  }

  async function handleSaveEditTabela(e) {
    e.preventDefault();
    setLoading(true);
    const body = {
      ...editTabela,
      faixas: editTabela.faixas.filter(f => f.min && f.valor),
      precoValeCoreografia: editTabela.precoValeCoreografia ? parseFloat(editTabela.precoValeCoreografia) : 0,
      precoVideo: editTabela.precoVideo ? parseFloat(editTabela.precoVideo) : 0
    };
    try {
      const response = await fetch(`${API}/tabelas-preco/${editTabelaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setEditTabelaId(null);
      setEditTabela({});
      fetchTabelasPreco();
    } catch (error) {
      console.error('Erro ao editar tabela:', error);
      alert('Erro ao editar tabela');
    }
    setLoading(false);
  }

  const handleIndexarFotos = async (evento) => {
    try {
      const resp = await fetch(`${API}/eventos/${evento}/indexar-fotos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await resp.json();
      if (resp.ok) {
        // Indexação iniciada em background, o progresso será atualizado automaticamente
        setStatusIndexacao(prev => ({ ...prev, [evento]: 'Indexação iniciada...' }));
        setIndexando(prev => ({ ...prev, [evento]: true }));
        // Buscar estatísticas atualizadas
        await fetchEstatisticasIndexacao(evento);
      } else {
        setStatusIndexacao(prev => ({ ...prev, [evento]: data.erro || 'Erro ao indexar fotos.' }));
      }
    } catch (err) {
      console.error('Erro ao indexar fotos:', err);
      setStatusIndexacao(prev => ({ ...prev, [evento]: 'Erro ao indexar fotos.' }));
    }
  };

  const fetchEstatisticasIndexacao = async (evento) => {
    try {
      console.log(`[DEBUG] Buscando estatísticas para evento: ${evento}`);
      const resp = await fetch(`${API}/eventos/${evento}/estatisticas-indexacao`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        console.log(`[DEBUG] Estatísticas recebidas para ${evento}:`, data);
        setEstatisticasIndexacao(prev => ({ ...prev, [evento]: data }));
      } else {
        console.error(`[DEBUG] Erro ao buscar estatísticas para ${evento}:`, resp.status, resp.statusText);
      }
    } catch (err) {
      console.error(`[DEBUG] Erro ao buscar estatísticas de indexação para ${evento}:`, err);
    }
  };

  // Nova função para diagnóstico detalhado
  const executarDiagnostico = async (evento) => {
    try {
      console.log(`[DIAGNOSTICO] Executando diagnóstico para evento: ${evento}`);
      const resp = await fetch(`${API}/eventos/${evento}/diagnostico-indexacao`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        console.log(`[DIAGNOSTICO] Resultado detalhado para ${evento}:`, data);
        
        // Mostrar resultado em formato legível
        const resultado = `
=== DIAGNÓSTICO DE INDEXAÇÃO ===
Evento: ${data.evento}
Data: ${new Date(data.timestamp).toLocaleString()}

CONTAGENS:
- Total de registros: ${data.contagens.total}
- Fotos indexadas: ${data.contagens.indexadas}
- Fotos com erro: ${data.contagens.erros}
- Fotos processando: ${data.contagens.processando}
- Não classificados: ${data.contagens.naoClassificados}

EXEMPLOS DE FOTOS INDEXADAS:
${data.exemplos.indexadas.map(f => `- ${f.nomeArquivo} (${new Date(f.indexadaEm).toLocaleString()})`).join('\n')}

EXEMPLOS DE FOTOS COM ERRO:
${data.exemplos.erros.map(f => `- ${f.nomeArquivo} (${f.erroDetalhes || 'Sem detalhes'})`).join('\n')}

DUPLICADOS ENCONTRADOS:
${data.duplicados.length > 0 ? data.duplicados.map(d => `- ${d._id} (${d.count} ocorrências)`).join('\n') : 'Nenhum duplicado encontrado'}
        `;
        
        alert(resultado);
        
        // Atualizar estatísticas após diagnóstico
        await fetchEstatisticasIndexacao(evento);
      } else {
        console.error(`[DIAGNOSTICO] Erro na requisição para ${evento}:`, resp.status);
        alert(`Erro ao executar diagnóstico: ${resp.status}`);
      }
    } catch (err) {
      console.error(`[DIAGNOSTICO] Erro para evento ${evento}:`, err);
      alert(`Erro ao executar diagnóstico: ${err.message}`);
    }
  };

  const fetchTodasEstatisticasIndexacao = async () => {
    if (!eventosMinio || eventosMinio.length === 0) return;

    for (const evento of eventosMinio) {
      await fetchEstatisticasIndexacao(evento);
    }
  };

  const invalidarCacheEvento = async (evento) => {
    try {
      const resp = await fetch(`${API}/eventos/${evento}/invalidar-cache`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (resp.ok) {
        // Recarregar dados após invalidar cache
        await fetchEventosMinio();
        await fetchEstatisticasIndexacao(evento);
        alert(`Cache invalidado para evento: ${evento}`);
      } else {
        alert('Erro ao invalidar cache');
      }
    } catch (err) {
      console.error('Erro ao invalidar cache:', err);
      alert('Erro ao invalidar cache');
    }
  };

  // Função para formatar timestamp
  const formatarTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const data = new Date(timestamp);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Função para calcular duração
  const calcularDuracao = (inicio, fim) => {
    if (!inicio || !fim) return '';
    const duracaoMs = new Date(fim) - new Date(inicio);
    const duracaoSegundos = Math.round(duracaoMs / 1000);

    if (duracaoSegundos < 60) {
      return `${duracaoSegundos}s`;
    } else if (duracaoSegundos < 3600) {
      const minutos = Math.floor(duracaoSegundos / 60);
      const segundos = duracaoSegundos % 60;
      return `${minutos}m ${segundos}s`;
    } else {
      const horas = Math.floor(duracaoSegundos / 3600);
      const minutos = Math.floor((duracaoSegundos % 3600) / 60);
      const segundos = duracaoSegundos % 60;
      return `${horas}h ${minutos}m ${segundos}s`;
    }
  };

  // Função para estimar tempo restante
  const estimarTempoRestante = (progresso) => {
    if (!progresso.iniciadoEm || !progresso.processadas || progresso.processadas === 0) {
      return '';
    }

    const tempoDecorrido = (new Date() - new Date(progresso.iniciadoEm)) / 1000; // em segundos
    const velocidade = progresso.processadas / tempoDecorrido; // fotos por segundo
    const fotosRestantes = progresso.total - progresso.processadas;
    const tempoRestanteSegundos = Math.round(fotosRestantes / velocidade);

    if (tempoRestanteSegundos < 60) {
      return `~${tempoRestanteSegundos}s restantes`;
    } else if (tempoRestanteSegundos < 3600) {
      const minutos = Math.floor(tempoRestanteSegundos / 60);
      const segundos = tempoRestanteSegundos % 60;
      return `~${minutos}m ${segundos}s restantes`;
    } else {
      const horas = Math.floor(tempoRestanteSegundos / 3600);
      const minutos = Math.floor((tempoRestanteSegundos % 3600) / 60);
      return `~${horas}h ${minutos}m restantes`;
    }
  };




  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setLoading(true);

    const body = {
      nome: newEvent.nome,
      data: newEvent.data || undefined,
      valorFixo: newEvent.modoFixo ? newEvent.valorFixo : undefined,
      tabelaPrecoId: newEvent.modoFixo ? undefined : newEvent.tabelaPrecoId,
      criarPasta: true, // Sempre criar pasta para eventos criados no modal
      exibirBannerValeCoreografia: newEvent.exibirBannerValeCoreografia,
      exibirBannerVideo: newEvent.exibirBannerVideo
    };

    try {
      await fetch(`${API}/eventos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      setNewEvent({ nome: '', data: '', tabelaPrecoId: '', valorFixo: '', modoFixo: false, exibirBannerValeCoreografia: false, exibirBannerVideo: false });
      setShowCreateModal(false);
      fetchEventos();
      fetchEventosMinio(); // Atualiza lista do MinIO também

    } catch {
      alert('Erro ao criar evento');
    }
    setLoading(false);
  };

  if (!logged) {
    return (
      <div style={{ maxWidth: 320, margin: '80px auto', background: '#222', padding: 32, borderRadius: 12, color: '#fff' }}>
        <h2>Admin - Login</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Usuário" value={user} onChange={e => setUser(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 8 }} />
          <input type="password" placeholder="Senha" value={pass} onChange={e => setPass(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 8 }} />
          <button type="submit" style={{ width: '100%', padding: 10, background: '#ffe001', color: '#222', fontWeight: 700, border: 'none', borderRadius: 8 }}>Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Painel Administrativo</h2>
        <button onClick={handleLogout} className="admin-logout-btn">Sair</button>
      </div>

      {/* Abas */}
      <div className="admin-tabs">
        <button
          onClick={() => setActiveTab('eventos')}
          className={`admin-tab-btn ${activeTab === 'eventos' ? 'active' : ''}`}
        >
          Eventos
        </button>
        <button
          onClick={() => setActiveTab('tabelas')}
          className={`admin-tab-btn ${activeTab === 'tabelas' ? 'active' : ''}`}
        >
          Tabelas de Preço
        </button>
        <button
          onClick={() => setActiveTab('financeiro')}
          className={`admin-tab-btn ${activeTab === 'financeiro' ? 'active' : ''}`}
        >
          Financeiro
        </button>
      </div>

      {activeTab === 'eventos' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Cadastro de Evento</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Criar Evento
            </button>
          </div>
          <form onSubmit={handleAddEvento} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <select value={novoEvento.nome} onChange={e => setNovoEvento(ev => ({ ...ev, nome: e.target.value }))} style={{ flex: 2, padding: 8 }} required>
                <option value="">Selecione um evento do MinIO</option>
                {eventosMinio.map(ev => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
              <input type="date" placeholder="Data (opcional)" value={novoEvento.data} onChange={e => setNovoEvento(ev => ({ ...ev, data: e.target.value }))} style={{ flex: 1, padding: 8 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                <input type="checkbox" checked={modoFixo} onChange={e => setModoFixo(e.target.checked)} /> Valor fixo para todas as fotos
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                <input type="checkbox" checked={criarPasta} onChange={e => setCriarPasta(e.target.checked)} /> Criar pasta no S3 automaticamente
              </label>
            </div>
            {modoFixo ? (
              <input type="number" placeholder="Valor fixo (R$)" value={valorFixo} onChange={e => setValorFixo(e.target.value)} style={{ width: 180, padding: 8, marginBottom: 12 }} />
            ) : (
              <div style={{ marginBottom: 12 }}>
                <strong>Selecione uma tabela de preço:</strong>
                <select value={novoEvento.tabelaPrecoId} onChange={e => setNovoEvento(ev => ({ ...ev, tabelaPrecoId: e.target.value }))} style={{ width: 300, padding: 8, marginLeft: 12 }}>
                  <option value="">Selecione uma tabela (ou use a default)</option>
                  {tabelasPreco.map(tp => (
                    <option key={tp._id} value={tp._id}>{tp.nome} {tp.isDefault ? '(Default)' : ''}</option>
                  ))}
                </select>
              </div>
            )}
            <button type="submit" style={{ background: '#ffe001', color: '#222', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 24px', marginTop: 8 }} disabled={loading}>{loading ? 'Salvando...' : 'Cadastrar evento'}</button>
          </form>

          <h3>Eventos cadastrados</h3>
          {loading && <div>Carregando...</div>}
          <ul>
            {Array.isArray(eventos) && eventos.map((ev, idx) => (
              <li
                key={ev._id || idx}
                style={{
                  marginBottom: 12,
                  background: '#222',
                  padding: 12,
                  borderRadius: 8
                }}
              >
                {editEventoId === ev._id ? (
                  <form onSubmit={handleSaveEditEvento} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input type="text" value={editEvento.nome} onChange={e => setEditEvento(ev2 => ({ ...ev2, nome: e.target.value }))} placeholder="Nome" style={{ padding: 6 }} required />
                    <input type="text" value={editEvento.local || ''} onChange={e => setEditEvento(ev2 => ({ ...ev2, local: e.target.value }))} placeholder="Local" style={{ padding: 6 }} />
                    <input type="date" value={editEvento.data} onChange={e => setEditEvento(ev2 => ({ ...ev2, data: e.target.value }))} style={{ padding: 6 }} />
                    <label><input type="checkbox" checked={!!editEvento.valorFixo} onChange={e => setEditEvento(ev2 => ({ ...ev2, valorFixo: e.target.checked ? (ev.valorFixo || 1) : '' }))} /> Valor fixo</label>
                    {editEvento.valorFixo ? (
                      <input type="number" value={editEvento.valorFixo} onChange={e => setEditEvento(ev2 => ({ ...ev2, valorFixo: e.target.value }))} placeholder="Valor fixo" style={{ padding: 6 }} />
                    ) : (
                      <select value={editEvento.tabelaPrecoId} onChange={e => setEditEvento(ev2 => ({ ...ev2, tabelaPrecoId: e.target.value }))} style={{ padding: 6 }}>
                        <option value="">Selecione uma tabela</option>
                        {tabelasPreco.map(tp => (
                          <option key={tp._id} value={tp._id}>{tp.nome} {tp.isDefault ? '(Default)' : ''}</option>
                        ))}
                      </select>
                    )}
                    
                    {/* Controle dos Banners */}
                    <div style={{ padding: 12, backgroundColor: '#444', borderRadius: 6, marginTop: 8 }}>
                      <div style={{ marginBottom: 8, color: '#ffe001', fontWeight: 600 }}>Configuração dos Banners:</div>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <input
                          type="checkbox"
                          checked={editEvento.exibirBannerValeCoreografia || false}
                          onChange={e => setEditEvento(ev2 => ({ ...ev2, exibirBannerValeCoreografia: e.target.checked }))}
                        />
                        <span style={{ fontSize: 14 }}>Exibir Banner "Vale Coreografia"</span>
                      </label>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="checkbox"
                          checked={editEvento.exibirBannerVideo || false}
                          onChange={e => setEditEvento(ev2 => ({ ...ev2, exibirBannerVideo: e.target.checked }))}
                        />
                        <span style={{ fontSize: 14 }}>Exibir Banner "Video"</span>
                      </label>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" style={{ background: '#ffe001', color: '#222', fontWeight: 700, border: 'none', borderRadius: 6, padding: '6px 18px' }}>Salvar</button>
                      <button type="button" onClick={() => setEditEventoId(null)} style={{ background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px' }}>Cancelar</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{ev.nome}</strong> - {ev.data ? new Date(ev.data).toLocaleDateString() : ''}
                      </div>
                      <div>
                        <button onClick={() => handleEditEvento(ev)} style={{ background: '#ffe001', color: '#222', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 700, marginLeft: 8 }}>Editar</button>
                        <button onClick={() => handleDeleteEvento(ev._id)} style={{ background: '#ffe001', color: '#222', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 700, marginLeft: 8 }}>Remover</button>
                      </div>
                    </div>
                    <div>
                      {ev.valorFixo ? (
                        <span>Valor fixo: <b>R${ev.valorFixo}</b></span>
                      ) : (
                        <div>
                          <b>Tabela:</b> {ev.tabelaPrecoId ? ev.tabelaPrecoId.nome : 'Default'}
                          {ev.tabelaPrecoId && ev.tabelaPrecoId.faixas && (
                            <ul>
                              {ev.tabelaPrecoId.faixas.map((faixa, i) => (
                                <li key={i}>De {faixa.min} até {faixa.max} fotos: <b>R${faixa.valor}</b></li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Estatísticas de Indexação */}
                    {estatisticasIndexacao[ev.nome] && (
                      <div style={{
                        marginTop: 12,
                        padding: 12,
                        backgroundColor: '#333',
                        borderRadius: 6,
                        border: '1px solid #555'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <strong style={{ color: '#ffe001' }}>📊 Status da Indexação</strong>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => fetchEstatisticasIndexacao(ev.nome)}
                              style={{
                                background: 'transparent',
                                border: '1px solid #666',
                                color: '#fff',
                                borderRadius: 4,
                                padding: '2px 8px',
                                fontSize: 12,
                                cursor: 'pointer'
                              }}
                            >
                              🔄 Atualizar
                            </button>
                            <button
                              onClick={() => invalidarCacheEvento(ev.nome)}
                              style={{
                                background: 'transparent',
                                border: '1px solid #ffc107',
                                color: '#ffc107',
                                borderRadius: 4,
                                padding: '2px 8px',
                                fontSize: 12,
                                cursor: 'pointer'
                              }}
                              title="Invalidar cache para carregar novos arquivos do S3"
                            >
                              🧹 Limpar Cache
                            </button>
                            <button
                              onClick={() => executarDiagnostico(ev.nome)}
                              style={{
                                background: 'transparent',
                                border: '1px solid #007bff',
                                color: '#007bff',
                                borderRadius: 4,
                                padding: '2px 8px',
                                fontSize: 12,
                                cursor: 'pointer'
                              }}
                              title="Executar diagnóstico detalhado"
                            >
                              🔍 Diagnóstico
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, fontSize: 14 }}>
                          <div>
                            <span style={{ color: '#aaa' }}>Total S3:</span>
                            <div style={{ fontWeight: 'bold', color: '#fff' }}>{estatisticasIndexacao[ev.nome].totalFotosS3}</div>
                          </div>
                          <div>
                            <span style={{ color: '#aaa' }}>Indexadas:</span>
                            <div style={{ fontWeight: 'bold', color: '#28a745' }}>{estatisticasIndexacao[ev.nome].fotosIndexadas}</div>
                          </div>
                          <div>
                            <span style={{ color: '#aaa' }}>Com Erro:</span>
                            <div style={{ fontWeight: 'bold', color: '#dc3545' }}>{estatisticasIndexacao[ev.nome].fotosComErro}</div>
                          </div>
                          <div>
                            <span style={{ color: '#aaa' }}>Não Indexadas:</span>
                            <div style={{ fontWeight: 'bold', color: '#ffc107' }}>{estatisticasIndexacao[ev.nome].fotosNaoIndexadas}</div>
                          </div>
                        </div>

                        <div style={{ marginTop: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#aaa' }}>
                            <span>Progresso da Indexação</span>
                            <span>{estatisticasIndexacao[ev.nome].percentualIndexado}%</span>
                          </div>
                          <div style={{
                            height: 6,
                            backgroundColor: '#555',
                            borderRadius: 3,
                            overflow: 'hidden',
                            marginTop: 4
                          }}>
                            <div
                              style={{
                                height: '100%',
                                backgroundColor: estatisticasIndexacao[ev.nome].percentualIndexado === 100 ? '#28a745' : '#007bff',
                                width: `${estatisticasIndexacao[ev.nome].percentualIndexado}%`,
                                transition: 'width 0.3s ease'
                              }}
                            ></div>
                          </div>
                        </div>

                        {estatisticasIndexacao[ev.nome].ultimaIndexacao && (
                          <div style={{ marginTop: 8, fontSize: 12, color: '#aaa' }}>
                            Última indexação: {new Date(estatisticasIndexacao[ev.nome].ultimaIndexacao).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ marginTop: 8 }}>
                      <button
                        onClick={() => handleIndexarFotos(ev.nome)}
                        disabled={indexando[ev.nome]}
                        className="admin-indexar-btn"
                      >
                        {indexando[ev.nome] ? 'Indexando...' : 'Indexar fotos no Rekognition'}
                      </button>
                    </div>
                    {statusIndexacao[ev.nome] && (
                      <div className="admin-indexar-status">{statusIndexacao[ev.nome]}</div>
                    )}
                    {progressoIndexacao[ev.nome] && progressoIndexacao[ev.nome].total > 0 && (
                      <div className="admin-progresso-container">
                        <div className="admin-progresso-info">
                          <span>Progresso: {progressoIndexacao[ev.nome].processadas || 0} de {progressoIndexacao[ev.nome].total}</span>
                          <span>Indexadas: {progressoIndexacao[ev.nome].indexadas || 0}</span>
                          <span>Erros: {progressoIndexacao[ev.nome].erros || 0}</span>
                          {progressoIndexacao[ev.nome].ativo && progressoIndexacao[ev.nome].iniciadoEm && progressoIndexacao[ev.nome].processadas > 0 && (
                            <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                              🚀 {((progressoIndexacao[ev.nome].processadas / ((new Date() - new Date(progressoIndexacao[ev.nome].iniciadoEm)) / 1000))).toFixed(1)} fotos/s
                            </span>
                          )}
                        </div>

                        {/* Timestamps de início e término */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 12,
                          color: '#aaa',
                          marginTop: 8,
                          marginBottom: 4
                        }}>
                          <div>
                            {progressoIndexacao[ev.nome].iniciadoEm && (
                              <span>
                                🕐 Início: {formatarTimestamp(progressoIndexacao[ev.nome].iniciadoEm)}
                              </span>
                            )}
                          </div>
                          <div>
                            {progressoIndexacao[ev.nome].finalizadoEm ? (
                              <span style={{ color: '#28a745' }}>
                                ✅ Término: {formatarTimestamp(progressoIndexacao[ev.nome].finalizadoEm)}
                              </span>
                            ) : progressoIndexacao[ev.nome].ativo && (
                              <span style={{ color: '#ffc107' }}>
                                ⏳ Em andamento...
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Duração e Tempo Restante */}
                        {progressoIndexacao[ev.nome].iniciadoEm && (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 12,
                            marginBottom: 8,
                            fontWeight: 'bold'
                          }}>
                            <div style={{ color: '#007bff' }}>
                              ⏱️ Duração: {progressoIndexacao[ev.nome].finalizadoEm
                                ? calcularDuracao(progressoIndexacao[ev.nome].iniciadoEm, progressoIndexacao[ev.nome].finalizadoEm)
                                : calcularDuracao(progressoIndexacao[ev.nome].iniciadoEm, new Date())
                              }
                            </div>
                            {!progressoIndexacao[ev.nome].finalizadoEm && progressoIndexacao[ev.nome].ativo && (
                              <div style={{ color: '#ffc107' }}>
                                ⏳ {estimarTempoRestante(progressoIndexacao[ev.nome])}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="admin-progresso-barra">
                          <div
                            className="admin-progresso-preenchimento"
                            style={{
                              width: `${((progressoIndexacao[ev.nome].processadas || 0) / progressoIndexacao[ev.nome].total) * 100}%`
                            }}
                          ></div>
                        </div>
                        <div className="admin-progresso-percentual">
                          {Math.round(((progressoIndexacao[ev.nome].processadas || 0) / progressoIndexacao[ev.nome].total) * 100)}%
                        </div>
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {activeTab === 'tabelas' && (
        <>
          <h3>Cadastro de Tabela de Preço</h3>
          <form onSubmit={handleAddTabela} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <input type="text" placeholder="Nome da tabela" value={novaTabela.nome} onChange={e => setNovaTabela(tp => ({ ...tp, nome: e.target.value }))} style={{ flex: 1, padding: 8 }} />
              <input type="text" placeholder="Descrição" value={novaTabela.descricao} onChange={e => setNovaTabela(tp => ({ ...tp, descricao: e.target.value }))} style={{ flex: 2, padding: 8 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                <input type="checkbox" checked={novaTabela.isDefault} onChange={e => setNovaTabela(tp => ({ ...tp, isDefault: e.target.checked }))} /> Definir como tabela padrão
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Faixas de preço (por quantidade):</strong>
              {novaTabela.faixas.map((faixa, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input type="number" placeholder="Min" value={faixa.min} onChange={e => handleTabelaChange(idx, 'min', e.target.value)} style={{ width: 60, padding: 6 }} />
                  <input type="number" placeholder="Max (opcional)" value={faixa.max} onChange={e => handleTabelaChange(idx, 'max', e.target.value)} style={{ width: 80, padding: 6 }} />
                  <input type="number" placeholder="Valor (R$)" value={faixa.valor} onChange={e => handleTabelaChange(idx, 'valor', e.target.value)} style={{ width: 100, padding: 6 }} />
                  <button type="button" onClick={() => removeFaixa(idx)} style={{ background: '#ffe001', color: '#222', border: 'none', borderRadius: 6, padding: '0 10px', fontWeight: 700 }}>X</button>
                </div>
              ))}
              <button type="button" onClick={addFaixa} style={{ background: '#ffe001', color: '#222', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 700, marginTop: 4 }}>Adicionar faixa</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Preços dos Banners:</strong>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="precoVale" style={{ fontSize: 14, fontWeight: 600 }}>Vale Coreografia (R$):</label>
                  <input 
                    id="precoVale"
                    type="number" 
                    placeholder="0.00" 
                    step="0.01"
                    value={novaTabela.precoValeCoreografia} 
                    onChange={e => setNovaTabela(tp => ({ ...tp, precoValeCoreografia: e.target.value }))} 
                    style={{ width: 150, padding: 8 }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="precoVideo" style={{ fontSize: 14, fontWeight: 600 }}>Vídeo (R$):</label>
                  <input 
                    id="precoVideo"
                    type="number" 
                    placeholder="0.00" 
                    step="0.01"
                    value={novaTabela.precoVideo} 
                    onChange={e => setNovaTabela(tp => ({ ...tp, precoVideo: e.target.value }))} 
                    style={{ width: 150, padding: 8 }} 
                  />
                </div>
              </div>
            </div>
            <button type="submit" style={{ background: '#ffe001', color: '#222', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 24px', marginTop: 8 }} disabled={loading}>{loading ? 'Salvando...' : 'Cadastrar tabela'}</button>
          </form>

          <h3>Tabelas de preço cadastradas</h3>
          {loading && <div>Carregando...</div>}
          <ul>
            {Array.isArray(tabelasPreco) && tabelasPreco.map((tp, idx) => (
              <li key={tp._id || idx} style={{ marginBottom: 12, background: '#222', padding: 12, borderRadius: 8 }}>
                {editTabelaId === tp._id ? (
                  <form onSubmit={handleSaveEditTabela} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input type="text" value={editTabela.nome} onChange={e => setEditTabela(tb => ({ ...tb, nome: e.target.value }))} placeholder="Nome da tabela" style={{ padding: 6 }} />
                    <input type="text" value={editTabela.descricao} onChange={e => setEditTabela(tb => ({ ...tb, descricao: e.target.value }))} placeholder="Descrição" style={{ padding: 6 }} />
                    <label><input type="checkbox" checked={!!editTabela.isDefault} onChange={e => setEditTabela(tb => ({ ...tb, isDefault: e.target.checked }))} /> Definir como tabela padrão</label>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Faixas de preço:</strong>
                      {editTabela.faixas && editTabela.faixas.map((faixa, idx2) => (
                        <div key={idx2} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                          <input type="number" placeholder="Min" value={faixa.min} onChange={e => handleEditTabelaChange(idx2, 'min', e.target.value)} style={{ width: 60, padding: 6 }} />
                          <input type="number" placeholder="Max (opcional)" value={faixa.max} onChange={e => handleEditTabelaChange(idx2, 'max', e.target.value)} style={{ width: 80, padding: 6 }} />
                          <input type="number" placeholder="Valor (R$)" value={faixa.valor} onChange={e => handleEditTabelaChange(idx2, 'valor', e.target.value)} style={{ width: 100, padding: 6 }} />
                          <button type="button" onClick={() => removeEditFaixa(idx2)} style={{ background: '#ffe001', color: '#222', border: 'none', borderRadius: 6, padding: '0 10px', fontWeight: 700 }}>X</button>
                        </div>
                      ))}
                      <button type="button" onClick={addEditFaixa} style={{ background: '#ffe001', color: '#222', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 700, marginTop: 4 }}>Adicionar faixa</button>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Preços dos Banners:</strong>
                      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={{ fontSize: 14, fontWeight: 600 }}>Vale Coreografia (R$):</label>
                          <input 
                            type="number" 
                            placeholder="0.00" 
                            step="0.01"
                            value={editTabela.precoValeCoreografia ?? ''} 
                            onChange={e => setEditTabela(tb => ({ ...tb, precoValeCoreografia: e.target.value }))} 
                            style={{ width: 150, padding: 6 }} 
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={{ fontSize: 14, fontWeight: 600 }}>Vídeo (R$):</label>
                          <input 
                            type="number" 
                            placeholder="0.00" 
                            step="0.01"
                            value={editTabela.precoVideo ?? ''} 
                            onChange={e => setEditTabela(tb => ({ ...tb, precoVideo: e.target.value }))} 
                            style={{ width: 150, padding: 6 }} 
                          />
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" style={{ background: '#ffe001', color: '#222', fontWeight: 700, border: 'none', borderRadius: 6, padding: '6px 18px' }}>Salvar</button>
                      <button type="button" onClick={() => setEditTabelaId(null)} style={{ background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px' }}>Cancelar</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <strong>{tp.nome}</strong> {tp.isDefault && <span style={{ background: '#ffe001', color: '#222', padding: '2px 8px', borderRadius: 4, fontSize: 12, marginLeft: 8 }}>DEFAULT</span>}
                    <button onClick={() => handleEditTabela(tp)} style={{ float: 'right', background: '#ffe001', color: '#222', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 700, marginLeft: 8 }}>Editar</button>
                    <button onClick={() => handleDeleteTabela(tp._id)} style={{ float: 'right', background: '#ffe001', color: '#222', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 700, marginLeft: 8 }}>Remover</button>
                    {tp.descricao && <div style={{ color: '#aaa', fontSize: 14 }}>{tp.descricao}</div>}
                    <div>
                      <b>Faixas:</b>
                      <ul>
                        {tp.faixas && tp.faixas.map((faixa, i) => (
                          <li key={i}>
                            {faixa.max ?
                              `De ${faixa.min} até ${faixa.max} fotos: ` :
                              `Acima de ${faixa.min} fotos: `
                            }
                            <b>R${faixa.valor}</b>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {activeTab === 'financeiro' && (
        <div>
          <h3>Modo Debug Ativo</h3>
          <FinanceiroAdminSimple />
          <hr />
          <h3>Componente Original</h3>
          <FinanceiroAdmin />
        </div>
      )}

      {/* Modal para criar evento */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#222',
            padding: 32,
            borderRadius: 12,
            width: '90%',
            maxWidth: 500,
            color: '#fff'
          }}>
            <h3 style={{ marginBottom: 20 }}>Criar Novo Evento</h3>

            <form onSubmit={handleCreateEvent}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8 }}>Nome do Evento:</label>
                <input
                  type="text"
                  value={newEvent.nome}
                  onChange={e => setNewEvent(ev => ({ ...ev, nome: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none' }}
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8 }}>Data do Evento:</label>
                <input
                  type="date"
                  value={newEvent.data}
                  onChange={e => setNewEvent(ev => ({ ...ev, data: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label>
                  <input
                    type="checkbox"
                    checked={newEvent.modoFixo}
                    onChange={e => setNewEvent(ev => ({ ...ev, modoFixo: e.target.checked }))}
                  />
                  {' '}Valor fixo para todas as fotos
                </label>
              </div>

              {newEvent.modoFixo ? (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Valor Fixo (R$):</label>
                  <input
                    type="number"
                    value={newEvent.valorFixo}
                    onChange={e => setNewEvent(ev => ({ ...ev, valorFixo: e.target.value }))}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none' }}
                    step="0.01"
                    required
                  />
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Tabela de Preço:</label>
                  <select
                    value={newEvent.tabelaPrecoId}
                    onChange={e => setNewEvent(ev => ({ ...ev, tabelaPrecoId: e.target.value }))}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none' }}
                  >
                    <option value="">Selecione uma tabela (ou use a default)</option>
                    {tabelasPreco.map(tp => (
                      <option key={tp._id} value={tp._id}>
                        {tp.nome} {tp.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Controle dos Banners */}
              <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#333', borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#ffe001' }}>Configuração dos Banners</h4>
                
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={newEvent.exibirBannerValeCoreografia}
                      onChange={e => setNewEvent(ev => ({ ...ev, exibirBannerValeCoreografia: e.target.checked }))}
                    />
                    <span>Exibir Banner "Vale Coreografia"</span>
                  </label>
                </div>

                <div style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={newEvent.exibirBannerVideo}
                      onChange={e => setNewEvent(ev => ({ ...ev, exibirBannerVideo: e.target.checked }))}
                    />
                    <span>Exibir Banner "Video"</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewEvent({ nome: '', data: '', tabelaPrecoId: '', valorFixo: '', modoFixo: false, exibirBannerValeCoreografia: false, exibirBannerVideo: false });
                  }}
                  style={{
                    background: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 20px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? '#666' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 20px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 700
                  }}
                >
                  {loading ? 'Criando...' : 'Criar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
} 
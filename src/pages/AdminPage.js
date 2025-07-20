import React, { useState, useEffect } from 'react';
import FinanceiroAdmin from '../components/FinanceiroAdmin';
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
  const [cupons, setCupons] = useState([]);
  const [novoEvento, setNovoEvento] = useState({ 
    nome: '', 
    data: '', 
    tabelaPrecoId: '',
    bannerVale: false,
    bannerVideo: false,
    bannerPoster: false,
    valorVale: '',
    valorVideo: '',
    valorPoster: '',
    diasSelecionados: []
  });
  const [novaTabela, setNovaTabela] = useState({ nome: '', descricao: '', faixas: [{ min: '', max: '', valor: '' }], isDefault: false });
  const [novoCupom, setNovoCupom] = useState({ 
    codigo: '', 
    descricao: '', 
    tipoDesconto: 'porcentagem', 
    valorDesconto: '', 
    quantidadeTotal: '', 
    limitarPorUsuario: false,
    dataExpiracao: ''
  });
  const [valorFixo, setValorFixo] = useState('');
  const [modoFixo, setModoFixo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('eventos'); // 'eventos', 'tabelas', 'cupons' ou 'financeiro'
  const [editEventoId, setEditEventoId] = useState(null);
  const [editEvento, setEditEvento] = useState({});
  const [editTabelaId, setEditTabelaId] = useState(null);
  const [editTabela, setEditTabela] = useState({});
  const [editCupomId, setEditCupomId] = useState(null);
  const [editCupom, setEditCupom] = useState({});
  const [indexando, setIndexando] = useState({});
  const [pastasDisponiveis, setPastasDisponiveis] = useState([]);
  const [carregandoPastas, setCarregandoPastas] = useState(false);
  const [uploadingCapa, setUploadingCapa] = useState({});
  const [removendoCapa, setRemovendoCapa] = useState({}); // { [evento]: true/false }
  const [statusIndexacao, setStatusIndexacao] = useState({}); // { [evento]: mensagem }
  const [progressoIndexacao, setProgressoIndexacao] = useState({}); // { [evento]: progresso }
  const [progressoCarregado, setProgressoCarregado] = useState(false); // Flag para saber se já carregou o progresso inicial

  useEffect(() => {
    if (token) {
      setLogged(true);
      fetchEventos();
      fetchEventosMinio();
      fetchTabelasPreco();
      fetchCupons();
      // O progresso será verificado automaticamente pelo próximo useEffect
    }
    // eslint-disable-next-line
  }, [token]);

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

  async function fetchEventos() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/eventos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEventos(Array.isArray(data) ? data : []);
    } catch {
      setEventos([]);
    }
    setLoading(false);
  }

  async function fetchEventosMinio() {
    try {
      const res = await fetch(`${API}/eventos-minio`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEventosMinio(Array.isArray(data) ? data : []);
      // Reset progresso quando a lista de eventos mudar
      setProgressoCarregado(false);
    } catch {
      setEventosMinio([]);
      setProgressoCarregado(false);
    }
  }

  async function fetchTabelasPreco() {
    try {
      const res = await fetch(`${API}/tabelas-preco`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTabelasPreco(Array.isArray(data) ? data : []);
    } catch {
      setTabelasPreco([]);
    }
  }

  async function fetchCupons() {
    try {
      const res = await fetch(`${API}/cupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCupons(Array.isArray(data) ? data : []);
    } catch {
      setCupons([]);
    }
  }

  async function fetchPastasEvento(eventoNome) {
    if (!eventoNome) {
      setPastasDisponiveis([]);
      return;
    }

    setCarregandoPastas(true);
    try {
      const res = await fetch(`${API}/eventos-minio/${encodeURIComponent(eventoNome)}/pastas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPastasDisponiveis(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar pastas do evento:', error);
      setPastasDisponiveis([]);
    } finally {
      setCarregandoPastas(false);
    }
  }

  async function uploadCapaDia(eventoId, diaNome, file) {
    if (!file) return;

    setUploadingCapa(prev => ({ ...prev, [diaNome]: true }));
    
    try {
      const formData = new FormData();
      formData.append('capa', file);

      const res = await fetch(`${API}/eventos/${eventoId}/dias/${encodeURIComponent(diaNome)}/capa`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        // Recarregar eventos para atualizar as capas
        fetchEventos();
      } else {
        alert('Erro ao fazer upload da capa: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da capa');
    } finally {
      setUploadingCapa(prev => ({ ...prev, [diaNome]: false }));
    }
  }

  async function removerCapaDia(eventoId, diaNome) {
    if (!window.confirm(`Tem certeza que deseja remover a capa do dia "${diaNome}"?`)) return;

    setRemovendoCapa(prev => ({ ...prev, [diaNome]: true }));
    
    try {
      const res = await fetch(`${API}/eventos/${eventoId}/dias/${encodeURIComponent(diaNome)}/capa`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        // Recarregar eventos para atualizar as capas
        fetchEventos();
      } else {
        alert('Erro ao remover capa: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao remover capa:', error);
      alert('Erro ao remover capa');
    } finally {
      setRemovendoCapa(prev => ({ ...prev, [diaNome]: false }));
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
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('admin_token', data.token);
        setLogged(true);
        fetchEventos();
        fetchEventosMinio();
        fetchTabelasPreco();
      } else {
        alert(data.error || 'Usuário ou senha inválidos');
      }
    } catch {
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
      bannerVale: novoEvento.bannerVale,
      bannerVideo: novoEvento.bannerVideo,
      bannerPoster: novoEvento.bannerPoster,
      valorVale: novoEvento.bannerVale ? parseFloat(novoEvento.valorVale) || 0 : 0,
      valorVideo: novoEvento.bannerVideo ? parseFloat(novoEvento.valorVideo) || 0 : 0,
      valorPoster: novoEvento.bannerPoster ? parseFloat(novoEvento.valorPoster) || 0 : 0,
      diasSelecionados: novoEvento.diasSelecionados
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
      setNovoEvento({ 
        nome: '', 
        data: '', 
        tabelaPrecoId: '',
        bannerVale: false,
        bannerVideo: false,
        bannerPoster: false,
        valorVale: '',
        valorVideo: '',
        valorPoster: '',
        diasSelecionados: []
      });
      setPastasDisponiveis([]);
      setValorFixo('');
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
      faixas: novaTabela.faixas.filter(f => f.min && f.valor)
    };
    try {
      await fetch(`${API}/tabelas-preco`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      setNovaTabela({ nome: '', descricao: '', faixas: [{ min: '', max: '', valor: '' }], isDefault: false });
      fetchTabelasPreco();
    } catch {
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

  // =================== FUNÇÕES DE CUPONS ===================
  
  async function handleAddCupom(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API}/cupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...novoCupom,
          valorDesconto: parseFloat(novoCupom.valorDesconto) || 0,
          quantidadeTotal: parseInt(novoCupom.quantidadeTotal) || 1
        })
      });
      setNovoCupom({ 
        codigo: '', 
        descricao: '', 
        tipoDesconto: 'porcentagem', 
        valorDesconto: '', 
        quantidadeTotal: '', 
        limitarPorUsuario: false,
        dataExpiracao: ''
      });
      fetchCupons();
    } catch {
      alert('Erro ao cadastrar cupom');
    }
    setLoading(false);
  }

  async function handleEditCupom(cupom) {
    setEditCupomId(cupom._id);
    setEditCupom({
      codigo: cupom.codigo,
      descricao: cupom.descricao,
      tipoDesconto: cupom.tipoDesconto,
      valorDesconto: cupom.valorDesconto,
      quantidadeTotal: cupom.quantidadeTotal,
      limitarPorUsuario: cupom.limitarPorUsuario,
      dataExpiracao: cupom.dataExpiracao ? cupom.dataExpiracao.slice(0, 10) : '',
      ativo: cupom.ativo
    });
  }

  async function handleSaveEditCupom(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API}/cupons/${editCupomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editCupom,
          valorDesconto: parseFloat(editCupom.valorDesconto) || 0,
          quantidadeTotal: parseInt(editCupom.quantidadeTotal) || 1
        })
      });
      setEditCupomId(null);
      setEditCupom({});
      fetchCupons();
    } catch {
      alert('Erro ao editar cupom');
    }
    setLoading(false);
  }

  async function handleDeleteCupom(id) {
    if (!window.confirm('Tem certeza que deseja remover este cupom?')) return;
    setLoading(true);
    try {
      await fetch(`${API}/cupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCupons();
    } catch {
      alert('Erro ao remover cupom');
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
    setTabelasPreco([]);
  }

  async function handleEditEvento(ev) {
    setEditEventoId(ev._id);
    setEditEvento({
      nome: ev.nome,
      data: ev.data ? ev.data.slice(0, 10) : '',
      valorFixo: ev.valorFixo || '',
      tabelaPrecoId: ev.tabelaPrecoId?._id || ev.tabelaPrecoId || '',
      bannerVale: ev.bannerVale || false,
      bannerVideo: ev.bannerVideo || false,
      bannerPoster: ev.bannerPoster || false,
      valorVale: ev.valorVale || '',
      valorVideo: ev.valorVideo || '',
      valorPoster: ev.valorPoster || '',
      diasSelecionados: ev.diasSelecionados || []
    });
    
    // Buscar pastas do evento para edição
    if (ev.nome) {
      fetchPastasEvento(ev.nome);
    }
  }

  async function handleSaveEditEvento(e) {
    e.preventDefault();
    setLoading(true);
    const body = {
      ...editEvento,
      valorFixo: editEvento.valorFixo || undefined,
      tabelaPrecoId: editEvento.valorFixo ? undefined : editEvento.tabelaPrecoId,
      bannerVale: !!editEvento.bannerVale,
      bannerVideo: !!editEvento.bannerVideo,
      bannerPoster: !!editEvento.bannerPoster,
      valorVale: editEvento.bannerVale ? parseFloat(editEvento.valorVale) || 0 : 0,
      valorVideo: editEvento.bannerVideo ? parseFloat(editEvento.valorVideo) || 0 : 0,
      valorPoster: editEvento.bannerPoster ? parseFloat(editEvento.valorPoster) || 0 : 0,
      diasSelecionados: editEvento.diasSelecionados
    };
    try {
      await fetch(`${API}/eventos/${editEventoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      setEditEventoId(null);
      setEditEvento({});
      fetchEventos();
    } catch {
      alert('Erro ao editar evento');
    }
    setLoading(false);
  }

  async function handleEditTabela(tp) {
    setEditTabelaId(tp._id);
    setEditTabela({
      nome: tp.nome,
      descricao: tp.descricao,
      isDefault: tp.isDefault,
      faixas: tp.faixas ? tp.faixas.map(f => ({ ...f })) : [{ min: '', max: '', valor: '' }],
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
      faixas: editTabela.faixas.filter(f => f.min && f.valor)
    };
    try {
      await fetch(`${API}/tabelas-preco/${editTabelaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      setEditTabelaId(null);
      setEditTabela({});
      fetchTabelasPreco();
    } catch {
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
      } else {
        setStatusIndexacao(prev => ({ ...prev, [evento]: data.erro || 'Erro ao indexar fotos.' }));
      }
    } catch (err) {
      console.error('Erro ao indexar fotos:', err);
      setStatusIndexacao(prev => ({ ...prev, [evento]: 'Erro ao indexar fotos.' }));
    }
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
          onClick={() => setActiveTab('cupons')}
          className={`admin-tab-btn ${activeTab === 'cupons' ? 'active' : ''}`}
        >
          Cupons de Desconto
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
          <h3>Cadastro de Evento</h3>
          <form onSubmit={handleAddEvento} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <select value={novoEvento.nome} onChange={e => {
                const eventoSelecionado = e.target.value;
                setNovoEvento(ev => ({ ...ev, nome: eventoSelecionado, diasSelecionados: [] }));
                fetchPastasEvento(eventoSelecionado);
              }} style={{ flex: 2, padding: 8 }} required>
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
            
            {/* Seção dos Banners */}
            <div style={{ marginBottom: 12, padding: 16, background: '#f5f5f5', borderRadius: 8, border: '2px solid #ddd' }}>
              <strong style={{ color: '#333' }}>🎯 Configuração dos Banners:</strong>
              <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
                {/* Banner Vale */}
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#333' }}>
                    <input 
                      type="checkbox" 
                      checked={novoEvento.bannerVale} 
                      onChange={e => setNovoEvento(ev => ({ ...ev, bannerVale: e.target.checked }))} 
                    />
                    <strong>Vale Coreografia</strong>
                  </label>
                  {novoEvento.bannerVale && (
                    <input 
                      type="number" 
                      placeholder="Valor do vale (R$)" 
                      value={novoEvento.valorVale} 
                      onChange={e => setNovoEvento(ev => ({ ...ev, valorVale: e.target.value }))} 
                      style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} 
                      step="0.01"
                      min="0"
                    />
                  )}
                </div>
                
                {/* Banner Vídeo */}
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#333' }}>
                    <input 
                      type="checkbox" 
                      checked={novoEvento.bannerVideo} 
                      onChange={e => setNovoEvento(ev => ({ ...ev, bannerVideo: e.target.checked }))} 
                    />
                    <strong>Vídeo Coreografia</strong>
                  </label>
                  {novoEvento.bannerVideo && (
                    <input 
                      type="number" 
                      placeholder="Valor do vídeo (R$)" 
                      value={novoEvento.valorVideo} 
                      onChange={e => setNovoEvento(ev => ({ ...ev, valorVideo: e.target.value }))} 
                      style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} 
                      step="0.01"
                      min="0"
                    />
                  )}
                </div>
                
                {/* Banner Pôster */}
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#333' }}>
                    <input 
                      type="checkbox" 
                      checked={novoEvento.bannerPoster} 
                      onChange={e => setNovoEvento(ev => ({ ...ev, bannerPoster: e.target.checked }))} 
                    />
                    <strong>Placa Pôster</strong>
                  </label>
                  {novoEvento.bannerPoster && (
                    <input 
                      type="number" 
                      placeholder="Valor do pôster (R$)" 
                      value={novoEvento.valorPoster} 
                      onChange={e => setNovoEvento(ev => ({ ...ev, valorPoster: e.target.value }))} 
                      style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} 
                      step="0.01"
                      min="0"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Seção de Seleção de Pastas para Dias */}
            {novoEvento.nome && (
              <div style={{ marginBottom: 12, padding: 16, background: '#f0f0f0', borderRadius: 8, border: '2px solid #ccc' }}>
                <strong style={{ color: '#333', marginBottom: 12, display: 'block' }}>📁 Seleção de Pastas para Navegação por Dias:</strong>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: 12 }}>
                  Selecione quais pastas do evento serão exibidas como "dias" na barra de navegação. Se nenhuma pasta for selecionada, todas serão exibidas.
                </p>
                
                {carregandoPastas ? (
                  <div style={{ color: '#666', fontStyle: 'italic' }}>Carregando pastas...</div>
                ) : pastasDisponiveis.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                    {pastasDisponiveis.map((pasta, index) => (
                      <label key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: '#fff', borderRadius: 4, border: '1px solid #ddd', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={novoEvento.diasSelecionados.includes(pasta.nome)}
                          onChange={e => {
                            const isChecked = e.target.checked;
                            setNovoEvento(ev => ({
                              ...ev,
                              diasSelecionados: isChecked 
                                ? [...ev.diasSelecionados, pasta.nome]
                                : ev.diasSelecionados.filter(d => d !== pasta.nome)
                            }));
                          }}
                        />
                        <span style={{ fontSize: '13px', color: '#333' }}>{pasta.nome}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#999', fontStyle: 'italic' }}>Nenhuma pasta encontrada neste evento.</div>
                )}
                
                {novoEvento.diasSelecionados.length > 0 && (
                  <div style={{ marginTop: 8, padding: 8, background: '#e8f5e8', borderRadius: 4, border: '1px solid #c3e6c3' }}>
                    <strong style={{ fontSize: '12px', color: '#2d5a2d' }}>Selecionadas ({novoEvento.diasSelecionados.length}):</strong>
                    <div style={{ fontSize: '11px', color: '#2d5a2d', marginTop: 4 }}>
                      {novoEvento.diasSelecionados.join(', ')}
                    </div>
                    <div style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 4, border: '1px solid #ddd' }}>
                      <strong style={{ fontSize: '11px', color: '#333', display: 'block', marginBottom: 6 }}>📸 Upload de Capas:</strong>
                      <p style={{ fontSize: '10px', color: '#666', marginBottom: 8 }}>
                        Após criar o evento, você poderá fazer upload das capas para cada dia na seção de edição.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button type="submit" style={{ background: '#ffe001', color: '#222', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 24px', marginTop: 8 }} disabled={loading}>{loading ? 'Salvando...' : 'Cadastrar evento'}</button>
          </form>

          <h3>Eventos cadastrados</h3>
          {loading && <div>Carregando...</div>}
          <ul>
            {Array.isArray(eventos) && eventos.map((ev, idx) => (
              <li key={ev._id || idx} style={{ marginBottom: 12, background: '#222', padding: 12, borderRadius: 8 }}>
                {editEventoId === ev._id ? (
                  <form onSubmit={handleSaveEditEvento} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input type="text" value={editEvento.nome} onChange={e => setEditEvento(ev2 => ({ ...ev2, nome: e.target.value }))} placeholder="Nome" style={{ padding: 6 }} required />
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
                    
                    {/* Seção dos Banners na Edição */}
                    <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 6, border: '1px solid #ddd' }}>
                      <strong style={{ color: '#333', fontSize: '14px' }}>🎯 Banners:</strong>
                      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                        {/* Banner Vale */}
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '12px', color: '#333' }}>
                            <input 
                              type="checkbox" 
                              checked={!!editEvento.bannerVale} 
                              onChange={e => setEditEvento(ev2 => ({ ...ev2, bannerVale: e.target.checked }))} 
                            />
                            <strong>Vale</strong>
                          </label>
                          {editEvento.bannerVale && (
                            <input 
                              type="number" 
                              placeholder="Valor do vale (R$)" 
                              value={editEvento.valorVale || ''} 
                              onChange={e => setEditEvento(ev2 => ({ ...ev2, valorVale: e.target.value }))} 
                              style={{ width: '100%', padding: 4, borderRadius: 3, border: '1px solid #ccc', fontSize: '12px' }} 
                              step="0.01"
                              min="0"
                            />
                          )}
                        </div>
                        
                        {/* Banner Vídeo */}
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '12px', color: '#333' }}>
                            <input 
                              type="checkbox" 
                              checked={!!editEvento.bannerVideo} 
                              onChange={e => setEditEvento(ev2 => ({ ...ev2, bannerVideo: e.target.checked }))} 
                            />
                            <strong>Vídeo</strong>
                          </label>
                          {editEvento.bannerVideo && (
                            <input 
                              type="number" 
                              placeholder="Valor do vídeo (R$)" 
                              value={editEvento.valorVideo || ''} 
                              onChange={e => setEditEvento(ev2 => ({ ...ev2, valorVideo: e.target.value }))} 
                              style={{ width: '100%', padding: 4, borderRadius: 3, border: '1px solid #ccc', fontSize: '12px' }} 
                              step="0.01"
                              min="0"
                            />
                          )}
                        </div>
                        
                        {/* Banner Pôster */}
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '12px', color: '#333' }}>
                            <input 
                              type="checkbox" 
                              checked={!!editEvento.bannerPoster} 
                              onChange={e => setEditEvento(ev2 => ({ ...ev2, bannerPoster: e.target.checked }))} 
                            />
                            <strong>Pôster</strong>
                          </label>
                          {editEvento.bannerPoster && (
                            <input 
                              type="number" 
                              placeholder="Valor do pôster (R$)" 
                              value={editEvento.valorPoster || ''} 
                              onChange={e => setEditEvento(ev2 => ({ ...ev2, valorPoster: e.target.value }))} 
                              style={{ width: '100%', padding: 4, borderRadius: 3, border: '1px solid #ccc', fontSize: '12px' }} 
                              step="0.01"
                              min="0"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Seção de Seleção de Pastas para Dias na Edição */}
                    {editEvento.nome && (
                      <div style={{ padding: 12, background: '#f0f0f0', borderRadius: 6, border: '1px solid #ccc' }}>
                        <strong style={{ color: '#333', fontSize: '14px', marginBottom: 8, display: 'block' }}>📁 Pastas Selecionadas como Dias:</strong>
                        
                        {carregandoPastas ? (
                          <div style={{ color: '#666', fontStyle: 'italic', fontSize: '12px' }}>Carregando pastas...</div>
                        ) : pastasDisponiveis.length > 0 ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                            {pastasDisponiveis.map((pasta, index) => (
                              <label key={index} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, background: '#fff', borderRadius: 3, border: '1px solid #ddd', cursor: 'pointer', fontSize: '11px' }}>
                                <input
                                  type="checkbox"
                                  checked={editEvento.diasSelecionados.includes(pasta.nome)}
                                  onChange={e => {
                                    const isChecked = e.target.checked;
                                    setEditEvento(ev => ({
                                      ...ev,
                                      diasSelecionados: isChecked 
                                        ? [...ev.diasSelecionados, pasta.nome]
                                        : ev.diasSelecionados.filter(d => d !== pasta.nome)
                                    }));
                                  }}
                                />
                                <span style={{ color: '#333' }}>{pasta.nome}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: '#999', fontStyle: 'italic', fontSize: '12px' }}>Nenhuma pasta encontrada.</div>
                        )}
                        
                        {editEvento.diasSelecionados.length > 0 && (
                          <div style={{ marginTop: 6, padding: 6, background: '#e8f5e8', borderRadius: 3, border: '1px solid #c3e6c3' }}>
                            <div style={{ fontSize: '10px', color: '#2d5a2d' }}>
                              <strong>Selecionadas ({editEvento.diasSelecionados.length}):</strong> {editEvento.diasSelecionados.join(', ')}
                            </div>
                          </div>
                        )}

                        {/* Seção de Upload de Capas */}
                        {editEvento.diasSelecionados.length > 0 && (
                          <div style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 4, border: '1px solid #ddd' }}>
                            <strong style={{ fontSize: '12px', color: '#333', display: 'block', marginBottom: 8 }}>📸 Gerenciar Capas dos Dias:</strong>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {editEvento.diasSelecionados.map((dia, index) => {
                                const eventoAtual = eventos.find(e => e._id === editEventoId);
                                const temCapa = eventoAtual?.capasDias && eventoAtual.capasDias[dia];
                                const urlCapa = eventoAtual?.capasDias?.[dia];
                                
                                return (
                                  <div key={index} style={{ padding: 6, background: '#f9f9f9', borderRadius: 3, border: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                      <span style={{ fontSize: '11px', color: '#333', fontWeight: 'bold' }}>{dia}</span>
                                      {temCapa && (
                                        <span style={{ fontSize: '10px', color: '#28a745', background: '#d4edda', padding: '2px 6px', borderRadius: 3 }}>
                                          ✓ Capa definida
                                        </span>
                                      )}
                                    </div>
                                    
                                    {temCapa && urlCapa && (
                                      <div style={{ marginBottom: 6 }}>
                                        <img 
                                          src={urlCapa} 
                                          alt={`Capa ${dia}`}
                                          style={{ 
                                            width: '100%', 
                                            maxWidth: 120, 
                                            height: 60, 
                                            objectFit: 'cover', 
                                            borderRadius: 3,
                                            border: '1px solid #ddd'
                                          }}
                                        />
                                      </div>
                                    )}
                                    
                                    <div style={{ display: 'flex', gap: 4 }}>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) {
                                            uploadCapaDia(editEventoId, dia, file);
                                          }
                                        }}
                                        style={{ fontSize: '10px' }}
                                        disabled={uploadingCapa[dia]}
                                      />
                                      {temCapa && (
                                        <button
                                          type="button"
                                          onClick={() => removerCapaDia(editEventoId, dia)}
                                          disabled={removendoCapa[dia]}
                                          style={{ 
                                            background: '#dc3545', 
                                            color: '#fff', 
                                            border: 'none', 
                                            borderRadius: 3, 
                                            padding: '2px 6px', 
                                            fontSize: '10px',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          {removendoCapa[dia] ? 'Removendo...' : 'Remover'}
                                        </button>
                                      )}
                                    </div>
                                    
                                    {uploadingCapa[dia] && (
                                      <div style={{ fontSize: '10px', color: '#007bff', marginTop: 4 }}>
                                        Fazendo upload...
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" style={{ background: '#ffe001', color: '#222', fontWeight: 700, border: 'none', borderRadius: 6, padding: '6px 18px' }}>Salvar</button>
                      <button type="button" onClick={() => setEditEventoId(null)} style={{ background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px' }}>Cancelar</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <strong>{ev.nome}</strong> - {ev.data ? new Date(ev.data).toLocaleDateString() : ''}
                    <button onClick={() => handleEditEvento(ev)} style={{ float: 'right', background: '#ffe001', color: '#222', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 700, marginLeft: 8 }}>Editar</button>
                    <button onClick={() => handleDeleteEvento(ev._id)} style={{ float: 'right', background: '#ffe001', color: '#222', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 700, marginLeft: 8 }}>Remover</button>
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
                      
                      {/* Banners Configurados */}
                      {(ev.bannerVale || ev.bannerVideo || ev.bannerPoster) && (
                        <div style={{ marginTop: 8, padding: 8, backgroundColor: '#333', borderRadius: 4 }}>
                          <strong style={{ color: '#ffe001', fontSize: '12px' }}>🎯 Banners:</strong>
                          <div style={{ fontSize: '11px', color: '#ccc', marginTop: 4 }}>
                            {ev.bannerVale && <span style={{ marginRight: 12 }}>📄 Vale: R${ev.valorVale}</span>}
                            {ev.bannerVideo && <span style={{ marginRight: 12 }}>🎬 Vídeo: R${ev.valorVideo}</span>}
                            {ev.bannerPoster && <span>🖼️ Poster: R${ev.valorPoster}</span>}
                          </div>
                        </div>
                      )}
                      
                      {/* Exibir Pastas Selecionadas como Dias */}
                      {ev.diasSelecionados && ev.diasSelecionados.length > 0 && (
                        <div style={{ marginTop: 8, padding: 8, backgroundColor: '#2a2a2a', borderRadius: 4 }}>
                          <strong style={{ color: '#ffe001', fontSize: '12px' }}>📁 Dias Configurados:</strong>
                          <div style={{ fontSize: '11px', color: '#ccc', marginTop: 4 }}>
                            {ev.diasSelecionados.join(', ')}
                          </div>
                          
                          {/* Exibir Capas dos Dias */}
                          {ev.capasDias && Object.keys(ev.capasDias).length > 0 && (
                            <div style={{ marginTop: 6, padding: 6, backgroundColor: '#333', borderRadius: 3 }}>
                              <strong style={{ color: '#ffe001', fontSize: '10px' }}>📸 Capas:</strong>
                              <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                                {Object.entries(ev.capasDias).map(([dia, urlCapa]) => (
                                  <div key={dia} style={{ textAlign: 'center' }}>
                                    <img 
                                      src={urlCapa} 
                                      alt={`Capa ${dia}`}
                                      style={{ 
                                        width: 40, 
                                        height: 25, 
                                        objectFit: 'cover', 
                                        borderRadius: 2,
                                        border: '1px solid #555'
                                      }}
                                    />
                                    <div style={{ fontSize: '9px', color: '#ccc', marginTop: 2 }}>{dia}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleIndexarFotos(ev.nome)}
                      disabled={indexando[ev.nome]}
                      className="admin-indexar-btn"
                    >
                      {indexando[ev.nome] ? 'Indexando...' : 'Indexar fotos no Rekognition'}
                    </button>
                    {statusIndexacao[ev.nome] && (
                      <div className="admin-indexar-status">{statusIndexacao[ev.nome]}</div>
                    )}
                    {progressoIndexacao[ev.nome] && progressoIndexacao[ev.nome].total > 0 && (
                      <div className="admin-progresso-container">
                        <div className="admin-progresso-info">
                          <span>Progresso: {progressoIndexacao[ev.nome].processadas || 0} de {progressoIndexacao[ev.nome].total}</span>
                          <span>Indexadas: {progressoIndexacao[ev.nome].indexadas || 0}</span>
                          <span>Erros: {progressoIndexacao[ev.nome].erros || 0}</span>
                        </div>
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

      {activeTab === 'cupons' && (
        <>
          <h3>🎟️ Cadastro de Cupom de Desconto</h3>
          <form onSubmit={handleAddCupom} style={{ marginBottom: 32, background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <input 
                type="text" 
                placeholder="Código do cupom (ex: DESCONTO10)" 
                value={novoCupom.codigo} 
                onChange={e => setNovoCupom(c => ({ ...c, codigo: e.target.value.toUpperCase() }))} 
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} 
                required 
              />
              <input 
                type="text" 
                placeholder="Descrição do cupom" 
                value={novoCupom.descricao} 
                onChange={e => setNovoCupom(c => ({ ...c, descricao: e.target.value }))} 
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} 
                required 
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <select 
                value={novoCupom.tipoDesconto} 
                onChange={e => setNovoCupom(c => ({ ...c, tipoDesconto: e.target.value }))} 
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              >
                <option value="porcentagem">Porcentagem (%)</option>
                <option value="valor">Valor Fixo (R$)</option>
              </select>
              
              <input 
                type="number" 
                placeholder={novoCupom.tipoDesconto === 'porcentagem' ? 'Desconto (%)' : 'Valor (R$)'} 
                value={novoCupom.valorDesconto} 
                onChange={e => setNovoCupom(c => ({ ...c, valorDesconto: e.target.value }))} 
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} 
                step={novoCupom.tipoDesconto === 'porcentagem' ? '1' : '0.01'}
                min="0"
                max={novoCupom.tipoDesconto === 'porcentagem' ? '100' : undefined}
                required 
              />
              
              <input 
                type="number" 
                placeholder="Quantidade de cupons" 
                value={novoCupom.quantidadeTotal} 
                onChange={e => setNovoCupom(c => ({ ...c, quantidadeTotal: e.target.value }))} 
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} 
                min="1"
                required 
              />
            </div>
            
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input 
                  type="checkbox" 
                  checked={novoCupom.limitarPorUsuario} 
                  onChange={e => setNovoCupom(c => ({ ...c, limitarPorUsuario: e.target.checked }))} 
                />
                <span>Limitar uso por usuário (cada usuário pode usar apenas uma vez)</span>
              </label>
              
              <input 
                type="date" 
                value={novoCupom.dataExpiracao} 
                onChange={e => setNovoCupom(c => ({ ...c, dataExpiracao: e.target.value }))} 
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                title="Data de expiração (opcional)"
              />
            </div>
            
            <button type="submit" style={{ background: '#ffe001', color: '#222', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 24px' }} disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar Cupom'}
            </button>
          </form>

          <h3>📋 Cupons Cadastrados</h3>
          {loading && <div>Carregando...</div>}
          <ul>
            {Array.isArray(cupons) && cupons.map((cupom, idx) => (
              <li key={cupom._id || idx} style={{ marginBottom: 12, background: '#222', padding: 12, borderRadius: 8 }}>
                {editCupomId === cupom._id ? (
                  <form onSubmit={handleSaveEditCupom} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <input 
                        type="text" 
                        value={editCupom.codigo} 
                        onChange={e => setEditCupom(c => ({ ...c, codigo: e.target.value.toUpperCase() }))} 
                        placeholder="Código" 
                        style={{ padding: 6 }} 
                        required 
                      />
                      <input 
                        type="text" 
                        value={editCupom.descricao} 
                        onChange={e => setEditCupom(c => ({ ...c, descricao: e.target.value }))} 
                        placeholder="Descrição" 
                        style={{ padding: 6 }} 
                        required 
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <select 
                        value={editCupom.tipoDesconto} 
                        onChange={e => setEditCupom(c => ({ ...c, tipoDesconto: e.target.value }))} 
                        style={{ padding: 6 }}
                      >
                        <option value="porcentagem">Porcentagem (%)</option>
                        <option value="valor">Valor Fixo (R$)</option>
                      </select>
                      
                      <input 
                        type="number" 
                        value={editCupom.valorDesconto} 
                        onChange={e => setEditCupom(c => ({ ...c, valorDesconto: e.target.value }))} 
                        placeholder="Valor do desconto" 
                        style={{ padding: 6 }} 
                        step={editCupom.tipoDesconto === 'porcentagem' ? '1' : '0.01'}
                        min="0"
                        required 
                      />
                      
                      <input 
                        type="number" 
                        value={editCupom.quantidadeTotal} 
                        onChange={e => setEditCupom(c => ({ ...c, quantidadeTotal: e.target.value }))} 
                        placeholder="Quantidade total" 
                        style={{ padding: 6 }} 
                        min="1"
                        required 
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff' }}>
                        <input 
                          type="checkbox" 
                          checked={!!editCupom.limitarPorUsuario} 
                          onChange={e => setEditCupom(c => ({ ...c, limitarPorUsuario: e.target.checked }))} 
                        />
                        Limitar por usuário
                      </label>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff' }}>
                        <input 
                          type="checkbox" 
                          checked={!!editCupom.ativo} 
                          onChange={e => setEditCupom(c => ({ ...c, ativo: e.target.checked }))} 
                        />
                        Ativo
                      </label>
                      
                      <input 
                        type="date" 
                        value={editCupom.dataExpiracao || ''} 
                        onChange={e => setEditCupom(c => ({ ...c, dataExpiracao: e.target.value }))} 
                        style={{ padding: 6 }}
                        title="Data de expiração"
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" style={{ background: '#ffe001', color: '#222', fontWeight: 700, border: 'none', borderRadius: 6, padding: '6px 18px' }}>Salvar</button>
                      <button type="button" onClick={() => setEditCupomId(null)} style={{ background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px' }}>Cancelar</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <strong style={{ color: '#ffe001' }}>{cupom.codigo}</strong>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleEditCupom(cupom)} style={{ background: '#ffe001', color: '#222', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 700 }}>Editar</button>
                        <button onClick={() => handleDeleteCupom(cupom._id)} style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 700 }}>Remover</button>
                      </div>
                    </div>
                    
                    <div style={{ color: '#ccc', fontSize: '14px', marginBottom: 8 }}>
                      {cupom.descricao}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, fontSize: '12px', color: '#999' }}>
                      <div><strong>Tipo:</strong> {cupom.tipoDesconto === 'porcentagem' ? `${cupom.valorDesconto}%` : `R$ ${cupom.valorDesconto}`}</div>
                      <div><strong>Quantidade:</strong> {cupom.quantidadeUsada}/{cupom.quantidadeTotal}</div>
                      <div><strong>Limite por usuário:</strong> {cupom.limitarPorUsuario ? 'Sim' : 'Não'}</div>
                      <div><strong>Status:</strong> <span style={{ color: cupom.ativo ? '#28a745' : '#dc3545' }}>{cupom.ativo ? 'Ativo' : 'Inativo'}</span></div>
                      {cupom.dataExpiracao && (
                        <div><strong>Expira em:</strong> {new Date(cupom.dataExpiracao).toLocaleDateString('pt-BR')}</div>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {activeTab === 'financeiro' && (
        <FinanceiroAdmin />
      )}
    </div>
  );
} 
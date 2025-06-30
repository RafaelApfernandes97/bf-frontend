import React, { useState, useEffect } from 'react';

const API = 'https://backend.rfsolutionbr.com.br/api/admin';

export default function AdminPage() {
  const [logged, setLogged] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [eventos, setEventos] = useState([]);
  const [eventosMinio, setEventosMinio] = useState([]);
  const [tabelasPreco, setTabelasPreco] = useState([]);
  const [novoEvento, setNovoEvento] = useState({ nome: '', data: '', local: '', tabelaPrecoId: '' });
  const [novaTabela, setNovaTabela] = useState({ nome: '', descricao: '', faixas: [{ min: '', max: '', valor: '' }], isDefault: false });
  const [valorFixo, setValorFixo] = useState('');
  const [modoFixo, setModoFixo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('eventos'); // 'eventos' ou 'tabelas'
  const [editEventoId, setEditEventoId] = useState(null);
  const [editEvento, setEditEvento] = useState({});
  const [editTabelaId, setEditTabelaId] = useState(null);
  const [editTabela, setEditTabela] = useState({});

  useEffect(() => {
    if (token) {
      setLogged(true);
      fetchEventos();
      fetchEventosMinio();
      fetchTabelasPreco();
    }
    // eslint-disable-next-line
  }, [token]);

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
    } catch {
      setEventosMinio([]);
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
      ...novoEvento,
      valorFixo: modoFixo ? valorFixo : undefined,
      tabelaPrecoId: modoFixo ? undefined : novoEvento.tabelaPrecoId
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
      setNovoEvento({ nome: '', data: '', local: '', tabelaPrecoId: '' });
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
      local: ev.local,
      valorFixo: ev.valorFixo || '',
      tabelaPrecoId: ev.tabelaPrecoId?._id || ev.tabelaPrecoId || '',
    });
  }

  async function handleSaveEditEvento(e) {
    e.preventDefault();
    setLoading(true);
    const body = {
      ...editEvento,
      valorFixo: editEvento.valorFixo || undefined,
      tabelaPrecoId: editEvento.valorFixo ? undefined : editEvento.tabelaPrecoId
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
    <div style={{ maxWidth: 1200, margin: '40px auto', background: '#181818', padding: 32, borderRadius: 16, color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Painel Administrativo</h2>
        <button onClick={handleLogout} style={{ background: '#ffe001', color: '#222', fontWeight: 700, border: 'none', borderRadius: 8, padding: '8px 18px' }}>Sair</button>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', marginBottom: 24, borderBottom: '1px solid #333' }}>
        <button
          onClick={() => setActiveTab('eventos')}
          style={{
            background: activeTab === 'eventos' ? '#ffe001' : 'transparent',
            color: activeTab === 'eventos' ? '#222' : '#fff',
            border: 'none',
            padding: '12px 24px',
            cursor: 'pointer',
            fontWeight: activeTab === 'eventos' ? '700' : '400'
          }}
        >
          Eventos
        </button>
        <button
          onClick={() => setActiveTab('tabelas')}
          style={{
            background: activeTab === 'tabelas' ? '#ffe001' : 'transparent',
            color: activeTab === 'tabelas' ? '#222' : '#fff',
            border: 'none',
            padding: '12px 24px',
            cursor: 'pointer',
            fontWeight: activeTab === 'tabelas' ? '700' : '400'
          }}
        >
          Tabelas de Preço
        </button>
      </div>

      {activeTab === 'eventos' && (
        <>
          <h3>Cadastro de Evento</h3>
          <form onSubmit={handleAddEvento} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <select value={novoEvento.nome} onChange={e => setNovoEvento(ev => ({ ...ev, nome: e.target.value }))} style={{ flex: 2, padding: 8 }}>
                <option value="">Selecione um evento do MinIO</option>
                {eventosMinio.map(ev => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
              <input type="date" placeholder="Data" value={novoEvento.data} onChange={e => setNovoEvento(ev => ({ ...ev, data: e.target.value }))} style={{ flex: 1, padding: 8 }} />
              <input type="text" placeholder="Localização" value={novoEvento.local} onChange={e => setNovoEvento(ev => ({ ...ev, local: e.target.value }))} style={{ flex: 2, padding: 8 }} />
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
            <button type="submit" style={{ background: '#ffe001', color: '#222', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 24px', marginTop: 8 }} disabled={loading}>{loading ? 'Salvando...' : 'Cadastrar evento'}</button>
          </form>

          <h3>Eventos cadastrados</h3>
          {loading && <div>Carregando...</div>}
          <ul>
            {Array.isArray(eventos) && eventos.map((ev, idx) => (
              <li key={ev._id || idx} style={{ marginBottom: 12, background: '#222', padding: 12, borderRadius: 8 }}>
                {editEventoId === ev._id ? (
                  <form onSubmit={handleSaveEditEvento} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input type="text" value={editEvento.nome} onChange={e => setEditEvento(ev2 => ({ ...ev2, nome: e.target.value }))} placeholder="Nome" style={{ padding: 6 }} />
                    <input type="date" value={editEvento.data} onChange={e => setEditEvento(ev2 => ({ ...ev2, data: e.target.value }))} style={{ padding: 6 }} />
                    <input type="text" value={editEvento.local} onChange={e => setEditEvento(ev2 => ({ ...ev2, local: e.target.value }))} placeholder="Local" style={{ padding: 6 }} />
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
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" style={{ background: '#ffe001', color: '#222', fontWeight: 700, border: 'none', borderRadius: 6, padding: '6px 18px' }}>Salvar</button>
                      <button type="button" onClick={() => setEditEventoId(null)} style={{ background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px' }}>Cancelar</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <strong>{ev.nome}</strong> - {ev.data ? new Date(ev.data).toLocaleDateString() : ''} - {ev.local}
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
                    </div>
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
    </div>
  );
} 
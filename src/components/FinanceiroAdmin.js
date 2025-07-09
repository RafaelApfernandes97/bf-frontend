import React, { useState, useEffect } from 'react';
import API_ENDPOINTS from '../config/api';
import './FinanceiroAdmin.css';

const FinanceiroAdmin = () => {
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const [pedidos, setPedidos] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    status: '',
    evento: '',
    usuario: '',
    dataInicio: '',
    dataFim: ''
  });
  const [paginacao, setPaginacao] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [showDetalhes, setShowDetalhes] = useState(false);

  // Carregar estatísticas
  useEffect(() => {
    if (activeSubTab === 'dashboard') {
      fetchEstatisticas();
    }
  }, [activeSubTab]);

  // Carregar pedidos
  useEffect(() => {
    if (activeSubTab === 'pedidos') {
      fetchPedidos();
    }
  }, [activeSubTab, filtros, paginacao.page]);

  const fetchEstatisticas = async (periodo = '30') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/estatisticas?periodo=${periodo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEstatisticas(data);
      }
    } catch (err) {
      setError('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        page: paginacao.page,
        limit: paginacao.limit,
        ...filtros
      });
      
      const response = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/pedidos?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPedidos(data.pedidos);
        setPaginacao(prev => ({ ...prev, ...data.paginacao }));
      }
    } catch (err) {
      setError('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const updatePedidoStatus = async (pedidoId, novoStatus) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/pedidos/${pedidoId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: novoStatus })
      });
      
      if (response.ok) {
        fetchPedidos(); // Recarregar lista
        if (pedidoSelecionado && pedidoSelecionado._id === pedidoId) {
          const updatedPedido = await response.json();
          setPedidoSelecionado(updatedPedido);
        }
      }
    } catch (err) {
      setError('Erro ao atualizar status');
    }
  };

  const updatePedidoValor = async (pedidoId, valorUnitario) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/pedidos/${pedidoId}/valor`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ valorUnitario: parseFloat(valorUnitario) })
      });
      
      if (response.ok) {
        fetchPedidos(); // Recarregar lista
        if (pedidoSelecionado && pedidoSelecionado._id === pedidoId) {
          const updatedPedido = await response.json();
          setPedidoSelecionado(updatedPedido);
        }
      }
    } catch (err) {
      setError('Erro ao atualizar valor');
    }
  };

  const exportarRelatorio = async (formato = 'csv') => {
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        formato,
        ...filtros
      });
      
      const response = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/relatorio/vendas?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        if (formato === 'csv') {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'relatorio-vendas.csv';
          a.click();
          window.URL.revokeObjectURL(url);
        } else {
          const data = await response.json();
          console.log(data);
        }
      }
    } catch (err) {
      setError('Erro ao exportar relatório');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status) => {
    const colors = {
      'pendente': '#f59e0b',
      'confirmado': '#3b82f6',
      'pago': '#10b981',
      'entregue': '#6b7280',
      'cancelado': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pendente': 'Pendente',
      'confirmado': 'Confirmado',
      'pago': 'Pago',
      'entregue': 'Entregue',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  };

  const renderDashboard = () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Dashboard Financeiro</h2>
        <select 
          onChange={(e) => fetchEstatisticas(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
        </select>
      </div>

      {/* Cards de Estatísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Total de Pedidos</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
            {estatisticas.totais?.totalPedidos || 0}
          </p>
        </div>
        
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Receita Total</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            {formatCurrency(estatisticas.totais?.totalReceita || 0)}
          </p>
        </div>
        
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Ticket Médio</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
            {formatCurrency(estatisticas.periodo?.ticketMedio || 0)}
          </p>
        </div>
        
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Pedidos Pendentes</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
            {estatisticas.porStatus?.find(s => s._id === 'pendente')?.count || 0}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Pedidos por Status */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <h3>Pedidos por Status</h3>
          {estatisticas.porStatus?.map(stat => (
            <div key={stat._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  backgroundColor: getStatusColor(stat._id),
                  marginRight: '8px'
                }}></span>
                {getStatusLabel(stat._id)}
              </span>
              <span>{stat.count} ({formatCurrency(stat.total)})</span>
            </div>
          ))}
        </div>

        {/* Top Eventos */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <h3>Top Eventos</h3>
          {estatisticas.porEvento?.slice(0, 5).map((evento, index) => (
            <div key={evento._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span>{evento._id}</span>
              <span>{evento.count} pedidos</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPedidos = () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Gestão de Pedidos</h2>
        <button 
          onClick={() => exportarRelatorio('csv')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '10px', 
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <select 
          value={filtros.status}
          onChange={(e) => setFiltros({...filtros, status: e.target.value})}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="">Todos os Status</option>
          <option value="pendente">Pendente</option>
          <option value="confirmado">Confirmado</option>
          <option value="pago">Pago</option>
          <option value="entregue">Entregue</option>
          <option value="cancelado">Cancelado</option>
        </select>
        
        <input 
          type="text"
          placeholder="Filtrar por evento"
          value={filtros.evento}
          onChange={(e) => setFiltros({...filtros, evento: e.target.value})}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        
        <input 
          type="text"
          placeholder="Filtrar por cliente"
          value={filtros.usuario}
          onChange={(e) => setFiltros({...filtros, usuario: e.target.value})}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        
        <input 
          type="date"
          value={filtros.dataInicio}
          onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        
        <input 
          type="date"
          value={filtros.dataFim}
          onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      {/* Tabela de Pedidos */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Cliente</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Evento</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Qtd</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Valor</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Data</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map(pedido => (
              <tr key={pedido._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px' }}>{pedido.pedidoId}</td>
                <td style={{ padding: '12px' }}>{pedido.usuario?.nome}</td>
                <td style={{ padding: '12px' }}>{pedido.evento}</td>
                <td style={{ padding: '12px' }}>{pedido.fotos?.length || 0}</td>
                <td style={{ padding: '12px' }}>{formatCurrency(pedido.valorTotal)}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: getStatusColor(pedido.status),
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {getStatusLabel(pedido.status)}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>{formatDate(pedido.dataCriacao)}</td>
                <td style={{ padding: '12px' }}>
                  <button 
                    onClick={() => {
                      setPedidoSelecionado(pedido);
                      setShowDetalhes(true);
                    }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
        <button 
          disabled={!paginacao.hasPrev}
          onClick={() => setPaginacao(prev => ({ ...prev, page: prev.page - 1 }))}
          style={{
            padding: '8px 16px',
            backgroundColor: paginacao.hasPrev ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: paginacao.hasPrev ? 'pointer' : 'not-allowed'
          }}
        >
          Anterior
        </button>
        
        <span style={{ padding: '8px 16px', alignSelf: 'center' }}>
          Página {paginacao.page} de {paginacao.totalPages}
        </span>
        
        <button 
          disabled={!paginacao.hasNext}
          onClick={() => setPaginacao(prev => ({ ...prev, page: prev.page + 1 }))}
          style={{
            padding: '8px 16px',
            backgroundColor: paginacao.hasNext ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: paginacao.hasNext ? 'pointer' : 'not-allowed'
          }}
        >
          Próxima
        </button>
      </div>
    </div>
  );

  const renderDetalhes = () => {
    if (!pedidoSelecionado) return null;

    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          maxWidth: '600px', 
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Detalhes do Pedido #{pedidoSelecionado.pedidoId}</h3>
            <button 
              onClick={() => setShowDetalhes(false)}
              style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>

          {/* Informações do Cliente */}
          <div style={{ marginBottom: '20px' }}>
            <h4>Cliente</h4>
            <p><strong>Nome:</strong> {pedidoSelecionado.usuario?.nome}</p>
            <p><strong>Email:</strong> {pedidoSelecionado.usuario?.email}</p>
            <p><strong>Telefone:</strong> {pedidoSelecionado.usuario?.telefone}</p>
            <p><strong>CPF/CNPJ:</strong> {pedidoSelecionado.usuario?.cpfCnpj}</p>
          </div>

          {/* Informações do Pedido */}
          <div style={{ marginBottom: '20px' }}>
            <h4>Pedido</h4>
            <p><strong>Evento:</strong> {pedidoSelecionado.evento}</p>
            <p><strong>Data:</strong> {formatDate(pedidoSelecionado.dataCriacao)}</p>
            <p><strong>Quantidade:</strong> {pedidoSelecionado.fotos?.length || 0} fotos</p>
            <p><strong>Valor Total:</strong> {formatCurrency(pedidoSelecionado.valorTotal)}</p>
          </div>

          {/* Status */}
          <div style={{ marginBottom: '20px' }}>
            <h4>Status do Pedido</h4>
            <select 
              value={pedidoSelecionado.status}
              onChange={(e) => updatePedidoStatus(pedidoSelecionado._id, e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
              <option value="pago">Pago</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Valor Unitário */}
          <div style={{ marginBottom: '20px' }}>
            <h4>Valor Unitário</h4>
            <input 
              type="number"
              step="0.01"
              value={pedidoSelecionado.valorUnitario}
              onChange={(e) => updatePedidoValor(pedidoSelecionado._id, e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          {/* Fotos */}
          <div>
            <h4>Fotos ({pedidoSelecionado.fotos?.length || 0})</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {pedidoSelecionado.fotos?.map((foto, index) => (
                <div key={index} style={{ padding: '5px', borderBottom: '1px solid #eee' }}>
                  <strong>{foto.nome}</strong>
                  {foto.coreografia && <span> - {foto.coreografia}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {error && (
        <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', marginBottom: '20px', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {/* Sub-navegação */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveSubTab('dashboard')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: activeSubTab === 'dashboard' ? '#ffe001' : 'transparent',
            color: activeSubTab === 'dashboard' ? '#222' : '#fff',
            cursor: 'pointer',
            fontWeight: activeSubTab === 'dashboard' ? '700' : '400'
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveSubTab('pedidos')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: activeSubTab === 'pedidos' ? '#ffe001' : 'transparent',
            color: activeSubTab === 'pedidos' ? '#222' : '#fff',
            cursor: 'pointer',
            fontWeight: activeSubTab === 'pedidos' ? '700' : '400'
          }}
        >
          Pedidos
        </button>
      </div>

      {/* Conteúdo */}
      {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Carregando...</div>}
      {!loading && activeSubTab === 'dashboard' && renderDashboard()}
      {!loading && activeSubTab === 'pedidos' && renderPedidos()}
      {showDetalhes && renderDetalhes()}
    </div>
  );
};

export default FinanceiroAdmin;
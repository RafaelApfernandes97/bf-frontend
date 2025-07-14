import React, { useState, useEffect } from 'react';
import API_ENDPOINTS from '../config/api';
import './FinanceiroAdmin.css';

const FinanceiroAdmin = () => {
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const [pedidos, setPedidos] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [editData, setEditData] = useState({
    valorUnitario: 0,
    novoItem: { descricao: '', valor: '' }
  });

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

  // Auto-clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

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
        setSuccess('Status atualizado com sucesso!');
        fetchPedidos();
        if (pedidoSelecionado && pedidoSelecionado._id === pedidoId) {
          const updatedPedido = await response.json();
          setPedidoSelecionado(updatedPedido);
        }
      }
    } catch (err) {
      setError('Erro ao atualizar status');
    }
  };

  const updatePedidoValor = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/pedidos/${pedidoSelecionado._id}/valor`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ valorUnitario: parseFloat(editData.valorUnitario) })
      });
      
      if (response.ok) {
        setSuccess('Valor atualizado com sucesso!');
        const updatedPedido = await response.json();
        setPedidoSelecionado(updatedPedido);
        fetchPedidos();
      }
    } catch (err) {
      setError('Erro ao atualizar valor');
    }
  };

  const addItemAdicional = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/pedidos/${pedidoSelecionado._id}/itens-adicionais`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          descricao: editData.novoItem.descricao,
          valor: parseFloat(editData.novoItem.valor)
        })
      });
      
      if (response.ok) {
        setSuccess('Item adicionado com sucesso!');
        const updatedPedido = await response.json();
        setPedidoSelecionado(updatedPedido);
        setEditData(prev => ({ ...prev, novoItem: { descricao: '', valor: '' } }));
        fetchPedidos();
      }
    } catch (err) {
      setError('Erro ao adicionar item');
    }
  };

  const removeItemAdicional = async (itemId) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/pedidos/${pedidoSelecionado._id}/itens-adicionais/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setSuccess('Item removido com sucesso!');
        const updatedPedido = await response.json();
        setPedidoSelecionado(updatedPedido);
        fetchPedidos();
      }
    } catch (err) {
      setError('Erro ao remover item');
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
          setSuccess('Relatório exportado com sucesso!');
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
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
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

  const renderPieChart = (data, title) => {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    let currentAngle = 0;
    
    return (
      <div className="financeiro-chart">
        <h3>{title}</h3>
        <div className="pie-chart-container">
          <svg viewBox="0 0 200 200" className="pie-chart">
            {data.map((item, index) => {
              const percentage = (item.count / total) * 100;
              const angle = (percentage / 100) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              
              const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
              const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
              const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
              const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
              
              const largeArc = angle > 180 ? 1 : 0;
              
              const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
              
              currentAngle += angle;
              
              return (
                <path
                  key={item._id}
                  d={pathData}
                  fill={getStatusColor(item._id)}
                  stroke="#fff"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
          <div className="pie-chart-legend">
            {data.map(item => (
              <div key={item._id} className="legend-item">
                <span 
                  className="legend-color" 
                  style={{ backgroundColor: getStatusColor(item._id) }}
                ></span>
                <span className="legend-label">
                  {getStatusLabel(item._id)}: {item.count} ({((item.count / total) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBarChart = (data, title) => {
    const maxValue = Math.max(...data.map(item => item.total));
    
    return (
      <div className="financeiro-chart">
        <h3>{title}</h3>
        <div className="bar-chart-container">
          {data.slice(0, 5).map((item, index) => (
            <div key={item._id} className="bar-item">
              <div className="bar-label">{item._id}</div>
              <div className="bar-container">
                <div 
                  className="bar-fill"
                  style={{ 
                    width: `${(item.total / maxValue) * 100}%`,
                    backgroundColor: '#007bff'
                  }}
                ></div>
              </div>
              <div className="bar-value">{formatCurrency(item.total)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="financeiro-dashboard">
      <div className="dashboard-header">
        <h2>Dashboard Financeiro</h2>
        <select 
          onChange={(e) => fetchEstatisticas(e.target.value)}
          className="period-selector"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
        </select>
      </div>

      {/* Cards de Estatísticas */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total de Pedidos</h3>
            <p className="stat-value">{estatisticas.totais?.totalPedidos || 0}</p>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Receita Total</h3>
            <p className="stat-value">{formatCurrency(estatisticas.totais?.totalReceita || 0)}</p>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Ticket Médio</h3>
            <p className="stat-value">{formatCurrency(estatisticas.periodo?.ticketMedio || 0)}</p>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pedidos Pendentes</h3>
            <p className="stat-value">{estatisticas.porStatus?.find(s => s._id === 'pendente')?.count || 0}</p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        {estatisticas.porStatus && estatisticas.porStatus.length > 0 && 
          renderPieChart(estatisticas.porStatus, 'Distribuição por Status')
        }
        {estatisticas.porEvento && estatisticas.porEvento.length > 0 && 
          renderBarChart(estatisticas.porEvento, 'Receita por Evento')
        }
      </div>
    </div>
  );

  const renderPedidos = () => (
    <div className="financeiro-pedidos">
      <div className="pedidos-header">
        <h2>Gestão de Pedidos</h2>
        <button 
          onClick={() => exportarRelatorio('csv')}
          className="btn btn-success"
        >
          📊 Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtros-grid">
          <select 
            value={filtros.status}
            onChange={(e) => setFiltros({...filtros, status: e.target.value})}
            className="form-control"
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
            className="form-control"
          />
          
          <input 
            type="text"
            placeholder="Filtrar por cliente"
            value={filtros.usuario}
            onChange={(e) => setFiltros({...filtros, usuario: e.target.value})}
            className="form-control"
          />
          
          <input 
            type="date"
            value={filtros.dataInicio}
            onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
            className="form-control"
          />
          
          <input 
            type="date"
            value={filtros.dataFim}
            onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
            className="form-control"
          />
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <div className="table-container">
        <table className="pedidos-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Evento</th>
              <th>Qtd</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map(pedido => (
              <tr key={pedido._id}>
                <td className="pedido-id">#{pedido.pedidoId}</td>
                <td>{pedido.usuario?.nome}</td>
                <td>{pedido.evento}</td>
                <td>{pedido.fotos?.length || 0}</td>
                <td className="valor">{formatCurrency(pedido.valorTotal)}</td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(pedido.status) }}
                  >
                    {getStatusLabel(pedido.status)}
                  </span>
                </td>
                <td>{formatDate(pedido.dataCriacao)}</td>
                <td>
                  <button 
                    onClick={() => {
                      setPedidoSelecionado(pedido);
                      setShowDetalhes(true);
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    👁️ Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="pagination-container">
        <button 
          disabled={!paginacao.hasPrev}
          onClick={() => setPaginacao(prev => ({ ...prev, page: prev.page - 1 }))}
          className="btn btn-secondary"
        >
          ← Anterior
        </button>
        
        <span className="pagination-info">
          Página {paginacao.page} de {paginacao.totalPages}
        </span>
        
        <button 
          disabled={!paginacao.hasNext}
          onClick={() => setPaginacao(prev => ({ ...prev, page: prev.page + 1 }))}
          className="btn btn-secondary"
        >
          Próxima →
        </button>
      </div>
    </div>
  );

  const renderDetalhes = () => {
    if (!pedidoSelecionado) return null;

    const valorFotos = pedidoSelecionado.fotos?.length * pedidoSelecionado.valorUnitario || 0;
    const valorItensAdicionais = pedidoSelecionado.itensAdicionais?.reduce((sum, item) => sum + item.valor, 0) || 0;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>🧾 Pedido #{pedidoSelecionado.pedidoId}</h3>
            <button 
              onClick={() => setShowDetalhes(false)}
              className="btn-close"
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            <div className="detalhes-grid">
              {/* Informações do Cliente */}
              <div className="detalhes-section">
                <h4>👤 Cliente</h4>
                <div className="info-grid">
                  <div><strong>Nome:</strong> {pedidoSelecionado.usuario?.nome}</div>
                  <div><strong>Email:</strong> {pedidoSelecionado.usuario?.email}</div>
                  <div><strong>Telefone:</strong> {pedidoSelecionado.usuario?.telefone}</div>
                  <div><strong>CPF/CNPJ:</strong> {pedidoSelecionado.usuario?.cpfCnpj}</div>
                </div>
              </div>

              {/* Informações do Pedido */}
              <div className="detalhes-section">
                <h4>📋 Pedido</h4>
                <div className="info-grid">
                  <div><strong>Evento:</strong> {pedidoSelecionado.evento}</div>
                  <div><strong>Data:</strong> {formatDate(pedidoSelecionado.dataCriacao)}</div>
                  <div><strong>Quantidade Fotos:</strong> {pedidoSelecionado.fotos?.length || 0}</div>
                  <div><strong>Valor Unitário:</strong> {formatCurrency(pedidoSelecionado.valorUnitario)}</div>
                </div>
              </div>
            </div>

            {/* Valores Detalhados */}
            <div className="detalhes-section">
              <h4>💰 Valores</h4>
              <div className="valores-detalhados">
                <div className="valor-linha">
                  <span>Fotos ({pedidoSelecionado.fotos?.length || 0} × {formatCurrency(pedidoSelecionado.valorUnitario)}):</span>
                  <span className="valor">{formatCurrency(valorFotos)}</span>
                </div>
                {pedidoSelecionado.itensAdicionais?.map((item, index) => (
                  <div key={index} className="valor-linha">
                    <span>{item.descricao}:</span>
                    <span className="valor">{formatCurrency(item.valor)}</span>
                  </div>
                ))}
                <div className="valor-linha total">
                  <span><strong>Total:</strong></span>
                  <span className="valor"><strong>{formatCurrency(pedidoSelecionado.valorTotal)}</strong></span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="detalhes-section">
              <h4>📊 Status do Pedido</h4>
              <select 
                value={pedidoSelecionado.status}
                onChange={(e) => updatePedidoStatus(pedidoSelecionado._id, e.target.value)}
                className="form-control"
              >
                <option value="pendente">Pendente</option>
                <option value="confirmado">Confirmado</option>
                <option value="pago">Pago</option>
                <option value="entregue">Entregue</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Fotos */}
            <div className="detalhes-section">
              <h4>📷 Fotos ({pedidoSelecionado.fotos?.length || 0})</h4>
              <div className="fotos-lista">
                {pedidoSelecionado.fotos?.map((foto, index) => (
                  <div key={index} className="foto-item">
                    <strong>{foto.nome}</strong>
                    {foto.coreografia && <span> - {foto.coreografia}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Itens Adicionais */}
            {pedidoSelecionado.itensAdicionais && pedidoSelecionado.itensAdicionais.length > 0 && (
              <div className="detalhes-section">
                <h4>➕ Itens Adicionais</h4>
                <div className="itens-adicionais">
                  {pedidoSelecionado.itensAdicionais.map((item, index) => (
                    <div key={index} className="item-adicional">
                      <span>{item.descricao}</span>
                      <span>{formatCurrency(item.valor)}</span>
                      <button 
                        onClick={() => removeItemAdicional(item._id)}
                        className="btn btn-danger btn-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button 
              onClick={() => {
                setEditData({
                  valorUnitario: pedidoSelecionado.valorUnitario,
                  novoItem: { descricao: '', valor: '' }
                });
                setShowEditModal(true);
              }}
              className="btn btn-warning"
            >
              ✏️ Editar
            </button>
            <button 
              onClick={() => setShowLogsModal(true)}
              className="btn btn-info"
            >
              📋 Ver Logs
            </button>
            <button 
              onClick={() => setShowDetalhes(false)}
              className="btn btn-secondary"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    if (!showEditModal || !pedidoSelecionado) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>✏️ Editar Pedido #{pedidoSelecionado.pedidoId}</h3>
            <button 
              onClick={() => setShowEditModal(false)}
              className="btn-close"
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            {/* Editar Valor Unitário */}
            <div className="edit-section">
              <h4>💰 Valor Unitário</h4>
              <div className="input-group">
                <input 
                  type="number"
                  step="0.01"
                  value={editData.valorUnitario}
                  onChange={(e) => setEditData(prev => ({ ...prev, valorUnitario: e.target.value }))}
                  className="form-control"
                />
                <button 
                  onClick={updatePedidoValor}
                  className="btn btn-primary"
                >
                  Atualizar Valor
                </button>
              </div>
            </div>

            {/* Adicionar Item */}
            <div className="edit-section">
              <h4>➕ Adicionar Item</h4>
              <div className="add-item-form">
                <input 
                  type="text"
                  placeholder="Descrição do item"
                  value={editData.novoItem.descricao}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    novoItem: { ...prev.novoItem, descricao: e.target.value }
                  }))}
                  className="form-control"
                />
                <input 
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={editData.novoItem.valor}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    novoItem: { ...prev.novoItem, valor: e.target.value }
                  }))}
                  className="form-control"
                />
                <button 
                  onClick={addItemAdicional}
                  className="btn btn-success"
                  disabled={!editData.novoItem.descricao || !editData.novoItem.valor}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              onClick={() => setShowEditModal(false)}
              className="btn btn-secondary"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderLogsModal = () => {
    if (!showLogsModal || !pedidoSelecionado) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>📋 Logs do Pedido #{pedidoSelecionado.pedidoId}</h3>
            <button 
              onClick={() => setShowLogsModal(false)}
              className="btn-close"
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            <div className="logs-container">
              {pedidoSelecionado.logs && pedidoSelecionado.logs.length > 0 ? (
                pedidoSelecionado.logs.map((log, index) => (
                  <div key={index} className="log-item">
                    <div className="log-header">
                      <span className="log-date">{formatDateTime(log.data)}</span>
                      <span className="log-user">{log.usuario}</span>
                    </div>
                    <div className="log-content">
                      <strong>{log.acao.replace('_', ' ').toUpperCase()}:</strong> {log.descricao}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-logs">
                  <p>Nenhum log encontrado para este pedido.</p>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button 
              onClick={() => setShowLogsModal(false)}
              className="btn btn-secondary"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="financeiro-container">
      {/* Mensagens */}
      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          ✅ {success}
        </div>
      )}

      {/* Sub-navegação */}
      <div className="sub-navigation">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`nav-btn ${activeSubTab === 'dashboard' ? 'active' : ''}`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setActiveSubTab('pedidos')}
          className={`nav-btn ${activeSubTab === 'pedidos' ? 'active' : ''}`}
        >
          🛒 Pedidos
        </button>
      </div>

      {/* Conteúdo */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando...</p>
        </div>
      )}
      
      {!loading && activeSubTab === 'dashboard' && renderDashboard()}
      {!loading && activeSubTab === 'pedidos' && renderPedidos()}
      
      {/* Modais */}
      {showDetalhes && renderDetalhes()}
      {showEditModal && renderEditModal()}
      {showLogsModal && renderLogsModal()}
    </div>
  );
};

export default FinanceiroAdmin;
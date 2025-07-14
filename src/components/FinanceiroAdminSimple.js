import React, { useState, useEffect } from 'react';
import API_ENDPOINTS from '../config/api';

const FinanceiroAdminSimple = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [estatisticas, setEstatisticas] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [debug, setDebug] = useState([]);

  const addDebug = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebug(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  useEffect(() => {
    addDebug('Componente carregado');
    testConnections();
  }, []);

  const testConnections = async () => {
    addDebug('Iniciando testes de conectividade...');
    
    // Verificar token
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setError('Token não encontrado. Faça login novamente.');
      addDebug('❌ Token não encontrado');
      return;
    }
    
    addDebug(`✅ Token encontrado: ${token.substring(0, 20)}...`);
    
    // Testar rota de estatísticas
    await testEstatisticas();
    
    // Testar rota de pedidos
    await testPedidos();
  };

  const testEstatisticas = async () => {
    addDebug('Testando rota de estatísticas...');
    setLoading(true);
    
    try {
      const token = localStorage.getItem('admin_token');
      const url = `${API_ENDPOINTS.ADMIN_BASE}/estatisticas?periodo=30`;
      
      addDebug(`URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      addDebug(`Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        setEstatisticas(data);
        setSuccess('Estatísticas carregadas com sucesso!');
        addDebug(`✅ Estatísticas carregadas: ${JSON.stringify(data.totais)}`);
      } else {
        const errorText = await response.text();
        setError(`Erro nas estatísticas: ${response.status} - ${errorText}`);
        addDebug(`❌ Erro nas estatísticas: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      setError(`Erro de rede nas estatísticas: ${err.message}`);
      addDebug(`❌ Erro de rede nas estatísticas: ${err.message}`);
    }
    
    setLoading(false);
  };

  const testPedidos = async () => {
    addDebug('Testando rota de pedidos...');
    setLoading(true);
    
    try {
      const token = localStorage.getItem('admin_token');
      const url = `${API_ENDPOINTS.ADMIN_BASE}/pedidos?page=1&limit=10`;
      
      addDebug(`URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      addDebug(`Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        setPedidos(data.pedidos || []);
        setSuccess('Pedidos carregados com sucesso!');
        addDebug(`✅ Pedidos carregados: ${data.pedidos?.length || 0} pedidos`);
      } else {
        const errorText = await response.text();
        setError(`Erro nos pedidos: ${response.status} - ${errorText}`);
        addDebug(`❌ Erro nos pedidos: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      setError(`Erro de rede nos pedidos: ${err.message}`);
      addDebug(`❌ Erro de rede nos pedidos: ${err.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🔧 Debug do Módulo Financeiro</h2>
      
      {/* Mensagens */}
      {error && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', margin: '10px 0', borderRadius: '5px' }}>
          ❌ {error}
        </div>
      )}
      
      {success && (
        <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px', margin: '10px 0', borderRadius: '5px' }}>
          ✅ {success}
        </div>
      )}
      
      {loading && (
        <div style={{ background: '#e3f2fd', color: '#1565c0', padding: '10px', margin: '10px 0', borderRadius: '5px' }}>
          🔄 Carregando...
        </div>
      )}
      
      {/* Botões de teste */}
      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={testEstatisticas}
          style={{ background: '#007bff', color: 'white', border: 'none', padding: '10px 20px', margin: '5px', borderRadius: '5px' }}
        >
          Testar Estatísticas
        </button>
        <button 
          onClick={testPedidos}
          style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', margin: '5px', borderRadius: '5px' }}
        >
          Testar Pedidos
        </button>
        <button 
          onClick={testConnections}
          style={{ background: '#17a2b8', color: 'white', border: 'none', padding: '10px 20px', margin: '5px', borderRadius: '5px' }}
        >
          Testar Tudo
        </button>
      </div>
      
      {/* Resultados das Estatísticas */}
      {estatisticas && (
        <div style={{ background: '#f8f9fa', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
          <h3>📊 Estatísticas</h3>
          <p><strong>Total de Pedidos:</strong> {estatisticas.totais?.totalPedidos || 0}</p>
          <p><strong>Receita Total:</strong> R$ {estatisticas.totais?.totalReceita || 0}</p>
          <p><strong>Receita Pendente:</strong> R$ {estatisticas.totais?.receitaPendente || 0}</p>
          <p><strong>Status Diferentes:</strong> {estatisticas.porStatus?.length || 0}</p>
          <p><strong>Eventos Diferentes:</strong> {estatisticas.porEvento?.length || 0}</p>
        </div>
      )}
      
      {/* Resultados dos Pedidos */}
      {pedidos.length > 0 && (
        <div style={{ background: '#f8f9fa', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
          <h3>🛒 Pedidos ({pedidos.length})</h3>
          {pedidos.slice(0, 3).map((pedido, index) => (
            <div key={index} style={{ borderBottom: '1px solid #ddd', padding: '5px 0' }}>
              <strong>{pedido.pedidoId}</strong> - {pedido.evento} - R$ {pedido.valorTotal} ({pedido.status})
            </div>
          ))}
        </div>
      )}
      
      {/* Log de Debug */}
      <div style={{ background: '#f8f9fa', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
        <h3>🐛 Log de Debug</h3>
        <div style={{ maxHeight: '300px', overflow: 'auto', fontSize: '12px', fontFamily: 'monospace' }}>
          {debug.map((msg, index) => (
            <div key={index} style={{ padding: '2px 0' }}>{msg}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinanceiroAdminSimple;
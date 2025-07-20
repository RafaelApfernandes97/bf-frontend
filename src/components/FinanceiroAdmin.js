import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
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

  // Estados para edição avançada de pedidos
  const [editandoPedido, setEditandoPedido] = useState(false);
  const [fotosEditaveis, setFotosEditaveis] = useState([]);
  const [produtosEditaveis, setProdutosEditaveis] = useState([]);
  const [itensEditaveis, setItensEditaveis] = useState([]);
  const [valorUnitarioEditavel, setValorUnitarioEditavel] = useState(0);
  const [novoItemEdicao, setNovoItemEdicao] = useState({ descricao: '', valor: '' });

  // Novos estados para as funcionalidades
  const [showUserEditModal, setShowUserEditModal] = useState(false);
  const [userEditData, setUserEditData] = useState({});
  const [linkPedido, setLinkPedido] = useState('');
  const [numeroNotaFiscal, setNumeroNotaFiscal] = useState('');
  const [periodoNotaFiscal, setPeriodoNotaFiscal] = useState('');
  const [statusNotaFiscal, setStatusNotaFiscal] = useState('pendente');
  const [desconto, setDesconto] = useState({ tipo: 'valor', valor: 0 });
  const [valorEditavel, setValorEditavel] = useState(0);
  const [showDescontoModal, setShowDescontoModal] = useState(false);
  const [consultandoCEP, setConsultandoCEP] = useState(false);

  // Estados de notificação específicos por modal
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [userEditError, setUserEditError] = useState('');
  const [userEditSuccess, setUserEditSuccess] = useState('');
  const [descontoError, setDescontoError] = useState('');
  const [descontoSuccess, setDescontoSuccess] = useState('');
  const [detalhesError, setDetalhesError] = useState('');
  const [detalhesSuccess, setDetalhesSuccess] = useState('');

  // Estado para loading das operações
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);

  // Função para limpar todas as notificações de um modal específico
  const clearModalNotifications = (modalType = 'all') => {
    if (modalType === 'all' || modalType === 'modal') {
      setModalError('');
      setModalSuccess('');
    }
    if (modalType === 'all' || modalType === 'userEdit') {
      setUserEditError('');
      setUserEditSuccess('');
    }
    if (modalType === 'all' || modalType === 'desconto') {
      setDescontoError('');
      setDescontoSuccess('');
    }
    if (modalType === 'all' || modalType === 'detalhes') {
      setDetalhesError('');
      setDetalhesSuccess('');
    }
  };

  // Função para auto-limpar notificações após timeout
  const setTempModalNotification = (type, modalType, message, timeout = 4000) => {
    clearModalNotifications(modalType);

    if (type === 'error') {
      if (modalType === 'userEdit') setUserEditError(message);
      else if (modalType === 'desconto') setDescontoError(message);
      else if (modalType === 'detalhes') setDetalhesError(message);
      else setModalError(message);
    } else {
      if (modalType === 'userEdit') setUserEditSuccess(message);
      else if (modalType === 'desconto') setDescontoSuccess(message);
      else if (modalType === 'detalhes') setDetalhesSuccess(message);
      else setModalSuccess(message);
    }

    // Auto-limpar apenas se timeout for definido
    if (timeout > 0) {
      setTimeout(() => clearModalNotifications(modalType), timeout);
    }
  };

  // Função para auto-limpar notificações globais
  const setTempGlobalNotification = (type, message, timeout = 4000) => {
    setError('');
    setSuccess('');

    if (type === 'error') {
      setError(message);
    } else {
      setSuccess(message);
    }

    setTimeout(() => {
      setError('');
      setSuccess('');
    }, timeout);
  };

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
        setTempGlobalNotification('success', 'Status atualizado com sucesso!');
        fetchPedidos();
        if (pedidoSelecionado && pedidoSelecionado._id === pedidoId) {
          const updatedPedido = await response.json();
          setPedidoSelecionado(updatedPedido);
        }
      }
    } catch (err) {
      setTempGlobalNotification('error', 'Erro ao atualizar status');
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
        setTempGlobalNotification('success', 'Valor atualizado com sucesso!');
        const updatedPedido = await response.json();
        setPedidoSelecionado(updatedPedido);
        fetchPedidos();
      }
    } catch (err) {
      setTempGlobalNotification('error', 'Erro ao atualizar valor');
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
        setTempGlobalNotification('success', 'Item adicionado com sucesso!');
        const updatedPedido = await response.json();
        setPedidoSelecionado(updatedPedido);
        setEditData(prev => ({ ...prev, novoItem: { descricao: '', valor: '' } }));
        fetchPedidos();
      }
    } catch (err) {
      setTempGlobalNotification('error', 'Erro ao adicionar item');
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
        setTempGlobalNotification('success', 'Item removido com sucesso!');
        const updatedPedido = await response.json();
        setPedidoSelecionado(updatedPedido);
        fetchPedidos();
      }
    } catch (err) {
      setTempGlobalNotification('error', 'Erro ao remover item');
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
          setTempGlobalNotification('success', 'Relatório exportado com sucesso!');
        }
      }
    } catch (err) {
      setTempGlobalNotification('error', 'Erro ao exportar relatório');
    }
  };

  // Novas funções para as funcionalidades solicitadas
  const enviarMensagemCliente = async () => {
    if (!linkPedido.trim()) {
      setTempModalNotification('error', 'detalhes', 'Por favor, insira o link do pedido', 5000);
      return;
    }

    setEnviandoMensagem(true);
    try {
      const token = localStorage.getItem('admin_token');
      const mensagem1 = `Olá, seu pedido está pronto! ✨
Obrigado pela compra! Se for postar no Instagram não esqueça de nos marcar @balletemfoco 💛
Segue anexo no link (ficará disponível por 2 meses).

${linkPedido}`;

      const mensagem2 = `Vou te fazer um pedido especial que vai levar apenas alguns segundos ☺

De 0 a 10, qual a probabilidade de você indicar os serviços do Ballet em Foco para outros bailarinos e escolas?
Se possível justifique sua resposta 

Agradecemos imensamente pela disponibilidade! ✨`;

      // Mostrar progresso
      setTempModalNotification('success', 'detalhes', '📤 Enviando primeira mensagem...', 12000);

      // Enviar primeira mensagem
      const response1 = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/enviar-mensagem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pedidoId: pedidoSelecionado._id,
          telefone: pedidoSelecionado.usuario?.telefone,
          mensagem: mensagem1
        })
      });

      if (!response1.ok) {
        throw new Error('Erro ao enviar primeira mensagem');
      }

      // Primeira mensagem enviada com sucesso
      setTempModalNotification('success', 'detalhes', '✅ Primeira mensagem enviada! Enviando segunda mensagem em 10 segundos...', 12000);

      // Enviar segunda mensagem após 10 segundos
      setTimeout(async () => {
        try {
          const response2 = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/enviar-mensagem`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              pedidoId: pedidoSelecionado._id,
              telefone: pedidoSelecionado.usuario?.telefone,
              mensagem: mensagem2
            })
          });

          if (response2.ok) {
            setTempModalNotification('success', 'detalhes', '🎉 Ambas as mensagens foram enviadas com sucesso!', 8000);
          } else {
            setTempModalNotification('error', 'detalhes', '⚠️ Primeira mensagem enviada, mas houve erro na segunda mensagem', 8000);
          }
        } catch (error) {
          console.error('Erro ao enviar segunda mensagem:', error);
          setTempModalNotification('error', 'detalhes', '⚠️ Primeira mensagem enviada, mas houve erro na segunda mensagem', 8000);
        }
      }, 10000);

      setLinkPedido('');

      // Recarregar dados do pedido para atualizar logs
      fetchPedidos();
    } catch (err) {
      console.error('Erro ao enviar mensagens:', err);
      setTempModalNotification('error', 'detalhes', '❌ Erro ao enviar mensagens: ' + err.message, 6000);
    } finally {
      setEnviandoMensagem(false);
    }
  };

  const salvarDadosNotaFiscal = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/pedidos/${pedidoSelecionado._id}/nota-fiscal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          numeroNotaFiscal: numeroNotaFiscal,
          periodoNotaFiscal: periodoNotaFiscal
        })
      });

      if (response.ok) {
        const updatedPedido = await response.json();
        setPedidoSelecionado(updatedPedido);
        setTempModalNotification('success', 'detalhes', '✅ Dados da nota fiscal salvos com sucesso!', 4000);
        // Recarregar lista de pedidos para manter sincronização
        fetchPedidos();
      } else {
        setTempModalNotification('error', 'detalhes', '❌ Erro ao salvar dados da nota fiscal', 4000);
      }
    } catch (err) {
      console.error('Erro ao salvar dados da nota fiscal:', err);
      setTempModalNotification('error', 'detalhes', '❌ Erro ao salvar dados da nota fiscal: ' + err.message, 4000);
    }
  };

  // Funções para edição avançada de pedidos
  const identificarProduto = (item) => {
    const nome = item.nome?.toLowerCase() || '';
    return nome.includes('vale') || 
           nome.includes('vídeo') || 
           nome.includes('video') || 
           nome.includes('banner') || 
           nome.includes('produto') ||
           nome.includes('coreografia') ||
           nome.includes('placa') ||
           nome.includes('poster');
  };

  const separarFotosProdutos = (fotos) => {
    const fotosReais = [];
    const produtos = [];
    
    (fotos || []).forEach(foto => {
      if (identificarProduto(foto)) {
        produtos.push(foto);
      } else {
        fotosReais.push(foto);
      }
    });
    
    return { fotosReais, produtos };
  };

  const inicializarEdicaoPedido = (pedido) => {
    const { fotosReais, produtos } = separarFotosProdutos(pedido.fotos);
    setFotosEditaveis([...fotosReais]);
    setProdutosEditaveis([...produtos]);
    setItensEditaveis([...pedido.itensAdicionais || []]);
    setValorUnitarioEditavel(pedido.valorUnitario || 0);
    setEditandoPedido(true);
  };

  const removerFoto = (indexFoto) => {
    setFotosEditaveis(prev => prev.filter((_, index) => index !== indexFoto));
  };

  const removerProduto = (indexProduto) => {
    setProdutosEditaveis(prev => prev.filter((_, index) => index !== indexProduto));
  };

  const removerItemAdicional = (indexItem) => {
    setItensEditaveis(prev => prev.filter((_, index) => index !== indexItem));
  };

  const adicionarNovoItemEdicao = () => {
    if (!novoItemEdicao.descricao.trim() || !novoItemEdicao.valor) {
      return;
    }
    
    const novoItem = {
      descricao: novoItemEdicao.descricao.trim(),
      valor: parseFloat(novoItemEdicao.valor.replace(',', '.')) || 0
    };
    
    setItensEditaveis(prev => [...prev, novoItem]);
    setNovoItemEdicao({ descricao: '', valor: '' });
  };

  const limparPedidoCompleto = () => {
    setFotosEditaveis([]);
    setProdutosEditaveis([]);
    setItensEditaveis([]);
  };

  const calcularNovoTotal = () => {
    const totalFotos = fotosEditaveis.length * valorUnitarioEditavel;
    const totalProdutos = produtosEditaveis.reduce((sum, produto) => sum + (parseFloat(produto.valor) || 0), 0);
    const totalItens = itensEditaveis.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
    return totalFotos + totalProdutos + totalItens;
  };

  const salvarEdicaoPedido = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const novoTotal = calcularNovoTotal();
      
      // Combinar fotos reais com produtos para o backend
      const todasFotos = [...fotosEditaveis, ...produtosEditaveis];
      
      const dadosAtualizacao = {
        fotos: todasFotos,
        itensAdicionais: itensEditaveis,
        valorUnitario: valorUnitarioEditavel,
        valorTotal: novoTotal
      };

      const response = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/pedidos/${pedidoSelecionado._id}/editar-completo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(dadosAtualizacao)
      });

      if (response.ok) {
        const updatedPedido = await response.json();
        setPedidoSelecionado(updatedPedido);
        setTempModalNotification('success', 'detalhes', '✅ Pedido atualizado com sucesso!', 4000);
        setShowEditModal(false);
        setEditandoPedido(false);
        fetchPedidos();
      } else {
        setTempModalNotification('error', 'detalhes', '❌ Erro ao salvar alterações do pedido', 4000);
      }
    } catch (err) {
      console.error('Erro ao salvar edição do pedido:', err);
      setTempModalNotification('error', 'detalhes', '❌ Erro ao salvar: ' + err.message, 4000);
    }
  };

  const cancelarEdicaoPedido = () => {
    setEditandoPedido(false);
    setShowEditModal(false);
    // Resetar estados
    setFotosEditaveis([]);
    setProdutosEditaveis([]);
    setItensEditaveis([]);
    setValorUnitarioEditavel(0);
    setNovoItemEdicao({ descricao: '', valor: '' });
  };

  const gerarTextoSeparador = (pedido) => {
    const evento = pedido.evento || '';
    const nome = pedido.usuario?.nome || '';
    const email = pedido.usuario?.email || '';
    const telefone = pedido.usuario?.telefone || '';
    const cpf = pedido.usuario?.cpfCnpj || '';
    
    // Montar endereço completo
    const endereco = [
      pedido.usuario?.rua,
      pedido.usuario?.numero,
      pedido.usuario?.bairro,
      pedido.usuario?.cidade,
      pedido.usuario?.estado,
      pedido.usuario?.cep ? `CEP: ${pedido.usuario.cep}` : ''
    ].filter(Boolean).join(', ');
    
    // Filtrar apenas fotos (excluir vale, video, placa poster)
    const fotos = pedido.fotos?.filter(foto => 
      foto.nome && 
      !foto.nome.toLowerCase().includes('vale') &&
      !foto.nome.toLowerCase().includes('video') &&
      !foto.nome.toLowerCase().includes('vídeo') &&
      !foto.nome.toLowerCase().includes('placa') &&
      !foto.nome.toLowerCase().includes('poster')
    ) || [];
    
    const quantidadeFotos = fotos.length;
    const nomesFotos = fotos.map(foto => ` ${foto.nome}`).join(',\n');
    
    const total = formatCurrency(pedido.valorTotal);
    
    return `Resumo do Pedido 

Evento: ${evento}

Nome: ${nome}

Email: ${email}

Telefone: ${telefone}

CPF: ${cpf}

Endereço: ${endereco}

Imagens Selecionadas: ${quantidadeFotos}
${nomesFotos}

Total do Pedido: ${total}`;
  };

  const copiarTextoSeparador = async () => {
    try {
      const texto = gerarTextoSeparador(pedidoSelecionado);
      await navigator.clipboard.writeText(texto);
      setTempModalNotification('success', 'detalhes', '✅ Texto copiado para a área de transferência!', 3000);
    } catch (err) {
      console.error('Erro ao copiar texto:', err);
      setTempModalNotification('error', 'detalhes', '❌ Erro ao copiar texto', 3000);
    }
  };

  const atualizarStatusNotaFiscal = async (status) => {
    setAtualizandoStatus(true);
    try {
      const token = localStorage.getItem('admin_token');

      // Se for CPF inválido, enviar mensagem automática
      if (status === 'cpf_invalido') {
        const mensagemCPF = `Olá! Tudo bem?
Identificamos que o CPF informado na sua compra está constando como inválido no momento de emitir a nota fiscal.
Você poderia, por gentileza, nos enviar o CPF correto?
Precisamos apenas para fins de declaração da venda. Assim que a nota for emitida, ela será enviada automaticamente para o seu e-mail.

Obrigado! 😊`;

        setTempModalNotification('success', 'detalhes', '📤 Enviando mensagem sobre CPF inválido...', 8000);

        const messageResponse = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/enviar-mensagem`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            pedidoId: pedidoSelecionado._id,
            telefone: pedidoSelecionado.usuario?.telefone,
            mensagem: mensagemCPF
          })
        });

        if (messageResponse.ok) {
          setTempModalNotification('success', 'detalhes', '🎉 Status atualizado e mensagem sobre CPF inválido enviada com sucesso!', 8000);
        } else {
          const errorData = await messageResponse.json();
          setTempModalNotification('error', 'detalhes', `❌ Status atualizado, mas erro ao enviar mensagem: ${errorData.error || 'Erro desconhecido'}`, 8000);
        }
      }

      // Atualizar status da nota fiscal sempre, independente da mensagem
      const response = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/pedidos/${pedidoSelecionado._id}/status-nota-fiscal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ statusNotaFiscal: status })
      });

      if (response.ok) {
        const updatedPedido = await response.json();
        setPedidoSelecionado(updatedPedido);
        setStatusNotaFiscal(status);
        
        // Recarregar lista de pedidos para manter sincronização
        fetchPedidos();

        // Notificar apenas se não for CPF inválido (pois já foi notificado acima)
        if (status !== 'cpf_invalido') {
          setTempModalNotification('success', 'detalhes', '✅ Status da nota fiscal atualizado com sucesso!', 5000);
        }
      } else {
        setTempModalNotification('error', 'detalhes', '❌ Erro ao atualizar status da nota fiscal', 6000);
      }
    } catch (err) {
      console.error('Erro ao atualizar status da nota fiscal:', err);
      setTempModalNotification('error', 'detalhes', `❌ Erro ao atualizar status da nota fiscal: ${err.message}`, 6000);
    } finally {
      setAtualizandoStatus(false);
    }
  };

  // Função para formatar CEP
  const formatarCEP = (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length <= 5) {
      return cepLimpo;
    }
    return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5, 8)}`;
  };

  // Função para consultar CEP
  const consultarCEP = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, ''); // Remove caracteres não numéricos

    if (cepLimpo.length !== 8) {
      return; // CEP deve ter 8 dígitos
    }

    setConsultandoCEP(true);
    try {
      console.log('Consultando CEP:', cepLimpo);
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await response.json();

      if (!dados.erro) {
        console.log('Dados do CEP encontrados:', dados);
        setUserEditData(prev => ({
          ...prev,
          rua: dados.logradouro || prev.rua,
          bairro: dados.bairro || prev.bairro,
          cidade: dados.localidade || prev.cidade,
          estado: dados.uf || prev.estado
        }));
        setTempModalNotification('success', 'userEdit', `CEP ${formatarCEP(cep)} encontrado! Endereço preenchido automaticamente.`);
      } else {
        setTempModalNotification('error', 'userEdit', 'CEP não encontrado. Verifique o número digitado.');
      }
    } catch (error) {
      console.log('Erro ao consultar CEP:', error);
      setTempModalNotification('error', 'userEdit', 'Erro ao consultar CEP. Verifique sua conexão com a internet.');
    } finally {
      setConsultandoCEP(false);
    }
  };

  const editarDadosUsuario = async (dadosAtualizados) => {
    try {
      console.log('[FRONTEND] Dados recebidos para atualização:', dadosAtualizados);

      // Campos que NÃO devem ser enviados para atualização
      const camposProibidos = ['_id', 'id', '__v', 'endereco', 'createdAt', 'updatedAt'];

      // Limpar e validar dados - apenas campos do usuário
      const dadosLimpos = {};
      const camposPermitidos = ['nome', 'email', 'cpfCnpj', 'telefone', 'cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado'];

      camposPermitidos.forEach(campo => {
        const valor = dadosAtualizados[campo];
        if (valor !== undefined && valor !== null && valor !== '') {
          dadosLimpos[campo] = typeof valor === 'string' ? valor.trim() : valor;
        }
      });

      console.log('[FRONTEND] Dados limpos para envio:', dadosLimpos);

      // Verificar se há dados para enviar
      if (Object.keys(dadosLimpos).length === 0) {
        setTempModalNotification('error', 'userEdit', 'Nenhum dado válido para atualizar');
        return;
      }

      const token = localStorage.getItem('admin_token');

      if (!token) {
        setTempModalNotification('error', 'userEdit', 'Token de administrador não encontrado. Faça login novamente.');
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/usuarios/${pedidoSelecionado.usuario._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(dadosLimpos)
      });

      console.log('[FRONTEND] Status da resposta:', response.status);

      if (response.ok) {
        const updatedUser = await response.json();
        console.log('[FRONTEND] Usuário atualizado:', updatedUser);

        // Atualizar o estado local
        setPedidoSelecionado(prev => ({
          ...prev,
          usuario: updatedUser
        }));

        // Mostrar sucesso no modal antes de fechar
        setTempModalNotification('success', 'userEdit', 'Dados do usuário atualizados com sucesso!', 2000);

        // Fechar modal após delay para mostrar mensagem
        setTimeout(() => {
          setShowUserEditModal(false);
          clearModalNotifications('userEdit');
        }, 2000);

        // Recarregar dados
        fetchPedidos();
      } else {
        const errorData = await response.json();
        console.error('[FRONTEND] Erro da API:', errorData);
        setTempModalNotification('error', 'userEdit', `Erro ao atualizar usuário: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error('[FRONTEND] Erro ao atualizar dados do usuário:', err);
      setTempModalNotification('error', 'userEdit', 'Erro ao atualizar dados do usuário: ' + err.message);
    }
  };

  const aplicarDesconto = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/pedidos/${pedidoSelecionado._id}/desconto`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ desconto })
      });

      if (response.ok) {
        const updatedPedido = await response.json();
        setPedidoSelecionado(updatedPedido);
        setTempModalNotification('success', 'desconto', 'Desconto aplicado com sucesso!', 2000);
        // Recarregar lista de pedidos para manter sincronização
        fetchPedidos();
        setTimeout(() => {
          setShowDescontoModal(false);
          clearModalNotifications('desconto');
        }, 2000);
      }
    } catch (err) {
      setTempModalNotification('error', 'desconto', 'Erro ao aplicar desconto');
    }
  };

  const editarValorFinal = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_ENDPOINTS.ADMIN_BASE}/pedidos/${pedidoSelecionado._id}/valor-final`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ valorTotal: valorEditavel })
      });

      if (response.ok) {
        const updatedPedido = await response.json();
        setPedidoSelecionado(updatedPedido);
        setTempModalNotification('success', 'detalhes', 'Valor final atualizado com sucesso!');
        // Recarregar lista de pedidos para manter sincronização
        fetchPedidos();
      }
    } catch (err) {
      setTempModalNotification('error', 'detalhes', 'Erro ao atualizar valor final');
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
      'pago': '#10b981',
      'preparando_pedido': '#3b82f6',
      'enviado': '#6b7280',
      'cancelado': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pendente': 'Pendente',
      'pago': 'Pago',
      'preparando_pedido': 'Preparando Pedido',
      'enviado': 'Enviado',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  };

  const getNotaFiscalStatusLabel = (status) => {
    const labels = {
      'pendente': 'Pendente',
      'cpf_invalido': 'CPF Inválido',
      'cpf_validado': 'CPF Validado',
      'concluido': 'Concluído Contabilizei'
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
            onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
            className="form-control"
          >
            <option value="">Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="preparando_pedido">Preparando Pedido</option>
            <option value="enviado">Enviado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          
          <input 
            type="text"
            placeholder="Filtrar por evento"
            value={filtros.evento}
            onChange={(e) => setFiltros({ ...filtros, evento: e.target.value })}
            className="form-control"
          />
          
          <input 
            type="text"
            placeholder="Filtrar por cliente"
            value={filtros.usuario}
            onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value })}
            className="form-control"
          />
          
          <input 
            type="date"
            value={filtros.dataInicio}
            onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
            className="form-control"
          />
          
          <input 
            type="date"
            value={filtros.dataFim}
            onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
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
                      // Inicializar campos da nota fiscal com dados existentes
                      setNumeroNotaFiscal(pedido.numeroNotaFiscal || '');
                      // Se o período estiver no formato YYYY-MM, extrair apenas o mês
                      const periodo = pedido.periodoNotaFiscal || '';
                      if (periodo.includes('-')) {
                        setPeriodoNotaFiscal(periodo.split('-')[1]); // Extrair apenas o mês
                      } else {
                        setPeriodoNotaFiscal(periodo);
                      }
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

    const { fotosReais, produtos } = separarFotosProdutos(pedidoSelecionado.fotos);
    const valorFotos = fotosReais.length * pedidoSelecionado.valorUnitario || 0;
    const valorProdutos = produtos.reduce((sum, produto) => sum + (parseFloat(produto.valor) || 0), 0);
    const valorItensAdicionais = pedidoSelecionado.itensAdicionais?.reduce((sum, item) => sum + item.valor, 0) || 0;

    return (
      <div 
        className="modal-overlay"
        onClick={() => {
          setShowDetalhes(false);
          clearModalNotifications('detalhes');
        }}
      >
        <div 
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>🧾 Pedido #{pedidoSelecionado.pedidoId}</h3>
            <button 
              onClick={() => {
                setShowDetalhes(false);
                clearModalNotifications('detalhes');
              }}
              className="btn-close"
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
          {detalhesError && (
              <div className="alert alert-error" style={{
                marginBottom: '20px',
                padding: '15px',
                fontSize: '14px',
                fontWeight: '600',
                border: '2px solid #dc3545',
                borderRadius: '8px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                animation: 'slideInDown 0.3s ease-out'
              }}>
                ❌ {detalhesError}
              </div>
            )}

            {detalhesSuccess && (
              <div className="alert alert-success" style={{
                marginBottom: '20px',
                padding: '15px',
                fontSize: '14px',
                fontWeight: '600',
                border: '2px solid #28a745',
                borderRadius: '8px',
                backgroundColor: '#d4edda',
                color: '#155724',
                animation: 'slideInDown 0.3s ease-out'
              }}>
                ✅ {detalhesSuccess}
              </div>
            )}


            <div className="detalhes-grid">
              {/* Informações do Cliente */}
              <div className="detalhes-section">
                <div className="section-header">
                <h4>👤 Cliente</h4>
                  <button
                    onClick={() => {
                      setUserEditData(pedidoSelecionado.usuario);
                      setShowUserEditModal(true);
                    }}
                    className="btn btn-outline btn-sm"
                  >
                    ✏️ Editar
                  </button>
                </div>
                <div className="info-grid">
                  <div><strong>Nome:</strong> {pedidoSelecionado.usuario?.nome}</div>
                  <div><strong>Email:</strong> {pedidoSelecionado.usuario?.email}</div>
                  <div><strong>Telefone:</strong> {pedidoSelecionado.usuario?.telefone}</div>
                  <div><strong>CPF/CNPJ:</strong> {pedidoSelecionado.usuario?.cpfCnpj}</div>
                  <div><strong>Rua:</strong> {pedidoSelecionado.usuario?.rua}</div>
                  <div><strong>Número:</strong> {pedidoSelecionado.usuario?.numero}</div>
                  <div><strong>Complemento:</strong> {pedidoSelecionado.usuario?.complemento}</div>
                  <div><strong>Bairro:</strong> {pedidoSelecionado.usuario?.bairro}</div>
                  <div><strong>Cidade:</strong> {pedidoSelecionado.usuario?.cidade}</div>
                  <div><strong>Estado:</strong> {pedidoSelecionado.usuario?.estado}</div>
                  <div><strong>CEP:</strong> {pedidoSelecionado.usuario?.cep}</div>
                </div>
              </div>

              {/* Informações do Pedido */}
              <div className="detalhes-section">
                <h4>📋 Pedido</h4>
                <div className="info-grid">
                  <div><strong>Evento:</strong> {pedidoSelecionado.evento}</div>
                  <div><strong>Data:</strong> {formatDate(pedidoSelecionado.dataCriacao)}</div>
                  <div><strong>Quantidade Fotos:</strong> {fotosReais.length}</div>
                  <div><strong>Quantidade Produtos:</strong> {produtos.length}</div>
                  <div><strong>Valor Unitário:</strong> {formatCurrency(pedidoSelecionado.valorUnitario)}</div>
                </div>
              </div>
            </div>

            
            {/* Notificações do Modal */}
            {detalhesError && (
              <div className="alert alert-error" style={{
                marginBottom: '20px',
                padding: '15px',
                fontSize: '14px',
                fontWeight: '600',
                border: '2px solid #dc3545',
                borderRadius: '8px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                animation: 'slideInDown 0.3s ease-out'
              }}>
                ❌ {detalhesError}
                </div>
            )}

            {detalhesSuccess && (
              <div className="alert alert-success" style={{
                marginBottom: '20px',
                padding: '15px',
                fontSize: '14px',
                fontWeight: '600',
                border: '2px solid #28a745',
                borderRadius: '8px',
                backgroundColor: '#d4edda',
                color: '#155724',
                animation: 'slideInDown 0.3s ease-out'
              }}>
                ✅ {detalhesSuccess}
              </div>
            )}
            {/* Status */}
            <div className="detalhes-section">
              <h4>📊 Status do Pedido</h4>
              <select 
                value={pedidoSelecionado.status}
                onChange={(e) => updatePedidoStatus(pedidoSelecionado._id, e.target.value)}
                className="form-control"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="preparando_pedido">Preparando Pedido</option>
                <option value="enviado">Enviado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Nota Fiscal */}
            <div className="detalhes-section">
              <h4>📋 Nota Fiscal</h4>
              <div className="nota-fiscal-layout">
                {/* Linha 1: Número da Nota Fiscal */}
                <div className="form-group">
                  <label>Número da Nota Fiscal:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={numeroNotaFiscal}
                    onChange={(e) => setNumeroNotaFiscal(e.target.value)}
                    placeholder="Digite o número da nota fiscal"
                  />
                </div>
                
                {/* Linha 2: Mês, Botão e Status */}
                <div className="nota-fiscal-linha2">
                  <div className="form-group mes-campo">
                    <label>Mês:</label>
                    <select
                      className="form-control"
                      value={periodoNotaFiscal}
                      onChange={(e) => setPeriodoNotaFiscal(e.target.value)}
                    >
                      <option value="">Selecione o mês</option>
                      <option value="01">Janeiro</option>
                      <option value="02">Fevereiro</option>
                      <option value="03">Março</option>
                      <option value="04">Abril</option>
                      <option value="05">Maio</option>
                      <option value="06">Junho</option>
                      <option value="07">Julho</option>
                      <option value="08">Agosto</option>
                      <option value="09">Setembro</option>
                      <option value="10">Outubro</option>
                      <option value="11">Novembro</option>
                      <option value="12">Dezembro</option>
                    </select>
                  </div>
                  
                  <div className="form-group botao-campo">
                    <label>&nbsp;</label>
                    <button
                      onClick={salvarDadosNotaFiscal}
                      className="btn btn-primary"
                      disabled={!numeroNotaFiscal.trim()}
                    >
                      💾 Salvar Dados
                    </button>
                  </div>

                  <div className="form-group status-campo">
                    <label>Status da Nota Fiscal:</label>
                    <select
                      className="form-control"
                      value={pedidoSelecionado.statusNotaFiscal || 'pendente'}
                      onChange={(e) => atualizarStatusNotaFiscal(e.target.value)}
                      disabled={atualizandoStatus}
                      style={{
                        opacity: atualizandoStatus ? 0.6 : 1,
                        cursor: atualizandoStatus ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="cpf_invalido">CPF Inválido {atualizandoStatus && '(Enviando mensagem...)'}</option>
                      <option value="cpf_validado">CPF Validado</option>
                      <option value="concluido">Concluído Contabilizei</option>
                    </select>
                    {atualizandoStatus && (
                      <small style={{ color: '#007bff', fontStyle: 'italic' }}>
                        🔄 Atualizando status e enviando mensagem...
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Envio do Pedido */}
            <div className="detalhes-section">
              <h4>📤 Envio do Pedido</h4>
              <div className="envio-pedido">
                <div className="form-group">
                  <label>Link do Pedido:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={linkPedido}
                    onChange={(e) => setLinkPedido(e.target.value)}
                    placeholder="Cole o link do pedido aqui"
                  />
                </div>
                <button
                  onClick={enviarMensagemCliente}
                  className="btn btn-success"
                  disabled={!linkPedido.trim() || enviandoMensagem}
                >
                  {enviandoMensagem ? (
                    <>🔄 Enviando mensagens...</>
                  ) : (
                    <>📱 Enviar Mensagem para Cliente</>
                  )}
                </button>
                <small className="help-text">
                  Será enviada uma mensagem de confirmação e após 10 segundos uma mensagem de feedback.
                </small>
              </div>
            </div>

            {/* Fotos */}
            <div className="detalhes-section">
              <h4>📷 Fotos ({(pedidoSelecionado.fotos?.filter(foto => !identificarProduto(foto)) || []).length})</h4>
              <div className="fotos-lista">
                {pedidoSelecionado.fotos?.filter(foto => !identificarProduto(foto)).map((foto, index) => (
                  <div key={index} className="foto-item">
                    <strong>{foto.nome}</strong>
                    {foto.coreografia && <span> - {foto.coreografia}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Produtos */}
            {pedidoSelecionado.fotos?.filter(foto => identificarProduto(foto)).length > 0 && (
              <div className="detalhes-section">
                <h4>🛍️ Produtos ({(pedidoSelecionado.fotos?.filter(foto => identificarProduto(foto)) || []).length})</h4>
                <div className="produtos-lista">
                  {pedidoSelecionado.fotos?.filter(foto => identificarProduto(foto)).map((produto, index) => (
                    <div key={index} className="produto-item">
                      <strong>{produto.nome}</strong>
                      {produto.coreografia && <span> - {produto.coreografia}</span>}
                      {produto.codigo && <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}> - Cód: {produto.codigo}</span>}
                      {produto.valor && <span className="produto-valor"> - {formatCurrency(produto.valor)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            
            {/* Desconto e Edição de Valores */}
            <div className="detalhes-section">
              <h4>💰 Edição de Valores</h4>
              <div className="valores-edicao">
                <button
                  onClick={() => setShowDescontoModal(true)}
                  className="btn btn-warning"
                >
                  🏷️ Aplicar Desconto
                </button>
                <div className="form-group inline">
                  <label>Valor Final:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={valorEditavel || pedidoSelecionado.valorTotal || 0}
                    onChange={(e) => {
                      // Permitir apenas números, pontos e vírgulas
                      const value = e.target.value.replace(/[^0-9.,]/g, '');
                      const valor = parseFloat(value.replace(',', '.'));
                      setValorEditavel(isNaN(valor) ? 0 : valor);
                    }}
                    placeholder="Ex: 150.00"
                  />
                  <button
                    onClick={editarValorFinal}
                    className="btn btn-primary btn-sm"
                  >
                    💾 Salvar
                  </button>
                </div>
              </div>
            </div>
            {/* Resumo Financeiro Detalhado */}
            <div className="detalhes-section">
              <h4>💰 Resumo Financeiro Completo</h4>
              <div className="resumo-financeiro">
                
                {/* Valores Base - Fotos */}
                <div className="secao-valores">
                  <h5>📸 Fotos</h5>
                  <div className="valor-linha">
                    <span>Fotos ({fotosReais.length} unidades):</span>
                    <span className="valor">{formatCurrency(pedidoSelecionado.valorUnitario)} cada</span>
                  </div>
                  <div className="valor-linha">
                    <span>Subtotal Fotos:</span>
                    <span className="valor">{formatCurrency(valorFotos)}</span>
                  </div>
                </div>

                {/* Produtos */}
                {produtos.length > 0 && (
                  <div className="secao-valores">
                    <h5>🛍️ Produtos</h5>
                    {produtos.map((produto, index) => (
                      <div key={index} className="valor-linha">
                        <span>{produto.nome}:</span>
                        <span className="valor">{formatCurrency(produto.valor || 0)}</span>
                      </div>
                    ))}
                    <div className="valor-linha subtotal">
                      <span>Subtotal Produtos:</span>
                      <span className="valor">{formatCurrency(valorProdutos)}</span>
                    </div>
                  </div>
                )}

                {/* Itens Adicionais */}
                {pedidoSelecionado.itensAdicionais && pedidoSelecionado.itensAdicionais.length > 0 && (
                  <div className="secao-valores">
                    <h5>➕ Itens Adicionais</h5>
                    {pedidoSelecionado.itensAdicionais.map((item, index) => (
                      <div key={index} className="valor-linha">
                        <span>{item.descricao}:</span>
                        <span className="valor">{formatCurrency(item.valor)}</span>
                      </div>
                    ))}
                    <div className="valor-linha subtotal">
                      <span>Subtotal Adicionais:</span>
                      <span className="valor">{formatCurrency(
                        pedidoSelecionado.itensAdicionais.reduce((sum, item) => sum + item.valor, 0)
                      )}</span>
                    </div>
                  </div>
                )}

                {/* Cupom de Desconto */}
                {pedidoSelecionado.cupom && pedidoSelecionado.cupom.codigo && (
                  <div className="secao-valores cupom">
                    <h5>🏷️ Cupom de Desconto</h5>
                    <div className="valor-linha">
                      <span>Código: <strong>{pedidoSelecionado.cupom.codigo}</strong></span>
                      <span className="descricao">{pedidoSelecionado.cupom.descricao}</span>
                    </div>
                    <div className="valor-linha desconto">
                      <span>Desconto Aplicado:</span>
                      <span className="valor desconto">-{formatCurrency(pedidoSelecionado.cupom.desconto)}</span>
                    </div>
                  </div>
                )}

                {/* Histórico de Alterações de Valor */}
                {pedidoSelecionado.logs && pedidoSelecionado.logs.filter(log => 
                  log.acao.includes('valor') || log.acao.includes('desconto')
                ).length > 0 && (
                  <div className="secao-valores historico">
                    <h5>📝 Histórico de Alterações</h5>
                    {pedidoSelecionado.logs
                      .filter(log => log.acao.includes('valor') || log.acao.includes('desconto'))
                      .slice(-3) // Últimas 3 alterações
                      .map((log, index) => (
                        <div key={index} className="valor-linha historico">
                          <span>{log.descricao}</span>
                          <span className="data">{formatDate(log.dataAlteracao)}</span>
                        </div>
                      ))
                    }
                  </div>
                )}

                {/* Total Final */}
                <div className="secao-valores total-final">
                  <div className="valor-linha total">
                    <span><strong>💳 TOTAL FINAL:</strong></span>
                    <span className="valor total"><strong>{formatCurrency(pedidoSelecionado.valorTotal)}</strong></span>
                  </div>
                </div>

              </div>
            </div>
            

            

          <div className="modal-footer">
            <button 
              onClick={() => {
                setEditData({
                  valorUnitario: pedidoSelecionado.valorUnitario,
                  novoItem: { descricao: '', valor: '' }
                });
                inicializarEdicaoPedido(pedidoSelecionado);
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
              onClick={copiarTextoSeparador}
              className="btn btn-success"
              title="Copiar resumo do pedido"
            >
              📋 Separador
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
      <div 
        className="modal-overlay"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="modal-content modal-large"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>✏️ Editar Pedido #{pedidoSelecionado.pedidoId}</h3>
            <button 
              onClick={cancelarEdicaoPedido}
              className="btn-close"
            >
              ✕
            </button>
          </div>

          <div className="modal-body modal-body-clean">
            
            {/* Seção Principal - Valor e Listagens */}
            <div className="secao-principal">
              
              {/* Valor Unitário */}
              <div className="campo-valor-unitario">
                <label className="campo-label">💰 Valor por Foto</label>
                <div className="input-valor-container">
                  <input 
                    type="text"
                    value={valorUnitarioEditavel}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.,]/g, '');
                      const numero = parseFloat(value.replace(',', '.')) || 0;
                      setValorUnitarioEditavel(numero);
                    }}
                    className="input-valor"
                    placeholder="25.00"
                  />
                  <span className="preview-valor">{formatCurrency(valorUnitarioEditavel)}</span>
                </div>
              </div>

              {/* Fotos */}
              <div className="secao-itens">
                <div className="header-secao">
                  <h4>📸 Fotos ({fotosEditaveis.length})</h4>
                </div>
                
                {fotosEditaveis.length > 0 ? (
                  <div className="lista-itens">
                    {fotosEditaveis.map((foto, index) => (
                      <div key={index} className="item-linha foto">
                        <div className="item-conteudo">
                          <div className="item-nome">{foto.nome}</div>
                          {foto.coreografia && <div className="item-extra">{foto.coreografia}</div>}
                        </div>
                        <div className="item-valor">{formatCurrency(valorUnitarioEditavel)}</div>
                        <button 
                          onClick={() => removerFoto(index)}
                          className="btn-remover"
                          title="Remover"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <div className="subtotal">
                      Subtotal: {formatCurrency(fotosEditaveis.length * valorUnitarioEditavel)}
                    </div>
                  </div>
                ) : (
                  <div className="secao-vazia">Nenhuma foto</div>
                )}
              </div>

              {/* Produtos */}
              <div className="secao-itens">
                <div className="header-secao">
                  <h4>🛍️ Produtos ({produtosEditaveis.length})</h4>
                </div>
                
                {produtosEditaveis.length > 0 ? (
                  <div className="lista-itens">
                    {produtosEditaveis.map((produto, index) => (
                      <div key={index} className="item-linha produto">
                        <div className="item-conteudo">
                          <div className="item-nome">{produto.nome}</div>
                          {produto.coreografia && <div className="item-extra">{produto.coreografia}</div>}
                          {produto.codigo && <div className="item-extra" style={{ color: '#ff6b6b', fontWeight: 'bold' }}>Cód: {produto.codigo}</div>}
                        </div>
                        <div className="item-valor">{formatCurrency(produto.valor || 0)}</div>
                        <button 
                          onClick={() => removerProduto(index)}
                          className="btn-remover"
                          title="Remover"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <div className="subtotal">
                      Subtotal: {formatCurrency(produtosEditaveis.reduce((sum, produto) => sum + (parseFloat(produto.valor) || 0), 0))}
                    </div>
                  </div>
                ) : (
                  <div className="secao-vazia">Nenhum produto</div>
                )}
              </div>

              {/* Itens Adicionais */}
              <div className="secao-itens">
                <div className="header-secao">
                  <h4>📦 Itens Adicionais ({itensEditaveis.length})</h4>
                </div>
                
                {itensEditaveis.length > 0 && (
                  <div className="lista-itens">
                    {itensEditaveis.map((item, index) => (
                      <div key={index} className="item-linha item-adicional">
                        <div className="item-conteudo">
                          <div className="item-nome">{item.descricao}</div>
                        </div>
                        <div className="item-valor">{formatCurrency(item.valor)}</div>
                        <button 
                          onClick={() => removerItemAdicional(index)}
                          className="btn-remover"
                          title="Remover"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <div className="subtotal">
                      Subtotal: {formatCurrency(itensEditaveis.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0))}
                    </div>
                  </div>
                )}

                {/* Adicionar Novo Item */}
                <div className="adicionar-item">
                  <div className="input-group-horizontal">
                    <input 
                      type="text"
                      placeholder="Descrição do item"
                      value={novoItemEdicao.descricao}
                      onChange={(e) => setNovoItemEdicao(prev => ({ ...prev, descricao: e.target.value }))}
                      className="input-descricao"
                    />
                    <input 
                      type="text"
                      placeholder="Valor"
                      value={novoItemEdicao.valor}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.,]/g, '');
                        setNovoItemEdicao(prev => ({ ...prev, valor: value }));
                      }}
                      className="input-valor-item"
                    />
                    <button 
                      onClick={adicionarNovoItemEdicao}
                      className="btn-adicionar"
                      disabled={!novoItemEdicao.descricao.trim() || !novoItemEdicao.valor}
                    >
                      + Adicionar
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Total */}
            <div className="secao-total">
              <div className="total-detalhes">
                <div className="linha-calculo">
                  <span>{fotosEditaveis.length} fotos × {formatCurrency(valorUnitarioEditavel)}</span>
                  <span>{formatCurrency(fotosEditaveis.length * valorUnitarioEditavel)}</span>
                </div>
                {produtosEditaveis.length > 0 && (
                  <div className="linha-calculo">
                    <span>{produtosEditaveis.length} produtos</span>
                    <span>{formatCurrency(produtosEditaveis.reduce((sum, produto) => sum + (parseFloat(produto.valor) || 0), 0))}</span>
                  </div>
                )}
                {itensEditaveis.length > 0 && (
                  <div className="linha-calculo">
                    <span>{itensEditaveis.length} itens adicionais</span>
                    <span>{formatCurrency(itensEditaveis.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0))}</span>
                  </div>
                )}
                <div className="linha-total">
                  <span>TOTAL</span>
                  <span>{formatCurrency(calcularNovoTotal())}</span>
                </div>
              </div>
            </div>

          </div>

          <div className="modal-footer modal-footer-edit">
            <div className="botoes-esquerda">
              <button 
                onClick={limparPedidoCompleto}
                className="btn btn-warning"
                disabled={fotosEditaveis.length === 0 && produtosEditaveis.length === 0 && itensEditaveis.length === 0}
              >
                🗑️ Limpar Pedido
              </button>
            </div>
            
            <div className="botoes-direita">
              <button 
                onClick={cancelarEdicaoPedido}
                className="btn btn-secondary"
              >
                ❌ Cancelar
              </button>
              <button 
                onClick={salvarEdicaoPedido}
                className="btn btn-success"
                disabled={fotosEditaveis.length === 0 && produtosEditaveis.length === 0 && itensEditaveis.length === 0}
              >
                💾 Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLogsModal = () => {
    if (!showLogsModal || !pedidoSelecionado) return null;

    return (
      <div 
        className="modal-overlay"
        onClick={() => setShowLogsModal(false)}
      >
        <div 
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
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

  // Modal de Edição de Usuário
  const renderUserEditModal = () => {
    if (!showUserEditModal) return null;

    return (
      <div 
        className="modal-overlay"
        onClick={() => {
          setShowUserEditModal(false);
          clearModalNotifications('userEdit');
        }}
      >
        <div 
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>👤 Editar Dados do Cliente</h3>
            <button
              onClick={() => {
                setShowUserEditModal(false);
                clearModalNotifications('userEdit');
              }}
              className="btn-close"
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            {/* Notificações do Modal */}
            {userEditError && (
              <div className="alert alert-error" style={{
                marginBottom: '20px',
                padding: '15px',
                fontSize: '14px',
                fontWeight: '600',
                border: '2px solid #dc3545',
                borderRadius: '8px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                animation: 'slideInDown 0.3s ease-out'
              }}>
                ❌ {userEditError}
              </div>
            )}

            {userEditSuccess && (
              <div className="alert alert-success" style={{
                marginBottom: '20px',
                padding: '15px',
                fontSize: '14px',
                fontWeight: '600',
                border: '2px solid #28a745',
                borderRadius: '8px',
                backgroundColor: '#d4edda',
                color: '#155724',
                animation: 'slideInDown 0.3s ease-out'
              }}>
                ✅ {userEditSuccess}
              </div>
            )}

            <div className="user-edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nome Completo:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={userEditData.nome || ''}
                    onChange={(e) => setUserEditData(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    className="form-control"
                    value={userEditData.email || ''}
                    onChange={(e) => setUserEditData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Telefone:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={userEditData.telefone || ''}
                    onChange={(e) => setUserEditData(prev => ({ ...prev, telefone: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>CPF/CNPJ:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={userEditData.cpfCnpj || ''}
                    onChange={(e) => setUserEditData(prev => ({ ...prev, cpfCnpj: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Rua:</label>
                <input
                  type="text"
                  className="form-control"
                  value={userEditData.rua || ''}
                  onChange={(e) => setUserEditData(prev => ({ ...prev, rua: e.target.value }))}
                  placeholder="Nome da rua"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Número:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={userEditData.numero || ''}
                    onChange={(e) => setUserEditData(prev => ({ ...prev, numero: e.target.value }))}
                    placeholder="Número"
                  />
                </div>
                <div className="form-group">
                  <label>Complemento:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={userEditData.complemento || ''}
                    onChange={(e) => setUserEditData(prev => ({ ...prev, complemento: e.target.value }))}
                    placeholder="Apt, casa, etc."
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Bairro:</label>
                <input
                  type="text"
                  className="form-control"
                  value={userEditData.bairro || ''}
                  onChange={(e) => setUserEditData(prev => ({ ...prev, bairro: e.target.value }))}
                  placeholder="Bairro"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cidade:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={userEditData.cidade || ''}
                    onChange={(e) => setUserEditData(prev => ({ ...prev, cidade: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Estado:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={userEditData.estado || ''}
                    onChange={(e) => setUserEditData(prev => ({ ...prev, estado: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>CEP:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={userEditData.cep || ''}
                    onChange={(e) => {
                      const cepDigitado = e.target.value;
                      const cepFormatado = formatarCEP(cepDigitado);
                      setUserEditData(prev => ({ ...prev, cep: cepFormatado }));

                      // Se o CEP tem 8 dígitos, consulta automaticamente
                      const cepLimpo = cepDigitado.replace(/\D/g, '');
                      if (cepLimpo.length === 8) {
                        consultarCEP(cepDigitado);
                      }
                    }}
                    placeholder="00000-000"
                    maxLength="9"
                    disabled={consultandoCEP}
                    style={{
                      fontFamily: 'Courier New, monospace',
                      letterSpacing: '1px',
                      backgroundColor: consultandoCEP ? '#f8f9fa' : 'white'
                    }}
                  />
                  {consultandoCEP && (
                    <small style={{ color: '#0c5460', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ animation: 'spin 1s linear infinite' }}>🔄</span>
                      Consultando CEP...
                    </small>
                  )}
                  {!consultandoCEP && (
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      💡 Digite o CEP com 8 dígitos para buscar endereço automaticamente
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              onClick={() => setShowUserEditModal(false)}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={() => editarDadosUsuario(userEditData)}
              className="btn btn-primary"
            >
              💾 Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal de Desconto
  const renderDescontoModal = () => {
    if (!showDescontoModal || !pedidoSelecionado) return null;

    return (
      <div 
        className="modal-overlay"
        onClick={() => {
          setShowDescontoModal(false);
          clearModalNotifications('desconto');
        }}
      >
        <div 
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>🏷️ Aplicar Desconto</h3>
            <button
              onClick={() => {
                setShowDescontoModal(false);
                clearModalNotifications('desconto');
              }}
              className="btn-close"
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            {/* Notificações do Modal */}
            {descontoError && (
              <div className="alert alert-error" style={{
                marginBottom: '20px',
                padding: '15px',
                fontSize: '14px',
                fontWeight: '600',
                border: '2px solid #dc3545',
                borderRadius: '8px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                animation: 'slideInDown 0.3s ease-out'
              }}>
                ❌ {descontoError}
              </div>
            )}

            {descontoSuccess && (
              <div className="alert alert-success" style={{
                marginBottom: '20px',
                padding: '15px',
                fontSize: '14px',
                fontWeight: '600',
                border: '2px solid #28a745',
                borderRadius: '8px',
                backgroundColor: '#d4edda',
                color: '#155724',
                animation: 'slideInDown 0.3s ease-out'
              }}>
                ✅ {descontoSuccess}
              </div>
            )}

            <div className="desconto-form">
              <div className="form-group">
                <label>Tipo de Desconto:</label>
                <select
                  className="form-control"
                  value={desconto.tipo}
                  onChange={(e) => setDesconto(prev => ({ ...prev, tipo: e.target.value }))}
                >
                  <option value="valor">Valor Fixo (R$)</option>
                  <option value="percentual">Percentual (%)</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  {desconto.tipo === 'valor' ? 'Valor do Desconto (R$):' : 'Percentual de Desconto (%):'}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={desconto.valor || 0}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.,]/g, '');
                    const valor = parseFloat(value.replace(',', '.'));
                    setDesconto(prev => ({ ...prev, valor: isNaN(valor) ? 0 : valor }));
                  }}
                  placeholder={desconto.tipo === 'valor' ? 'Ex: 25.00' : 'Ex: 10'}
                />
              </div>

              <div className="desconto-preview">
                <h4>💰 Prévia do Desconto:</h4>
                <div className="valor-original">
                  <span>Valor Original: {formatCurrency(pedidoSelecionado.valorTotal)}</span>
                </div>
                <div className="valor-desconto">
                  <span>Desconto: {desconto.tipo === 'valor' ?
                    formatCurrency(desconto.valor) :
                    `${desconto.valor}% (${formatCurrency(pedidoSelecionado.valorTotal * desconto.valor / 100)})`
                  }</span>
                </div>
                <div className="valor-final">
                  <strong>Valor Final: {
                    desconto.tipo === 'valor' ?
                      formatCurrency(pedidoSelecionado.valorTotal - desconto.valor) :
                      formatCurrency(pedidoSelecionado.valorTotal * (1 - desconto.valor / 100))
                  }</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              onClick={() => setShowDescontoModal(false)}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={aplicarDesconto}
              className="btn btn-success"
              disabled={!desconto.valor || desconto.valor <= 0}
            >
              ✅ Aplicar Desconto
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="financeiro-container">
      {/* Notificações globais para operações da lista */}
      {(error || success) && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, maxWidth: '400px' }}>
      {error && (
            <div className="alert alert-error" style={{ marginBottom: '10px' }}>
          ❌ {error}
        </div>
      )}
      
      {success && (
            <div className="alert alert-success" style={{ marginBottom: '10px' }}>
          ✅ {success}
            </div>
          )}
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
      {showUserEditModal && renderUserEditModal()}
      {showDescontoModal && renderDescontoModal()}
    </div>
  );
};

export default FinanceiroAdmin;
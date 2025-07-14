import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import EventosPage from './pages/EventosPage';
import CoreografiasPage from './pages/CoreografiasPage';
import FotosPage from './pages/FotosPage';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import CartModal from './components/CartModal';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import OrderSuccessModal from './components/OrderSuccessModal';
import { useCart } from './components/CartContext';
import { NavigationProvider } from './context/NavigationContext';
import { API_ENDPOINTS } from './config/api';
import NavegadorPastasFotosPage from './pages/NavegadorPastasFotosPage';
import { preloader } from './utils/preloader';
import './App.css';

function AppContent() {
  const location = useLocation();
  
  // Inicia pré-carregamento inteligente quando a rota muda
  useEffect(() => {
    preloader.smartPreload(location.pathname);
  }, [location.pathname]);

  return null;
}

function App() {
  const { cart, removeFromCart, clearCart } = useCart();
  const [showCart, setShowCart] = useState(false);
  const [valorUnitario, setValorUnitario] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMsg, setCheckoutMsg] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [successPedidoId, setSuccessPedidoId] = useState('');

  // Verificar se o usuário está logado
  const isLoggedIn = !!localStorage.getItem('user_token');

  // Função utilitária para calcular preço baseado na quantidade
  function calcularPrecoPorQuantidade(tabelaPreco, quantidade) {
    if (!tabelaPreco || !tabelaPreco.faixas) {
      return null;
    }
    
    // Ordena as faixas por valor mínimo (crescente)
    const faixasOrdenadas = [...tabelaPreco.faixas].sort((a, b) => a.min - b.min);
    
    // Encontra a faixa que se aplica à quantidade
    for (const faixa of faixasOrdenadas) {
      const min = faixa.min;
      const max = faixa.max;
      
      // Se não tem max, aceita qualquer valor >= min
      if (!max) {
        if (quantidade >= min) {
          return faixa.valor;
        }
      } else {
        // Se tem max, verifica se está no intervalo
        if (quantidade >= min && quantidade <= max) {
          return faixa.valor;
        }
      }
    }
    
    return null; // Nenhuma faixa se aplica
  }

  // Calcular valor unitário baseado nas regras do admin
  useEffect(() => {
    async function calcularValorUnitario() {
      console.log('🔍 [DEBUG CARRINHO] Iniciando cálculo de valor unitário');
      
      if (cart.length === 0) {
        console.log('🔍 [DEBUG CARRINHO] Carrinho vazio, definindo valor 0');
        setValorUnitario(0);
        return;
      }

      // Separar banners de fotos normais
      const banners = cart.filter(item => item.tipo === 'banner');
      const fotos = cart.filter(item => item.tipo !== 'banner');
      
      console.log('🔍 [DEBUG CARRINHO] Banners no carrinho:', banners.length);
      console.log('🔍 [DEBUG CARRINHO] Fotos normais no carrinho:', fotos.length);

      // Se só tem banners, não precisa calcular valor unitário de fotos
      if (fotos.length === 0) {
        console.log('🔍 [DEBUG CARRINHO] Apenas banners no carrinho, valor unitário = 0');
        setValorUnitario(0);
        return;
      }

      try {
        console.log('🔍 [DEBUG CARRINHO] Buscando eventos da API pública...');
        // Buscar todos os eventos cadastrados (usando rota pública)
        const resEventos = await fetch(API_ENDPOINTS.PUBLIC_EVENTOS);
        if (!resEventos.ok) {
          throw new Error(`Erro ao buscar eventos: ${resEventos.status}`);
        }
        const eventos = await resEventos.json();

        // Buscar todas as tabelas de preço
        console.log('🔍 [DEBUG CARRINHO] Buscando tabelas de preço da API pública...');
        const resTabelas = await fetch(API_ENDPOINTS.PUBLIC_TABELAS_PRECO);
        if (!resTabelas.ok) {
          throw new Error(`Erro ao buscar tabelas de preço: ${resTabelas.status}`);
        }
        const tabelas = await resTabelas.json();

        // Pegar evento da primeira foto (não banner)
        const primeiraFoto = fotos[0];
        
        console.log('🔍 [DEBUG CARRINHO] Primeira foto do carrinho (completa):', JSON.stringify(primeiraFoto, null, 2));
        
        // Normalizar nome do evento da primeira foto
        function normalize(str) {
          return str ? str.toLowerCase().trim() : '';
        }

        const nomeEvento = `${primeiraFoto.evento} ${primeiraFoto.dia || ''}`.trim();
        console.log('🔍 [DEBUG CARRINHO] Nome do evento extraído:', nomeEvento);
        
        if (!nomeEvento || nomeEvento === 'undefined' || nomeEvento === 'undefined undefined') {
          console.log('🔍 [DEBUG CARRINHO] Nome do evento não encontrado no carrinho ou é inválido:', nomeEvento);
          setValorUnitario(0);
          return;
        }

        console.log('🔍 [DEBUG CARRINHO] Procurando evento:', nomeEvento);

        // Encontrar o evento correspondente
        let evento = eventos.find(e => {
          const nomeEventoNormalizado = normalize(e.nome);
          const nomeCarrinhoNormalizado = normalize(nomeEvento);
          const match = nomeEventoNormalizado === nomeCarrinhoNormalizado;
          return match;
        });

        if (!evento) {
          console.log('🔍 [DEBUG CARRINHO] Evento não encontrado na lista de eventos. Procurando por partes do nome...');
          
          // Tentar encontrar por substring
          const eventoSubstring = eventos.find(e => {
            const nomeEventoNormalizado = normalize(e.nome);
            const nomeCarrinhoNormalizado = normalize(nomeEvento);
            const match = nomeEventoNormalizado.includes(nomeCarrinhoNormalizado) || 
                         nomeCarrinhoNormalizado.includes(nomeEventoNormalizado);
            return match;
          });
          
          if (!eventoSubstring) {
            console.log('🔍 [DEBUG CARRINHO] Evento não encontrado mesmo por substring. Usando tabela default.');
            // Usar tabela default se não encontrar o evento
            const tabelaDefault = tabelas.find(t => t.isDefault);
            if (tabelaDefault) {
              const valor = calcularPrecoPorQuantidade(tabelaDefault, fotos.length);
              console.log(`🔍 [DEBUG CARRINHO] Valor calculado pela tabela default (${fotos.length} fotos):`, valor);
              setValorUnitario(valor || 0);
            } else {
              console.log('🔍 [DEBUG CARRINHO] Nenhuma tabela default encontrada');
              setValorUnitario(0);
            }
            return;
          }
          
          console.log('🔍 [DEBUG CARRINHO] Evento encontrado por substring:', eventoSubstring);
          // Usar o evento encontrado por substring
          evento = eventoSubstring;
        }

        console.log('🔍 [DEBUG CARRINHO] Evento encontrado:', JSON.stringify(evento, null, 2));

        let valor = 0;

        // Se evento tem valor fixo, usar ele
        if (evento.valorFixo) {
          valor = evento.valorFixo;
          console.log(`🔍 [DEBUG CARRINHO] Usando valor fixo do evento: ${valor}`);
        }
        // Se evento tem tabela específica, usar ela
        else if (evento.tabelaPrecoId) {
          valor = calcularPrecoPorQuantidade(evento.tabelaPrecoId, fotos.length);
          console.log(`🔍 [DEBUG CARRINHO] Valor calculado pela tabela específica (${fotos.length} fotos):`, valor);
        }
        // Usar tabela default
        else {
          console.log('🔍 [DEBUG CARRINHO] Evento não possui valor fixo nem tabela específica. Usando tabela default.');
          const tabelaDefault = tabelas.find(t => t.isDefault);
          if (tabelaDefault) {
            valor = calcularPrecoPorQuantidade(tabelaDefault, fotos.length);
            console.log(`🔍 [DEBUG CARRINHO] Valor calculado pela tabela default (${fotos.length} fotos):`, valor);
          } else {
            console.log('🔍 [DEBUG CARRINHO] Nenhuma tabela default encontrada');
          }
        }

        console.log('🔍 [DEBUG CARRINHO] Valor unitário final calculado:', valor);
        setValorUnitario(valor || 0);

      } catch (error) {
        console.error('🔍 [DEBUG CARRINHO] Erro ao calcular valor unitário:', error);
        setValorUnitario(0);
      }
    }

    calcularValorUnitario();
  }, [cart]);

  async function handleCheckout() {
    setCheckoutLoading(true);
    setCheckoutMsg('');
    try {
      const token = localStorage.getItem('user_token');
      if (!token) {
        setCheckoutLoading(false);
        setShowCart(false);
        setShowLogin(true);
        return;
      }
      // Buscar dados do usuário (opcional, só para garantir que está autenticado)
      const resUser = await fetch(API_ENDPOINTS.ME, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!resUser.ok) {
        setCheckoutLoading(false);
        setShowCart(false);
        setShowLogin(true);
        return;
      }
      // Montar payload do pedido
      const evento = cart[0]?.evento || '';
      const fotos = cart.map(f => ({
        nome: f.nome,
        url: f.url,
        coreografia: f.coreografia || '',
        tipo: f.tipo || 'foto', // Incluir tipo (banner ou foto)
        preco: f.preco || 0, // Incluir preço (importante para banners)
        categoria: f.categoria || '', // Incluir categoria (vale/video)
        evento: f.evento || '',
        dia: f.dia || null
      }));
      if (!evento || fotos.length === 0) {
        setCheckoutMsg('Carrinho vazio ou evento não identificado.');
        setCheckoutLoading(false);
        return;
      }
      // Enviar pedido para backend
      const res = await fetch(API_ENDPOINTS.SEND_ORDER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ evento, fotos, valorUnitario })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSuccessPedidoId(data.pedidoId);
        setShowOrderSuccess(true);
        clearCart();
        setShowCart(false);
      } else {
        setCheckoutMsg(data.error || 'Erro ao enviar pedido.');
      }
    } catch (e) {
      setCheckoutMsg('Erro ao finalizar a compra.');
    }
    setCheckoutLoading(false);
  }

  return (
    <NavigationProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AppContent />
        <Header onCartClick={() => setShowCart(true)} />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/eventos" />} />
            <Route path="/eventos" element={<EventosPage />} />
            <Route path="/eventos/:eventoId" element={<CoreografiasPage setShowCart={setShowCart} />} />
            <Route path="/eventos/:eventoId/:coreografiaId/fotos" element={<FotosPage setShowCart={setShowCart} />} />
            <Route path="/eventos/:eventoId/:diaId/:coreografiaId/fotos" element={<FotosPage setShowCart={setShowCart} />} />
            <Route path="/eventos/pasta/*" element={<NavegadorPastasFotosPage setShowCart={setShowCart} />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </div>
        {showCart && (
          <CartModal
            fotos={cart}
            onClose={() => setShowCart(false)}
            onRemove={removeFromCart}
            onCheckout={handleCheckout}
            valorUnitario={valorUnitario}
            checkoutLoading={checkoutLoading}
            checkoutMsg={checkoutMsg}
            isLoggedIn={isLoggedIn}
            onShowLogin={() => {
              setShowCart(false);
              setShowLogin(true);
            }}
            onShowRegister={() => {
              setShowCart(false);
              setShowRegister(true);
            }}
          />
        )}
        {showLogin && (
          <LoginModal
            onClose={() => setShowLogin(false)}
            onRegisterClick={() => { setShowLogin(false); setShowRegister(true); }}
            onLoginSuccess={() => {
              setShowLogin(false);
              setShowCart(true); // Reabre o carrinho após login
            }}
          />
        )}
        {showRegister && (
          <RegisterModal
            onClose={() => setShowRegister(false)}
            onLoginClick={() => { setShowRegister(false); setShowLogin(true); }}
            onLoginSuccess={() => {
              setShowRegister(false);
              setShowCart(true); // Reabre o carrinho após cadastro
            }}
          />
        )}
        <OrderSuccessModal
          isOpen={showOrderSuccess}
          onClose={() => setShowOrderSuccess(false)}
          pedidoId={successPedidoId}
        />
      </Router>
    </NavigationProvider>
  );
}

export default App;

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
import API_ENDPOINTS from './config/api';
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

  // Calcular valor unitário baseado nas regras do admin
  useEffect(() => {
    async function calcularValorUnitario() {
      if (cart.length === 0) {
        setValorUnitario(0);
        return;
      }

      try {
        // Recuperar token do admin
        const token = localStorage.getItem('admin_token') || '';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Buscar todos os eventos cadastrados
        const resEventos = await fetch(API_ENDPOINTS.ADMIN_EVENTOS, { headers });
        let eventos = await resEventos.json();

        // Buscar todas as tabelas de preço
        const resTabelas = await fetch(API_ENDPOINTS.ADMIN_TABELAS_PRECO, { headers });
        let tabelas = await resTabelas.json();

        // Se eventos não for array, logar erro e abortar
        if (!Array.isArray(eventos)) {
          setValorUnitario(0);
          return;
        }
        if (!Array.isArray(tabelas)) {
          setValorUnitario(0);
          return;
        }

        // Função para normalizar strings (igual à usada na FotosPage)
        function normalize(str) {
          return decodeURIComponent(str || '')
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
            .replace(/[^a-z0-9]/g, ' ') // troca tudo que não for letra/número por espaço
            .replace(/\s+/g, ' ') // normaliza múltiplos espaços
            .trim();
        }

        // Encontrar o evento das fotos no carrinho
        const eventoNome = cart[0]?.evento;
        eventos.forEach(e => console.log('->', e.nome, 'Normalizado:', normalize(e.nome)));

        // Busca tolerante: primeiro por igualdade, depois por includes
        let evento = eventos.find(e => normalize(e.nome) === normalize(eventoNome));
        if (!evento) {
          evento = eventos.find(e => normalize(e.nome).includes(normalize(eventoNome)) || normalize(eventoNome).includes(normalize(e.nome)));
        }

        let valor = 0;
        let tabela = null;
        let tabelaDefault = null;

        if (evento && evento.valorFixo) {
          // Valor fixo
          valor = Number(evento.valorFixo);
        } else if (evento && evento.tabelaPrecoId) {
          // Tabela específica do evento
          let tabelaId = evento && evento.tabelaPrecoId;
          if (typeof tabelaId === 'object' && tabelaId !== null) {
            tabelaId = tabelaId._id;
          }
          tabela = tabelas.find(t => t._id === tabelaId);
          if (tabela && tabela.faixas) {
            const faixas = [...tabela.faixas].sort((a, b) => a.min - b.min);
            for (const faixa of faixas) {
              const min = Number(faixa.min);
              const max = faixa.max !== undefined && faixa.max !== null && faixa.max !== '' ? Number(faixa.max) : null;
              if (max === null) {
                if (cart.length >= min) {
                  valor = Number(faixa.valor);
                  break;
                }
              } else {
                if (cart.length >= min && cart.length <= max) {
                  valor = Number(faixa.valor);
                  break;
                }
              }
            }
          }
        } else {
          // Usar tabela default
          tabelaDefault = tabelas.find(t => t.isDefault);
          if (tabelaDefault && tabelaDefault.faixas) {
            const faixas = [...tabelaDefault.faixas].sort((a, b) => a.min - b.min);
            for (const faixa of faixas) {
              const min = Number(faixa.min);
              const max = faixa.max !== undefined && faixa.max !== null && faixa.max !== '' ? Number(faixa.max) : null;
              if (max === null) {
                if (cart.length >= min) {
                  valor = Number(faixa.valor);
                  break;
                }
              } else {
                if (cart.length >= min && cart.length <= max) {
                  valor = Number(faixa.valor);
                  break;
                }
              }
            }
          }
        }

        setValorUnitario(valor);
      } catch (error) {
        console.error('Erro ao calcular valor unitário:', error);
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
        coreografia: f.coreografia || ''
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

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useLocation } from 'react-router-dom';
import './Header.css';
import CartBtn from './CartBtn';
import { useCart } from './CartContext';
import { useNavigation } from '../context/NavigationContext';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import EditUserModal from './EditUserModal';
import PedidosModal from './PedidosModal';


function UserDropdownMenu({ anchorRef, onLogout, onClose, onEditUser, onVerPedidos }) {
  const menuRef = useRef(null);
  const [style, setStyle] = useState({});

  useEffect(() => {
    function updatePosition() {
      if (anchorRef.current && menuRef.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        setStyle({
          position: 'fixed',
          top: rect.bottom - 2,
          left: rect.left,
          zIndex: 2001,
        });
      } else {
      }
    }
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) && anchorRef.current && !anchorRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorRef]);

  return ReactDOM.createPortal(
    <div ref={menuRef} className="user-dropdown-menu-custom" style={{width: 179, padding: 8, borderBottomRightRadius: 10, borderBottomLeftRadius: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', ...style}}>
      <div className="user-dropdown-list">
        <button className="user-dropdown-row" onClick={onEditUser}>
          <span className="user-dropdown-icon-custom">
            {/* Ícone usuário */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="2"/>
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#fff" strokeWidth="2"/>
            </svg>
          </span>
          <span className="user-dropdown-label">Meus dados</span>
        </button>
        <button className="user-dropdown-row" onClick={onVerPedidos}>
          <span className="user-dropdown-icon-custom">
            {/* Ícone pedidos/carrinho */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="21" r="1" stroke="#fff" strokeWidth="2"/>
              <circle cx="19" cy="21" r="1" stroke="#fff" strokeWidth="2"/>
              <path d="M1 1h2l3.6 7.59a2 2 0 0 0 1.7 1.18H19a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6" stroke="#fff" strokeWidth="2"/>
            </svg>
          </span>
          <span className="user-dropdown-label">Ver pedidos</span>
        </button>
      </div>
      <div className="user-dropdown-divider-custom" />
      <button className="user-dropdown-row user-dropdown-logout-row" onClick={onLogout}>
        <span className="user-dropdown-icon-custom">
          {/* Ícone sair/deslogar */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 17l5-5-5-5" stroke="#ff5a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12H9" stroke="#ff5a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19a7 7 0 1 1 0-14" stroke="#ff5a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className="user-dropdown-label user-dropdown-label-logout">Sair da conta</span>
      </button>
    </div>,
    document.body
  );
}

function Header({ onCartClick }) {
  const { cart } = useCart();
  const { executeBackButtonHandler, isViewingPhotos } = useNavigation();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [userNome, setUserNome] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showPedidosModal, setShowPedidosModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const userBtnRef = useRef(null);
  
  // Detectar scroll para mostrar/ocultar logo e botão
  useEffect(() => {
    const handleScroll = () => {
      // Detectar se rolou para baixo o suficiente para esconder o CoreografiaTop
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const isPageScrolled = scrollTop > 200; // Ajuste este valor conforme necessário
      setIsScrolled(isPageScrolled);
    };

    // Só adicionar listener se estivermos numa página que precisa do botão
    if (location.pathname !== '/eventos' && location.pathname !== '/') {
      window.addEventListener('scroll', handleScroll);
      // Chamar uma vez para definir o estado inicial
      handleScroll();
    } else {
      setIsScrolled(false);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  useEffect(() => {
    const nome = localStorage.getItem('user_nome') || '';
    setUserNome(nome);
  }, [showLogin]);

  function handleLogout() {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_nome');
    setUserNome('');
    setShowUserMenu(false);
  }

  // Exibir apenas o primeiro e o último nome
  const partesNome = userNome.trim().split(' ').filter(Boolean);
  let nomeSobrenome = '';
  if (partesNome.length === 1) {
    nomeSobrenome = partesNome[0];
  } else if (partesNome.length > 1) {
    nomeSobrenome = partesNome[0] + ' ' + partesNome[partesNome.length - 1];
  }

  function handleUserBtnClick() {
    setShowUserMenu(v => !v);
  }

  function handleOpenEditUser() {
    setShowUserMenu(false);
    setShowEditUserModal(true);
  }

  function handleOpenPedidos() {
    setShowUserMenu(false);
    setShowPedidosModal(true);
  }

  // Determinar quando o botão de voltar deve aparecer
  const shouldShowBackButton = location.pathname !== '/eventos' && 
                              location.pathname !== '/' && 
                              isScrolled && 
                              isViewingPhotos;

  return (
    <header className="header header-fixed-no-scroll">
      <div className="header-logo">
        <img 
          src="/logo.png" 
          alt="Logo" 
          height={40} 
          className={`header-logo-img ${shouldShowBackButton ? 'header-logo-hidden' : ''}`}
        />
        {shouldShowBackButton && (
          <button
            className="header-back-btn header-back-btn-expanded"
            onClick={executeBackButtonHandler}
            title="Coreografias"
          >
            <span className="header-back-icon-circle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="header-back-text">Coreografias</span>
          </button>
        )}
      </div>
      <div className="header-actions">
        {userNome ? (
          <>
            <button
              className="header-user-btn header-user-btn-simple"
              ref={userBtnRef}
              onClick={handleUserBtnClick}
              // style={{ color: '#fff', fontWeight: 600, marginRight: 16, background: 'none', boxShadow: 'none', padding: '8px 18px' }}
            >
              {nomeSobrenome}
            </button>
            {showUserMenu && (
              <UserDropdownMenu
                anchorRef={userBtnRef}
                onLogout={handleLogout}
                onClose={() => setShowUserMenu(false)}
                onEditUser={handleOpenEditUser}
                onVerPedidos={handleOpenPedidos}
              />
            )}
          </>
        ) : (
          <button className="header-btn" onClick={() => setShowLogin(true)}>Entrar</button>
        )}
        {/* <button className="header-btn destaque">Cadastrar-se</button> */}
        <CartBtn count={cart.length} onClick={onCartClick} />
      </div>
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onRegisterClick={() => { setShowLogin(false); setShowRegister(true); }}
          onLoginSuccess={nome => setUserNome(nome)}
        />
      )}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onLoginClick={() => { setShowRegister(false); setShowLogin(true); }}
        />
      )}
      {showEditUserModal && (
        <EditUserModal onClose={() => setShowEditUserModal(false)} />
      )}
      {showPedidosModal && (
        <PedidosModal onClose={() => setShowPedidosModal(false)} />
      )}
    </header>
  );
}

export default Header; 
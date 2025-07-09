import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useLocation } from 'react-router-dom';
import './Header.css';
import CartBtn from './CartBtn';
import { useCart } from './CartContext';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import EditUserModal from './EditUserModal';
import PedidosModal from './PedidosModal';
import LeftIcon from '../assets/icons/left_fill.svg';

function UserDropdownMenu({ anchorRef, onLogout, onClose, onEditUser, onVerPedidos }) {
  const menuRef = useRef(null);
  const [style, setStyle] = useState({});

  useEffect(() => {
    function updatePosition() {
      if (anchorRef.current && menuRef.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        console.log('[Dropdown] anchor rect:', rect);
        setStyle({
          position: 'fixed',
          top: rect.bottom - 2,
          left: rect.left,
          zIndex: 2001,
        });
      } else {
        console.log('[Dropdown] anchorRef or menuRef not ready', anchorRef.current, menuRef.current);
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

  console.log('[Dropdown] Renderizando dropdown', style);

  return ReactDOM.createPortal(
    <div ref={menuRef} className="user-dropdown-menu-custom" style={{width: 179, padding: 8, borderBottomRightRadius: 10, borderBottomLeftRadius: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', ...style}}>
      <div className="user-dropdown-list">
        <button className="user-dropdown-row" onClick={onEditUser}>
          <span className="user-dropdown-icon-custom user-dropdown-icon-user" />
          <span className="user-dropdown-label">Meus dados</span>
        </button>
        <button className="user-dropdown-row" onClick={onVerPedidos}>
          <span className="user-dropdown-icon-custom user-dropdown-icon-cart" />
          <span className="user-dropdown-label">Ver pedidos</span>
        </button>
      </div>
      <div className="user-dropdown-divider-custom" />
      <button className="user-dropdown-row user-dropdown-logout-row" onClick={onLogout}>
        <span className="user-dropdown-icon-custom user-dropdown-icon-logout" />
        <span className="user-dropdown-label user-dropdown-label-logout">Sair da conta</span>
      </button>
    </div>,
    document.body
  );
}

function Header({ onCartClick }) {
  const { cart } = useCart();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [userNome, setUserNome] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showPedidosModal, setShowPedidosModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const userBtnRef = useRef(null);
  
  // Remover: const shouldShowBackButton = hasBackHandler && location.pathname !== '/eventos' && location.pathname !== '/';
  
  // Detectar scroll para mostrar/ocultar logo e botão
  useEffect(() => {
    const handleScroll = () => {
      // Detectar se rolou para baixo o suficiente para esconder o CoreografiaTop
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const isPageScrolled = scrollTop > 200; // Ajuste este valor conforme necessário
      setIsScrolled(isPageScrolled);
    };

    // Só adicionar listener se estivermos numa página que precisa do botão
    // Remover: if (shouldShowBackButton) {
    if (true) { // Sempre mostrar o botão de voltar
      window.addEventListener('scroll', handleScroll);
      // Chamar uma vez para definir o estado inicial
      handleScroll();
    } else {
      setIsScrolled(false);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Remover: [shouldShowBackButton]

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
    console.log('[Header] Clique no botão do usuário, showUserMenu:', !showUserMenu);
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

  return (
    <header className="header header-fixed-no-scroll">
      <div className="header-logo">
        {/* Remover: shouldShowBackButton && isScrolled ? ( */}
          <img 
            src="/logo.png" 
            alt="Logo" 
            height={40} 
            className="header-logo-img"
          />
        {/* ) : ( */}
        {/* <button
            className={`header-back-btn header-back-btn-expanded header-back-btn-scrolled`}
            onClick={triggerBackButton}
            title="Voltar à página anterior"
            style={{ marginRight: 16 }}
          >
            <span className="header-back-icon-circle">
              <img src={LeftIcon} alt="Voltar" style={{ width: 20, height: 20, filter: 'invert(0)' }} />
            </span>
            <span className="header-back-text">Voltar à página anterior</span>
          </button> */}
        {/* ) */}
      </div>
      <div className="header-actions">
        {userNome ? (
          <>
            <button
              className="header-user-btn header-user-btn-simple"
              ref={userBtnRef}
              onClick={handleUserBtnClick}
              style={{ color: '#fff', fontWeight: 600, marginRight: 16, background: 'none', boxShadow: 'none', padding: '8px 18px' }}
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
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './Header.css';
import CartBtn from './CartBtn';
import { useCart } from './CartContext';
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
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [userNome, setUserNome] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showPedidosModal, setShowPedidosModal] = useState(false);
  const userBtnRef = useRef(null);

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

  // Nome e sobrenome
  const nomeSobrenome = userNome.trim().split(' ').slice(0, 2).join(' ');

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
        <img src="/logo.png" alt="Logo" height={40} />
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
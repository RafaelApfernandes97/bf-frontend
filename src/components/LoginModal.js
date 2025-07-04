import React, { useState } from 'react';
import './LoginModal.css';

const BACKEND_URL = 'https://backend.rfsolutionbr.com.br';

export default function LoginModal({ onClose, onRegisterClick, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('user_token', data.token);
        localStorage.setItem('user_nome', data.nome || '');
        if (onLoginSuccess) onLoginSuccess(data.nome || '');
        onClose();
      } else {
        setErro(data.error || 'E-mail ou senha inválidos.');
      }
    } catch {
      setErro('Erro ao conectar ao servidor.');
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>
        <h2>Entrar</h2>
        <form onSubmit={handleLogin} className="login-modal-form">
          <label>Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Digite seu email" required autoFocus />
          </label>
          <label>Senha
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Digite sua senha" required minLength={8} />
          </label>
          <div className="login-modal-links">
            <span style={{ color: '#888', fontSize: 14 }}>Ainda não possui uma conta?{' '}
              <button type="button" className="login-modal-link" onClick={onRegisterClick}>Clique aqui para criar.</button>
            </span>
          </div>
          {erro && <div className="login-modal-erro">{erro}</div>}
          <button className="login-modal-btn" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Continuar'}</button>
        </form>
      </div>
    </div>
  );
} 
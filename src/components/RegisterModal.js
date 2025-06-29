import React, { useState } from 'react';
import './LoginModal.css';

function maskCpfCnpj(value) {
  value = value.replace(/\D/g, '');
  if (value.length <= 11) {
    // CPF: 000.000.000-00
    return value
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ: 00.000.000/0000-00
    return value
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
}

function maskTelefone(value) {
  value = value.replace(/\D/g, '');
  if (value.length <= 10) {
    // (00) 0000-0000
    return value
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    // (00) 00000-0000
    return value
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
}

function maskCep(value) {
  return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0,9);
}

export default function RegisterModal({ onClose, onLoginClick }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [erros, setErros] = useState({});
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  function validarEmail(email) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }
  function validarSenha(s) {
    return typeof s === 'string' && s.length >= 8;
  }
  function validarCpfCnpj(valor) {
    return /^\d{11}$/.test(valor.replace(/\D/g, '')) || /^\d{14}$/.test(valor.replace(/\D/g, ''));
  }
  function validarTelefone(tel) {
    return /^\d{10,11}$/.test(tel.replace(/\D/g, ''));
  }

  function nextStep(e) {
    e.preventDefault();
    setErros({});
    if (step === 1) {
      if (!validarEmail(email)) return setErros({ email: 'E-mail inválido.' });
      setStep(2);
    } else if (step === 2) {
      if (!validarSenha(senha)) return setErros({ senha: 'A senha deve ter pelo menos 8 caracteres.' });
      if (senha !== senha2) return setErros({ senha2: 'As senhas não coincidem.' });
      setStep(3);
    } else if (step === 3) {
      if (!nome) return setErros({ nome: 'Digite seu nome completo.' });
      if (!validarCpfCnpj(cpfCnpj)) return setErros({ cpfCnpj: 'CPF ou CNPJ inválido.' });
      if (!validarTelefone(telefone)) return setErros({ telefone: 'Telefone/WhatsApp inválido.' });
      handleRegister();
    }
  }

  async function handleRegister() {
    setErros({});
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/usuarios/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha, nome, cpfCnpj: cpfCnpj.replace(/\D/g, ''), telefone: telefone.replace(/\D/g, ''), cep, rua, numero, bairro, cidade, estado })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        // Login automático após cadastro
        const resLogin = await fetch('http://localhost:3001/api/usuarios/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha })
        });
        const dataLogin = await resLogin.json();
        if (resLogin.ok && dataLogin.token) {
          localStorage.setItem('user_token', dataLogin.token);
          localStorage.setItem('user_nome', dataLogin.nome || '');
          if (onLoginClick) onLoginClick(); // fecha modal de login se aberto
          if (onClose) onClose(); // fecha modal de cadastro
        } else {
          setSucesso(true); // fallback: mostra mensagem de sucesso
          setTimeout(() => {
            if (onLoginClick) onLoginClick();
            if (onClose) onClose();
          }, 1200);
        }
      } else {
        setErros(data.errors || {});
      }
    } catch {
      setErros({ servidor: 'Erro ao conectar ao servidor.' });
    }
    setLoading(false);
  }

  async function buscarCep(cepValue) {
    const cepLimpo = cepValue.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setRua(data.logradouro || '');
          setBairro(data.bairro || '');
          setCidade(data.localidade || '');
          setEstado(data.uf || '');
        }
      } catch {}
    }
  }

  return (
    <div className="login-modal-overlay">
      <div className="login-modal-container register-modal">
        <button className="login-modal-close" onClick={onClose}>&times;</button>
        {sucesso ? (
          <h2 className="register-success">Cadastro realizado!<br/>Faça login para continuar.</h2>
        ) : (
          <>
            {step === 1 && (
              <>
                <h2>Criar uma nova conta</h2>
                <form onSubmit={nextStep} className="register-form">
                  <label>Email
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Digite seu email" required autoFocus />
                  </label>
                  <div className="login-modal-links">
                    <span className="register-link-text">Já tem uma conta?{' '}
                      <button type="button" className="login-modal-link" onClick={onLoginClick}>Clique aqui para entrar.</button>
                    </span>
                  </div>
                  {erros.email && <div className="login-modal-erro">{erros.email}</div>}
                  <button className="login-modal-btn" type="submit">Continuar</button>
                </form>
              </>
            )}
            {step === 2 && (
              <>
                <h2>Criar uma senha</h2>
                <form onSubmit={nextStep} className="register-form">
                  <label>Senha
                    <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Digite sua senha" required minLength={8} />
                    <span className="register-hint">Mínimo de 8 caracteres</span>
                  </label>
                  <label>Repetir senha
                    <input type="password" value={senha2} onChange={e => setSenha2(e.target.value)} placeholder="Digite sua senha novamente" required minLength={8} />
                  </label>
                  {erros.senha && <div className="login-modal-erro">{erros.senha}</div>}
                  {erros.senha2 && <div className="login-modal-erro">{erros.senha2}</div>}
                  <button className="login-modal-btn" type="submit">Continuar</button>
                </form>
              </>
            )}
            {step === 3 && (
              <>
                <h2>Dados de cadastro</h2>
                <form onSubmit={nextStep} className="register-form">
                  <label>Nome
                    <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Digite seu nome completo" required />
                  </label>
                  <label>CPF / CNPJ
                    <input type="text" value={maskCpfCnpj(cpfCnpj)} onChange={e => setCpfCnpj(e.target.value)} placeholder="Digite seu cpf ou cnpj" required maxLength={18} />
                  </label>
                  <label>WhatsApp
                    <input type="text" value={maskTelefone(telefone)} onChange={e => setTelefone(e.target.value)} placeholder="Digite seu número de WhatsApp" required maxLength={15} />
                  </label>
                  <label>CEP
                    <input type="text" value={cep} onChange={e => { setCep(maskCep(e.target.value)); buscarCep(e.target.value); }} placeholder="Digite o CEP" required maxLength={9} />
                    {erros.cep && <div className="register-error-field">{erros.cep}</div>}
                  </label>
                  <label>Rua
                    <input type="text" value={rua} onChange={e => setRua(e.target.value)} placeholder="Rua" required />
                    {erros.rua && <div className="register-error-field">{erros.rua}</div>}
                  </label>
                  <label>Número
                    <input type="text" value={numero} onChange={e => setNumero(e.target.value)} placeholder="Número" required />
                    {erros.numero && <div className="register-error-field">{erros.numero}</div>}
                  </label>
                  <label>Bairro
                    <input type="text" value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro" required />
                    {erros.bairro && <div className="register-error-field">{erros.bairro}</div>}
                  </label>
                  <label>Cidade
                    <input type="text" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade" required />
                    {erros.cidade && <div className="register-error-field">{erros.cidade}</div>}
                  </label>
                  <label>Estado
                    <input type="text" value={estado} onChange={e => setEstado(e.target.value)} placeholder="Estado" required maxLength={2} />
                    {erros.estado && <div className="register-error-field">{erros.estado}</div>}
                  </label>
                  {erros.cpfCnpj && <div className="login-modal-erro">{erros.cpfCnpj}</div>}
                  {erros.telefone && <div className="login-modal-erro">{erros.telefone}</div>}
                  <button className="login-modal-btn" type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Finalizar cadastro'}</button>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
} 
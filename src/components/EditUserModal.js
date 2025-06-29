import React, { useState, useEffect } from 'react';
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

function validarCpfCnpj(valor) {
  const v = valor.replace(/\D/g, '');
  return /^\d{11}$/.test(v) || /^\d{14}$/.test(v);
}
function validarTelefone(tel) {
  return /^\d{10,11}$/.test(tel.replace(/\D/g, ''));
}

function maskCep(value) {
  return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0,9);
}

export default function EditUserModal({ onClose }) {
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erros, setErros] = useState({});
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

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

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setErro('');
      try {
        const token = localStorage.getItem('user_token');
        const res = await fetch('http://localhost:3001/api/usuarios/me', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('Erro ao buscar dados do usuário');
        const data = await res.json();
        setNome(data.nome || '');
        setCpfCnpj(maskCpfCnpj(data.cpfCnpj || ''));
        setTelefone(maskTelefone(data.telefone || ''));
        setCep(maskCep(data.cep || ''));
        setRua(data.rua || '');
        setNumero(data.numero || '');
        setBairro(data.bairro || '');
        setCidade(data.cidade || '');
        setEstado(data.estado || '');
      } catch (e) {
        setErro('Erro ao buscar dados do usuário');
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  function validateAll() {
    const newErros = {};
    if (!nome.trim()) newErros.nome = 'Nome obrigatório.';
    if (!validarCpfCnpj(cpfCnpj)) newErros.cpfCnpj = 'CPF ou CNPJ inválido.';
    if (!validarTelefone(telefone)) newErros.telefone = 'Telefone/WhatsApp inválido.';
    if (!cep.trim()) newErros.cep = 'CEP inválido.';
    if (!rua.trim()) newErros.rua = 'Rua inválida.';
    if (!numero.trim()) newErros.numero = 'Número inválido.';
    if (!bairro.trim()) newErros.bairro = 'Bairro inválido.';
    if (!cidade.trim()) newErros.cidade = 'Cidade inválida.';
    if (!estado.trim()) newErros.estado = 'Estado inválido.';
    setErros(newErros);
    return Object.keys(newErros).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    if (!validateAll()) return;
    setSalvando(true);
    setSucesso(false);
    try {
      const token = localStorage.getItem('user_token');
      const res = await fetch('http://localhost:3001/api/usuarios/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ nome, cpfCnpj: cpfCnpj.replace(/\D/g, ''), telefone: telefone.replace(/\D/g, ''), cep: cep.replace(/\D/g, ''), rua, numero, bairro, cidade, estado })
      });
      if (!res.ok) throw new Error('Erro ao salvar alterações');
      localStorage.setItem('user_nome', nome);
      setSucesso(true);
      setTimeout(() => {
        setSucesso(false);
        onClose();
      }, 1200);
    } catch (e) {
      setErro('Erro ao salvar alterações');
    }
    setSalvando(false);
  }

  function handleNome(e) {
    setNome(e.target.value);
    setErros(erros => ({ ...erros, nome: undefined }));
  }
  function handleCpfCnpj(e) {
    setCpfCnpj(maskCpfCnpj(e.target.value));
    setErros(erros => ({ ...erros, cpfCnpj: undefined }));
  }
  function handleTelefone(e) {
    setTelefone(maskTelefone(e.target.value));
    setErros(erros => ({ ...erros, telefone: undefined }));
  }
  function handleCep(e) {
    setCep(maskCep(e.target.value));
    buscarCep(e.target.value);
    setErros(erros => ({ ...erros, cep: undefined }));
  }
  function handleRua(e) {
    setRua(e.target.value);
    setErros(erros => ({ ...erros, rua: undefined }));
  }
  function handleNumero(e) {
    setNumero(e.target.value);
    setErros(erros => ({ ...erros, numero: undefined }));
  }
  function handleBairro(e) {
    setBairro(e.target.value);
    setErros(erros => ({ ...erros, bairro: undefined }));
  }
  function handleCidade(e) {
    setCidade(e.target.value);
    setErros(erros => ({ ...erros, cidade: undefined }));
  }
  function handleEstado(e) {
    setEstado(e.target.value);
    setErros(erros => ({ ...erros, estado: undefined }));
  }

  return (
    <div className="login-modal-overlay">
      <div className="login-modal-container edit-user-modal">
        <button className="login-modal-close" onClick={onClose}>&times;</button>
        <h2>Meus Dados</h2>
        {loading ? (
          <div className="edit-user-loading">Carregando...</div>
        ) : erro && !sucesso ? (
          <div className="edit-user-error">{erro}</div>
        ) : (
          <form onSubmit={handleSubmit} className="edit-user-form">
            <label className="edit-user-label">Nome
              <input 
                type="text" 
                value={nome} 
                onChange={handleNome} 
                className="edit-user-input"
                required 
                disabled={salvando} 
              />
              {erros.nome && <div className="edit-user-error-field">{erros.nome}</div>}
            </label>
            <label className="edit-user-label">CPF / CNPJ
              <input 
                type="text" 
                value={cpfCnpj} 
                onChange={handleCpfCnpj} 
                className="edit-user-input"
                required 
                disabled={salvando} 
                maxLength={18} 
              />
              {erros.cpfCnpj && <div className="edit-user-error-field">{erros.cpfCnpj}</div>}
            </label>
            <label className="edit-user-label">WhatsApp
              <input 
                type="text" 
                value={telefone} 
                onChange={handleTelefone} 
                className="edit-user-input"
                required 
                disabled={salvando} 
                maxLength={15} 
              />
              {erros.telefone && <div className="edit-user-error-field">{erros.telefone}</div>}
            </label>
            <label className="edit-user-label">CEP
              <input 
                type="text" 
                value={cep} 
                onChange={handleCep} 
                placeholder="Digite o CEP" 
                className="edit-user-input"
                required 
                maxLength={9} 
                disabled={salvando} 
              />
              {erros.cep && <div className="edit-user-error-field">{erros.cep}</div>}
            </label>
            <label className="edit-user-label">Rua
              <input 
                type="text" 
                value={rua} 
                onChange={handleRua} 
                placeholder="Rua" 
                className="edit-user-input"
                required 
                disabled={salvando} 
              />
              {erros.rua && <div className="edit-user-error-field">{erros.rua}</div>}
            </label>
            <label className="edit-user-label">Número
              <input 
                type="text" 
                value={numero} 
                onChange={handleNumero} 
                placeholder="Número" 
                className="edit-user-input"
                required 
                disabled={salvando} 
              />
              {erros.numero && <div className="edit-user-error-field">{erros.numero}</div>}
            </label>
            <label className="edit-user-label">Bairro
              <input 
                type="text" 
                value={bairro} 
                onChange={handleBairro} 
                placeholder="Bairro" 
                className="edit-user-input"
                required 
                disabled={salvando} 
              />
              {erros.bairro && <div className="edit-user-error-field">{erros.bairro}</div>}
            </label>
            <label className="edit-user-label">Cidade
              <input 
                type="text" 
                value={cidade} 
                onChange={handleCidade} 
                placeholder="Cidade" 
                className="edit-user-input"
                required 
                disabled={salvando} 
              />
              {erros.cidade && <div className="edit-user-error-field">{erros.cidade}</div>}
            </label>
            <label className="edit-user-label">Estado
              <input 
                type="text" 
                value={estado} 
                onChange={handleEstado} 
                placeholder="Estado" 
                className="edit-user-input"
                required 
                maxLength={2} 
                disabled={salvando} 
              />
              {erros.estado && <div className="edit-user-error-field">{erros.estado}</div>}
            </label>
            <div className="edit-user-buttons">
              <button 
                type="button" 
                onClick={onClose} 
                className="edit-user-btn edit-user-btn-cancel"
                disabled={salvando}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="edit-user-btn edit-user-btn-save"
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
            {sucesso && <div className="edit-user-success">Alterações salvas!</div>}
            {erro && !sucesso && <div className="edit-user-error">{erro}</div>}
          </form>
        )}
      </div>
    </div>
  );
} 
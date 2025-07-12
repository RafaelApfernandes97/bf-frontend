import React, { useState, useRef, useContext } from 'react';
import './CoreografiaTop.css';
import { NavigationContext } from '../context/NavigationContext';
import api from '../config/api';

export default function CoreografiaTop({ nome, coreografia, eventoAtual, children }) {
  const { 
    fotosEncontradasIA, 
    setFotosEncontradasIA, 
    filtroIAAtivo, 
    setFiltroIAAtivo,
    fotoReferenciaIA,
    setFotoReferenciaIA 
  } = useContext(NavigationContext);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Verificar se o usuário está logado
    const token = localStorage.getItem('user_token') || localStorage.getItem('admin_token');
    console.log('[CoreografiaTop] Token presente:', !!token);
    if (!token) {
      alert('Você precisa estar logado para usar o reconhecimento facial. Faça login primeiro.');
      return;
    }

    setUploading(true);
    
    try {
      // Criar URL da foto de referência para mostrar como miniatura
      const fotoReferenciaUrl = URL.createObjectURL(file);
      setFotoReferenciaIA(fotoReferenciaUrl);

      const formData = new FormData();
      formData.append('selfie', file);

      const url = `/fotos/buscar-por-selfie?evento=${encodeURIComponent(eventoAtual)}`;
      console.log('[CoreografiaTop] URL da requisição:', url);
      console.log('[CoreografiaTop] Evento atual:', eventoAtual);
      console.log('[CoreografiaTop] Arquivo:', file.name, file.size, 'bytes');

      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const fotosEncontradas = response.data.fotos || [];
      const mensagem = response.data.message;
      
      setFotosEncontradasIA(fotosEncontradas);
      setFiltroIAAtivo(true);
      
      console.log(`[CoreografiaTop] ${fotosEncontradas.length} fotos encontradas por IA`);
      
      // Se não encontrou fotos, mostrar mensagem específica
      if (fotosEncontradas.length === 0 && mensagem) {
        alert(mensagem);
      } else if (fotosEncontradas.length === 0) {
        alert('Nenhuma foto foi encontrada com a face da selfie enviada.');
      }
    } catch (error) {
      console.error('[CoreografiaTop] Erro ao buscar fotos por selfie:', error);
      
      // Se o backend retornar erro com mensagem específica
      if (error.response && error.response.data && error.response.data.message) {
        setFotosEncontradasIA([]);
        setFiltroIAAtivo(true);
        alert(error.response.data.message);
      }
      // Se o backend retornar 404, significa que a coleção não existe
      else if (error.response && error.response.status === 404) {
        setFotosEncontradasIA([]);
        setFiltroIAAtivo(true);
        alert('Nenhuma foto foi encontrada para este evento.');
      } 
      // Outros erros reais do servidor
      else {
        const mensagemErro = error.response?.data?.error || 'Erro ao buscar fotos. Tente novamente.';
        alert(mensagemErro);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoverFiltro = () => {
    setFotosEncontradasIA([]);
    setFiltroIAAtivo(false);
    // Limpar a foto de referência quando remover o filtro
    if (fotoReferenciaIA) {
      URL.revokeObjectURL(fotoReferenciaIA);
      setFotoReferenciaIA(null);
    }
  };

  const handleProcurarFotos = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="coreografia-top">
      <div className="coreografia-top-bg">
        <span className="coreografia-top-title">{nome}</span>
        {coreografia && Array.isArray(children) && children[0] && (
          <div className="coreografia-top-coreografia-inline">{children[0]}</div>
        )}
      </div>
      {!coreografia && children && <div className="coreografia-top-children">{children}</div>}
      
      <div className="coreografia-top-content">
        {!filtroIAAtivo ? (
          // Estado inicial - mostrar botão de busca
          <>
            
            <div className="coreografia-top-desc">
              <strong>Encontre suas fotos por reconhecimento facial</strong>
              <span>Envie uma foto sua de rosto ou tire uma selfie</span>
            </div>
            <button 
              className="coreografia-top-btn" 
              onClick={handleProcurarFotos}
              disabled={uploading}
            >
              {uploading ? 'Procurando...' : 'Procurar minhas fotos'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </>
        ) : (
          // Estado com resultado - mostrar quantidade e botão remover filtro
          <div className="coreografia-top-result">
            <div className="coreografia-top-result-info">
              <div className="coreografia-top-result-avatar">
                {fotoReferenciaIA ? (
                  <img 
                    src={fotoReferenciaIA} 
                    alt="Foto de referência"
                    className="coreografia-top-result-avatar-img"
                  />
                ) : (
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="20" fill="#F4D03F"/>
                    <path d="M18 24c0 3.314 2.686 6 6 6s6-2.686 6-6" stroke="#181818" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="20" cy="21" r="1.5" fill="#181818"/>
                    <circle cx="28" cy="21" r="1.5" fill="#181818"/>
                  </svg>
                )}
              </div>
              <div className="coreografia-top-result-text">
                <strong>{fotosEncontradasIA.length} fotos encontradas</strong>
              </div>
            </div>
            <button 
              className="coreografia-top-result-btn" 
              onClick={handleRemoverFiltro}
            >
              Remover filtro
            </button>
          </div>
        )}
      </div>
      
      {/* Novo slot para children extras na parte de baixo do topo */}
      {coreografia && Array.isArray(children) && children[1] && (
        <div className="coreografia-top-bottom">{children[1]}</div>
      )}
      {coreografia && !Array.isArray(children) && null}
    </div>
  );
} 
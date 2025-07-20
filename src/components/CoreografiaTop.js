import React, { useContext } from 'react';
import './CoreografiaTop.css';
import { NavigationContext } from '../context/NavigationContext';

export default function CoreografiaTop({ nome, coreografia, children }) {
  const { 
    fotosEncontradasIA, 
    setFotosEncontradasIA, 
    filtroIAAtivo, 
    setFiltroIAAtivo,
    fotoReferenciaIA,
    setFotoReferenciaIA 
  } = useContext(NavigationContext);

  const handleRemoverFiltro = () => {
    setFotosEncontradasIA([]);
    setFiltroIAAtivo(false);
    // Limpar a foto de referência quando remover o filtro
    if (fotoReferenciaIA) {
      URL.revokeObjectURL(fotoReferenciaIA);
      setFotoReferenciaIA(null);
    }
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
        {filtroIAAtivo && (
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
      
      {/* Slot para children extras na parte de baixo do topo */}
      {coreografia && Array.isArray(children) && children[1] && (
        <div className="coreografia-top-bottom">{children[1]}</div>
      )}
    </div>
  );
} 
import React from 'react';
import './CoreografiaTop.css';

export default function CoreografiaTop({ nome, coreografia, children }) {
  return (
    <div className="coreografia-top">
      <div className="coreografia-top-bg">
        <span className="coreografia-top-title">{nome}</span>
      </div>
      {coreografia && Array.isArray(children) && children[0] && (
        <div className="coreografia-top-coreografia">{children[0]}</div>
      )}
      {!coreografia && children && <div className="coreografia-top-children">{children}</div>}
      <div className="coreografia-top-content">
        {/* <div className="coreografia-top-icon"> */}
          {/* Ícone de reconhecimento facial (SVG inline) */}
          {/* <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="8" width="48" height="48" rx="16" fill="#181818"/>
            <path d="M24 32c0 4.418 3.582 8 8 8s8-3.582 8-8" stroke="#181818" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="26" cy="28" r="2" fill="#181818"/>
            <circle cx="38" cy="28" r="2" fill="#181818"/>
          </svg>
        </div> */}
        <div className="coreografia-top-desc">
          <strong>Encontre suas fotos por reconhecimento facial</strong>
          <span>Envie uma foto sua de rosto ou tire uma selfie</span>
        </div>
        <button className="coreografia-top-btn" style={{visibility: 'hidden'}}>Procurar minhas fotos</button>
      </div>
      {/* Novo slot para children extras na parte de baixo do topo */}
      {coreografia && Array.isArray(children) && children[1] && (
        <div className="coreografia-top-bottom">{children[1]}</div>
      )}
      {coreografia && !Array.isArray(children) && null}
    </div>
  );
} 
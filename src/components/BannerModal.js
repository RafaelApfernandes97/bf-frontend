import React from 'react';
import './BannerModal.css';

const BannerModal = ({ 
  isOpen, 
  onClose, 
  tipo, // 'vale' ou 'video'
  onAddToCart, 
  preco = 0 
}) => {
  if (!isOpen) return null;

  const bannerInfo = {
    vale: {
      imagem: require('../assets/img/bannervale.png'),
      titulo: 'Vale Coreografia',
      texto: 'O Vale Coreografia é um pacote promocional com todas as fotos da sua coreografia. Para conferir o valor do Vale é só clicar abaixo e adicionar ao carrinho.',
      icone: '✨'
    },
    video: {
      imagem: require('../assets/img/bannervideo.png'),
      titulo: 'Vídeo',
      texto: 'Tenha o vídeo completo da sua coreografia. Relive todos os momentos especiais dessa apresentação única.',
      icone: '🎥'
    }
  };

  const info = bannerInfo[tipo] || bannerInfo.vale;

  const handleAddToCart = () => {
    const produto = {
      id: `banner_${tipo}_${Date.now()}`,
      nome: info.titulo,
      tipo: 'banner',
      categoria: tipo,
      preco: preco,
      url: info.imagem,
      coreografia: info.titulo
    };
    
    onAddToCart(produto);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="banner-modal-overlay" onClick={onClose}>
      <div className="banner-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="banner-modal-close" onClick={onClose}>
          ×
        </button>
        
        <div className="banner-modal-header">
          <div className="banner-modal-icon">{info.icone}</div>
          <h2 className="banner-modal-titulo">{info.titulo}</h2>
        </div>
        
        <div className="banner-modal-imagem">
          <img src={info.imagem} alt={info.titulo} />
        </div>
        
        <div className="banner-modal-texto">
          <p>{info.texto}</p>
        </div>
        
        <div className="banner-modal-preco">
          <span className="banner-modal-valor">{formatCurrency(preco)}</span>
        </div>
        
        <div className="banner-modal-actions">
          <button 
            className="banner-modal-btn-cart" 
            onClick={handleAddToCart}
            disabled={!preco || preco <= 0}
          >
            Adicionar ao carrinho
          </button>
        </div>
      </div>
    </div>
  );
};

export default BannerModal; 
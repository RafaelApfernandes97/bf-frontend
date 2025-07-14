import React, { useState } from 'react';
import './ProductBanners.css';
import BannerModal from './BannerModal';

// Importar as imagens dos banners
import bannerVale from '../assets/img/bannervale.png';
import bannerVideo from '../assets/img/bannervideo.png';
import bannerVale50 from '../assets/img/bannervale50.png';
import bannerVideo50 from '../assets/img/bannervideo50.png';

const ProductBanners = ({ 
  quantidadeFotos = 0, 
  exibirBannerValeCoreografia = false, 
  exibirBannerVideo = false,
  precoValeCoreografia = 0,
  precoVideo = 0,
  onAddToCart
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoModal, setTipoModal] = useState('vale');

  // Se nenhum banner está habilitado, não renderizar nada
  if (!exibirBannerValeCoreografia && !exibirBannerVideo) {
    return null;
  }

  // Determinar se ambos banners estão habilitados
  const ambosHabilitados = exibirBannerValeCoreografia && exibirBannerVideo;

  // Determinar as imagens a usar baseado na configuração
  const imagemVale = ambosHabilitados ? bannerVale50 : bannerVale;
  const imagemVideo = ambosHabilitados ? bannerVideo50 : bannerVideo;

  // Determinar as classes CSS
  const containerClass = ambosHabilitados ? 'ambos-banners' : 'banner-unico';

  const handleBannerClick = (tipo) => {
    setTipoModal(tipo);
    setModalAberto(true);
  };

  const handleCloseModal = () => {
    setModalAberto(false);
  };

  const handleAddToCartModal = (produto) => {
    if (onAddToCart) {
      onAddToCart(produto);
    }
    setModalAberto(false);
  };

  const getPreco = (tipo) => {
    return tipo === 'vale' ? precoValeCoreografia : precoVideo;
  };

  return (
    <>
      <div className={`product-banners-container ${containerClass}`}>
        {exibirBannerValeCoreografia && (
          <div 
            className="product-banner product-banner-vale"
            onClick={() => handleBannerClick('vale')}
          >
            <img 
              src={imagemVale} 
              alt="Banner Vale Coreografia" 
              className="banner-image"
            />
          </div>
        )}
        
        {exibirBannerVideo && (
          <div 
            className="product-banner product-banner-video"
            onClick={() => handleBannerClick('video')}
          >
            <img 
              src={imagemVideo} 
              alt="Banner Vídeo" 
              className="banner-image"
            />
          </div>
        )}
      </div>

      <BannerModal
        isOpen={modalAberto}
        onClose={handleCloseModal}
        tipo={tipoModal}
        preco={getPreco(tipoModal)}
        onAddToCart={handleAddToCartModal}
      />
    </>
  );
};

export default ProductBanners; 
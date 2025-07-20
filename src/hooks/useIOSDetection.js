import { useState, useEffect } from 'react';

export const useIOSDetection = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [safeAreaTop, setSafeAreaTop] = useState(0);

  useEffect(() => {
    const detectIOS = () => {
      // Detectar iOS
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
      
      setIsIOS(isIOSDevice);

      // Detectar safe area para iOS
      if (isIOSDevice) {
        // Tentar obter safe area do CSS
        const safeAreaTopValue = getComputedStyle(document.documentElement)
          .getPropertyValue('--sat') || '0px';
        
        // Converter para número
        const topValue = parseInt(safeAreaTopValue) || 0;
        setSafeAreaTop(topValue);
        
        // Adicionar classe CSS para iOS
        document.body.classList.add('ios-device');
        
        // Definir variável CSS para safe area
        document.documentElement.style.setProperty('--ios-safe-area-top', `${topValue}px`);
      }
    };

    detectIOS();

    // Re-detectar em mudanças de orientação
    const handleOrientationChange = () => {
      setTimeout(detectIOS, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', detectIOS);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', detectIOS);
      document.body.classList.remove('ios-device');
    };
  }, []);

  return { isIOS, safeAreaTop };
}; 
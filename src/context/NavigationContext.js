import React, { createContext, useContext, useState, useCallback } from 'react';

export const NavigationContext = createContext();

export function NavigationProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('eventos');
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [selectedCoreografia, setSelectedCoreografia] = useState(null);
  const [selectedDia, setSelectedDia] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para fotos encontradas por reconhecimento facial
  const [fotosEncontradasIA, setFotosEncontradasIA] = useState([]);
  const [filtroIAAtivo, setFiltroIAAtivo] = useState(false);
  const [fotoReferenciaIA, setFotoReferenciaIA] = useState(null); // Armazena a selfie utilizada na busca

  const [backButtonHandler, setBackButtonHandler] = useState(null);
  const [isViewingPhotos, setIsViewingPhotos] = useState(false);

  const registerBackButtonHandler = useCallback((handler) => {
    setBackButtonHandler(() => handler);
  }, []);

  const clearBackButtonHandler = useCallback(() => {
    setBackButtonHandler(null);
  }, []);

  const executeBackButtonHandler = useCallback(() => {
    if (backButtonHandler) {
      backButtonHandler();
    } else {
      window.history.back();
    }
  }, [backButtonHandler]);

  const setViewingPhotos = useCallback((viewing) => {
    setIsViewingPhotos(viewing);
  }, []);

  const value = {
    currentPage,
    setCurrentPage,
    selectedEvento,
    setSelectedEvento,
    selectedCoreografia,
    setSelectedCoreografia,
    selectedDia,
    setSelectedDia,
    searchTerm,
    setSearchTerm,
    fotosEncontradasIA,
    setFotosEncontradasIA,
    filtroIAAtivo,
    setFiltroIAAtivo,
    fotoReferenciaIA,
    setFotoReferenciaIA,
    backButtonHandler,
    registerBackButtonHandler,
    clearBackButtonHandler,
    executeBackButtonHandler,
    isViewingPhotos,
    setViewingPhotos
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation deve ser usado dentro de um NavigationProvider');
  }
  return context;
} 
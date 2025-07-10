import React, { createContext, useContext, useState, useCallback } from 'react';

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
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

  return (
    <NavigationContext.Provider value={{
      backButtonHandler,
      registerBackButtonHandler,
      clearBackButtonHandler,
      executeBackButtonHandler,
      isViewingPhotos,
      setViewingPhotos
    }}>
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
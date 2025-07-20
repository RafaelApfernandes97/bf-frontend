import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import { CartProvider } from './components/CartContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Configuração otimizada do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache padrão por 5 minutos
      staleTime: 5 * 60 * 1000,
      // Manter dados no cache por 30 minutos
      gcTime: 30 * 60 * 1000,
      // Retry automático
      retry: (failureCount, error) => {
        // Não retry em erros 4xx (exceto 408)
        if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 408) {
          return false;
        }
        // Máximo 3 tentativas para outros erros
        return failureCount < 3;
      },
      // Revalidar quando a janela for focada
      refetchOnWindowFocus: true,
      // Revalidar quando reconectar
      refetchOnReconnect: true,
      // Background refetch
      refetchInterval: false,
      // Configurações específicas para imagens
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </CartProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

// Service Worker habilitado para cache otimizado de imagens
// Registra o service worker para funcionamento offline
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('✅ Service Worker registrado com sucesso');
    
    // Inicia warmup do cache
    if (registration.active) {
      registration.active.postMessage({ type: 'WARMUP_CACHE' });
    }
  },
  onUpdate: (registration) => {
    console.log('🔄 Nova versão do Service Worker disponível');
    
    // Auto-atualiza o service worker
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

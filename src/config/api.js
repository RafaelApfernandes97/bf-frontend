import axios from 'axios';

// Detectar se estamos em modo de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';

// Configuração da API - flexível para desenvolvimento e produção
// Em desenvolvimento: verifica se há backend local rodando, senão usa produção
// Em produção: sempre usa o backend de produção
let BACKEND_URL;

if (isDevelopment) {
  // Em desenvolvimento, primeiro tenta detectar se há um backend local
  // Se REACT_APP_USE_LOCAL_BACKEND=true, força uso do backend local
  // Se REACT_APP_BACKEND_URL está definida, usa ela
  // Senão, usa o backend de produção como fallback
  
  const useLocalBackend = process.env.REACT_APP_USE_LOCAL_BACKEND === 'true';
  const customBackendUrl = process.env.REACT_APP_BACKEND_URL;
  
  if (useLocalBackend) {
    BACKEND_URL = 'http://localhost:3001';
    console.log('🔧 [API CONFIG] Modo desenvolvimento - usando backend LOCAL:', BACKEND_URL);
  } else if (customBackendUrl) {
    BACKEND_URL = customBackendUrl;
    console.log('🔧 [API CONFIG] Modo desenvolvimento - usando backend CUSTOMIZADO:', BACKEND_URL);
  } else {
    BACKEND_URL = 'https://backend.rfsolutionbr.com.br';
    console.log('🔧 [API CONFIG] Modo desenvolvimento - usando backend de PRODUÇÃO:', BACKEND_URL);
    console.log('💡 [API CONFIG] Para usar backend local, defina REACT_APP_USE_LOCAL_BACKEND=true no arquivo .env');
  }
} else {
  // Em produção, sempre usa o backend de produção
  BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://backend.rfsolutionbr.com.br';
  console.log('🚀 [API CONFIG] Modo produção - usando backend:', BACKEND_URL);
}

// Criar instância do axios
const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Adicionar withCredentials para CORS
  withCredentials: true,
});

// Interceptador para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('user_token') || localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log para requisições de busca por selfie
    if (config.url && config.url.includes('buscar-por-selfie')) {
      console.log('[API] Interceptor - URL:', config.url);
      console.log('[API] Interceptor - Token presente:', !!token);
      console.log('[API] Interceptor - Headers:', config.headers);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador para tratar erros de CORS e conexão
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (isDevelopment) {
      if (error.code === 'ERR_NETWORK') {
        console.error('❌ [API] Erro de rede - Backend pode estar offline ou bloqueado por CORS');
        console.error('💡 [API] Verifique se o backend está rodando e configurado corretamente');
        console.error('🔧 [API] Backend atual:', BACKEND_URL);
      }
    }
    return Promise.reject(error);
  }
);

export const API_ENDPOINTS = {
  // Usuários
  LOGIN: `${BACKEND_URL}/api/usuarios/login`,
  GOOGLE_LOGIN: `${BACKEND_URL}/api/usuarios/google-login`,
  REGISTER: `${BACKEND_URL}/api/usuarios/register`,
  ME: `${BACKEND_URL}/api/usuarios/me`,
  UPDATE_ME: `${BACKEND_URL}/api/usuarios/me`,
  USUARIOS_FOTO_URL: `${BACKEND_URL}/api/usuarios/foto-url`,
  SEND_ORDER: `${BACKEND_URL}/api/usuarios/enviar-pedido-whatsapp`,
  MY_ORDERS: `${BACKEND_URL}/api/usuarios/meus-pedidos`,
  ORDER_DETAILS: (pedidoId) => `${BACKEND_URL}/api/usuarios/pedido/${pedidoId}`,
  
  // Admin
  ADMIN_BASE: `${BACKEND_URL}/api/admin`,
  ADMIN_EVENTOS: `${BACKEND_URL}/api/admin/eventos`,
  ADMIN_TABELAS_PRECO: `${BACKEND_URL}/api/admin/tabelas-preco`,
  ADMIN_PEDIDOS: `${BACKEND_URL}/api/admin/pedidos`,
  ADMIN_ESTATISTICAS: `${BACKEND_URL}/api/admin/estatisticas`,
  
  // Rotas Públicas
  PUBLIC_EVENTOS: `${BACKEND_URL}/api/public/eventos`,
  PUBLIC_EVENTO_BY_NAME: (nome) => `${BACKEND_URL}/api/public/evento/${encodeURIComponent(nome)}`,
  PUBLIC_TABELAS_PRECO: `${BACKEND_URL}/api/public/tabelas-preco`,

  // Fotos
  PHOTOS: `${BACKEND_URL}/api/photos`,
  PHOTOS_PASTA: `${BACKEND_URL}/api/eventos/pasta`,
  PHOTOS_BY_EVENT: (eventoId) => `${BACKEND_URL}/api/photos/evento/${eventoId}`,
  PHOTOS_BY_COREOGRAFIA: (eventoId, coreografiaId) => `${BACKEND_URL}/api/photos/evento/${eventoId}/coreografia/${coreografiaId}`,
  BUSCAR_POR_SELFIE: `${BACKEND_URL}/api/fotos/buscar-por-selfie`,
  
  // Eventos
  EVENTOS: `${BACKEND_URL}/api/photos/eventos`,
  COREOGRAFIAS_POR_EVENTO: (eventoId) => `${BACKEND_URL}/api/eventos/${eventoId}/coreografias`,
  AQUECER_CACHE: (eventoId) => `${BACKEND_URL}/api/eventos/${eventoId}/aquecer-cache`,
  COREOGRAFIAS: (eventoId) => `${BACKEND_URL}/api/photos/eventos/${eventoId}/coreografias`,
};

export const BASE_URL = BACKEND_URL;
export { BACKEND_URL };
export default api; 
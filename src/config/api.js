import axios from 'axios';

// Configuração da API - detecta automaticamente se é desenvolvimento ou produção
const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
const BACKEND_URL = isDevelopment ? '' : 'https://backend.oballetemfoco.com';

// Criar instância do axios
const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
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
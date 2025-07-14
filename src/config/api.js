import axios from 'axios';

// Função para obter a URL base dinâmica
function getBaseURL() {
  // Se está em localhost, usa backend local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // Se tem variável de ambiente, usa ela
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // Senão, usa o backend de produção
  return 'https://backend.rfsolutionbr.com.br';
}

// Criar instância do axios usando função dinâmica
const api = axios.create({
  get baseURL() { return `${getBaseURL()}/api`; },
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptador para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    // Garantir que baseURL seja atual
    config.baseURL = `${getBaseURL()}/api`;
    
    const token = localStorage.getItem('user_token') || localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador para tratar erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API_ENDPOINTS usando função dinâmica
export const API_ENDPOINTS = {
  // Usuários
  get LOGIN() { return `${getBaseURL()}/api/usuarios/login`; },
  get GOOGLE_LOGIN() { return `${getBaseURL()}/api/usuarios/google-login`; },
  get REGISTER() { return `${getBaseURL()}/api/usuarios/register`; },
  get ME() { return `${getBaseURL()}/api/usuarios/me`; },
  get UPDATE_ME() { return `${getBaseURL()}/api/usuarios/me`; },
  get USUARIOS_FOTO_URL() { return `${getBaseURL()}/api/usuarios/foto-url`; },
  get SEND_ORDER() { return `${getBaseURL()}/api/usuarios/enviar-pedido-whatsapp`; },
  get MY_ORDERS() { return `${getBaseURL()}/api/usuarios/meus-pedidos`; },
  ORDER_DETAILS: (pedidoId) => `${getBaseURL()}/api/usuarios/pedido/${pedidoId}`,
  
  // Admin
  get ADMIN_BASE() { return `${getBaseURL()}/api/admin`; },
  get ADMIN_EVENTOS() { return `${getBaseURL()}/api/admin/eventos`; },
  get ADMIN_TABELAS_PRECO() { return `${getBaseURL()}/api/admin/tabelas-preco`; },
  get ADMIN_PEDIDOS() { return `${getBaseURL()}/api/admin/pedidos`; },
  get ADMIN_ESTATISTICAS() { return `${getBaseURL()}/api/admin/estatisticas`; },
  
  // Rotas Públicas
  get PUBLIC_EVENTOS() { return `${getBaseURL()}/api/public/eventos`; },
  PUBLIC_EVENTO_BY_NAME: (nome) => `${getBaseURL()}/api/public/evento/${encodeURIComponent(nome)}`,
  get PUBLIC_TABELAS_PRECO() { return `${getBaseURL()}/api/public/tabelas-preco`; },

  // Fotos
  get PHOTOS() { return `${getBaseURL()}/api/photos`; },
  get PHOTOS_PASTA() { return `${getBaseURL()}/api/eventos/pasta`; },
  PHOTOS_BY_EVENT: (eventoId) => `${getBaseURL()}/api/photos/evento/${eventoId}`,
  PHOTOS_BY_COREOGRAFIA: (eventoId, coreografiaId) => `${getBaseURL()}/api/photos/evento/${eventoId}/coreografia/${coreografiaId}`,
  get BUSCAR_POR_SELFIE() { return `${getBaseURL()}/api/fotos/buscar-por-selfie`; },
  
  // Eventos
  get EVENTOS() { return `${getBaseURL()}/api/photos/eventos`; },
  COREOGRAFIAS_POR_EVENTO: (eventoId) => `${getBaseURL()}/api/eventos/${eventoId}/coreografias`,
  AQUECER_CACHE: (eventoId) => `${getBaseURL()}/api/eventos/${eventoId}/aquecer-cache`,
  COREOGRAFIAS: (eventoId) => `${getBaseURL()}/api/photos/eventos/${eventoId}/coreografias`,
};

export const BASE_URL = getBaseURL();
export const BACKEND_URL = getBaseURL();
export default api; 
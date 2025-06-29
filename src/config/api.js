// Configuração da API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  // Usuários
  LOGIN: `${API_BASE_URL}/api/usuarios/login`,
  GOOGLE_LOGIN: `${API_BASE_URL}/api/usuarios/google-login`,
  REGISTER: `${API_BASE_URL}/api/usuarios/register`,
  ME: `${API_BASE_URL}/api/usuarios/me`,
  UPDATE_ME: `${API_BASE_URL}/api/usuarios/me`,
  SEND_ORDER: `${API_BASE_URL}/api/usuarios/enviar-pedido-whatsapp`,
  MY_ORDERS: `${API_BASE_URL}/api/usuarios/meus-pedidos`,
  ORDER_DETAILS: (pedidoId) => `${API_BASE_URL}/api/usuarios/pedido/${pedidoId}`,
  
  // Admin
  ADMIN_EVENTOS: `${API_BASE_URL}/api/admin/eventos`,
  ADMIN_TABELAS_PRECO: `${API_BASE_URL}/api/admin/tabelas-preco`,
  
  // Fotos
  PHOTOS: `${API_BASE_URL}/api/photos`,
  PHOTOS_BY_EVENT: (eventoId) => `${API_BASE_URL}/api/photos/evento/${eventoId}`,
  PHOTOS_BY_COREOGRAFIA: (eventoId, coreografiaId) => `${API_BASE_URL}/api/photos/evento/${eventoId}/coreografia/${coreografiaId}`,
  
  // Eventos
  EVENTOS: `${API_BASE_URL}/api/photos/eventos`,
  COREOGRAFIAS: (eventoId) => `${API_BASE_URL}/api/photos/eventos/${eventoId}/coreografias`,
};

export default API_ENDPOINTS; 
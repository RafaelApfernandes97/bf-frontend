// Configuração da API
const BACKEND_URL = 'https://backend.rfsolutionbr.com.br';

export const API_ENDPOINTS = {
  // Usuários
  LOGIN: `${BACKEND_URL}/api/usuarios/login`,
  GOOGLE_LOGIN: `${BACKEND_URL}/api/usuarios/google-login`,
  REGISTER: `${BACKEND_URL}/api/usuarios/register`,
  ME: `${BACKEND_URL}/api/usuarios/me`,
  UPDATE_ME: `${BACKEND_URL}/api/usuarios/me`,
  SEND_ORDER: `${BACKEND_URL}/api/usuarios/enviar-pedido-whatsapp`,
  MY_ORDERS: `${BACKEND_URL}/api/usuarios/meus-pedidos`,
  ORDER_DETAILS: (pedidoId) => `${BACKEND_URL}/api/usuarios/pedido/${pedidoId}`,
  
  // Admin
  ADMIN_EVENTOS: `${BACKEND_URL}/api/admin/eventos`,
  ADMIN_TABELAS_PRECO: `${BACKEND_URL}/api/admin/tabelas-preco`,
  
  // Fotos
  PHOTOS: `${BACKEND_URL}/api/photos`,
  PHOTOS_BY_EVENT: (eventoId) => `${BACKEND_URL}/api/photos/evento/${eventoId}`,
  PHOTOS_BY_COREOGRAFIA: (eventoId, coreografiaId) => `${BACKEND_URL}/api/photos/evento/${eventoId}/coreografia/${coreografiaId}`,
  
  // Eventos
  EVENTOS: `${BACKEND_URL}/api/photos/eventos`,
  COREOGRAFIAS: (eventoId) => `${BACKEND_URL}/api/photos/eventos/${eventoId}/coreografias`,
};

export { BACKEND_URL };
export default API_ENDPOINTS; 
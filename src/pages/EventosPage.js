import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { API_ENDPOINTS } from '../config/api';

function EventosPage() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Função para pré-carregar dados em background
    const preloadData = async () => {
      try {
        // Inicia pré-carregamento em background (não aguarda)
        api.post('/pre-carregar').catch(err => console.log('Pré-carregamento em background:', err));
      } catch (err) {
        console.log('Erro no pré-carregamento:', err);
      }
    };

    // Carrega eventos
    api.get('/eventos')
      .then(res => {
        setEventos(res.data.eventos || []);
        setLoading(false);
        
        // Inicia pré-carregamento após carregar eventos
        preloadData();
      })
      .catch(err => {
        setError('Erro ao carregar eventos');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Carregando eventos...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="eventos-lista">
      <h2>Eventos</h2>
      <div className="eventos-grid">
        {eventos.map(evento => (
          <div
            key={evento}
            className="evento-card"
            onClick={async () => {
              try {
                // Verificar se o evento tem dias selecionados
                const response = await api.get(`/public/eventos/nome/${encodeURIComponent(evento)}`);
                const eventoData = response.data;
                
                if (eventoData.diasSelecionados && eventoData.diasSelecionados.length > 0) {
                  // Se tem dias selecionados, vai para a home do evento
                  navigate(`/eventos/${encodeURIComponent(evento)}`);
                } else {
                  // Se não tem dias selecionados, vai direto para as coreografias
                  navigate(`/eventos/${encodeURIComponent(evento)}/coreografias`);
                }
              } catch (error) {
                console.error('Erro ao verificar evento:', error);
                // Em caso de erro, vai para a home do evento (que redirecionará se necessário)
                navigate(`/eventos/${encodeURIComponent(evento)}`);
              }
            }}
            style={{cursor: 'pointer'}}>
            <div className="evento-capa">Capa do Evento</div>
            <div className="evento-nome">{evento}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventosPage; 
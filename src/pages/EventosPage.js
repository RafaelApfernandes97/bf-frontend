import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = 'https://backend.oballetemfoco.com';

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
        fetch(`${BACKEND_URL}/api/pre-carregar`, {
          method: 'POST'
        }).catch(err => console.log('Pré-carregamento em background:', err));
      } catch (err) {
        console.log('Erro no pré-carregamento:', err);
      }
    };

    // Carrega eventos
    fetch(`${BACKEND_URL}/api/eventos`)
      .then(res => res.json())
      .then(data => {
        setEventos(data.eventos || []);
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
            onClick={() => navigate(`/eventos/${encodeURIComponent(evento)}`)}
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
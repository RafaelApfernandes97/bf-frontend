import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = 'https://backend.rfsolutionbr.com.br';

function EventosPage() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/eventos`)
      .then(res => res.json())
      .then(data => {
        setEventos(data.eventos || []);
        setLoading(false);
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
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CoreografiaCard from '../components/CoreografiaCard';
import CoreografiaTop from '../components/CoreografiaTop';
import './CoreografiasBody.css';
import '../CoreografiasBody.css';
import CalendarIcon from '../assets/icons/calendar_fill.svg';
import LocationIcon from '../assets/icons/location_on.svg';
import CameraIcon from '../assets/icons/Camera.svg';

const BACKEND_URL = 'https://backend.rfsolutionbr.com.br';

function CoreografiasPage() {
  const { eventoId } = useParams();
  const [coreografias, setCoreografias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evento, setEvento] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/eventos/${encodeURIComponent(eventoId)}/coreografias`)
      .then(res => res.json())
      .then(data => {
        const coreografiasOrdenadas = (data.coreografias || []).slice().sort((a, b) => {
          const numA = parseInt((a.nome.match(/\d+/) || [null])[0], 10);
          const numB = parseInt((b.nome.match(/\d+/) || [null])[0], 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          } else if (!isNaN(numA)) {
            return -1;
          } else if (!isNaN(numB)) {
            return 1;
          } else {
            return a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' });
          }
        });
        setCoreografias(coreografiasOrdenadas);
        setLoading(false);
      })
      .catch(err => {
        setError('Erro ao carregar coreografias');
        setLoading(false);
      });
  }, [eventoId]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/admin/eventos`)
      .then(res => {
        console.log('Status da resposta:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Dados dos eventos recebidos:', data);
        console.log('EventoId da URL:', eventoId);
        
        if (!Array.isArray(data)) {
          console.error('Dados não são um array:', data);
          setEvento(null);
          return;
        }
        
        // Busca exata pelo nome do evento
        const ev = data.find(e => e.nome === eventoId);
        
        console.log('Evento encontrado:', ev);
        
        // Se encontrou o evento, formata a data
        if (ev) {
          const eventoFormatado = {
            ...ev,
            data: ev.data ? new Date(ev.data).toLocaleDateString('pt-BR') : null
          };
          setEvento(eventoFormatado);
        } else {
          // Se não encontrou, tenta busca case-insensitive
          const evCaseInsensitive = data.find(e => 
            e.nome.toLowerCase() === eventoId.toLowerCase()
          );
          
          if (evCaseInsensitive) {
            const eventoFormatado = {
              ...evCaseInsensitive,
              data: evCaseInsensitive.data ? new Date(evCaseInsensitive.data).toLocaleDateString('pt-BR') : null
            };
            setEvento(eventoFormatado);
          } else {
            setEvento(null);
          }
        }
      })
      .catch(err => {
        console.error('Erro ao carregar dados do evento:', err);
        setEvento(null);
      });
  }, [eventoId]);

  const totalFotos = coreografias.reduce((acc, c) => acc + (c.quantidade || 0), 0);

  if (loading) return <div>Carregando coreografias...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <CoreografiaTop nome={eventoId.replace(/%20/g, ' ')} />
      <div className="evento-info-bar">
        {evento && evento.data && (
          <span className="evento-info-item">
            <img src={CalendarIcon} alt="Data" style={{width:16,marginRight:6,verticalAlign:'middle'}} />
            {evento.data}
          </span>
        )}
        {evento && evento.local && (
          <span className="evento-info-item">
            <img src={LocationIcon} alt="Local" style={{width:16,marginRight:6,verticalAlign:'middle'}} />
            {evento.local}
          </span>
        )}
        <span className="evento-info-item">
          <img src={CameraIcon} alt="Fotos" style={{width:16,marginRight:6,verticalAlign:'middle'}} />
          {totalFotos} fotos
        </span>
      </div>
      <div className="body">
        {coreografias.map((coreografia, idx) => (
          <div key={coreografia.nome} onClick={() => navigate(`/eventos/${eventoId}/${encodeURIComponent(coreografia.nome)}/fotos`)} style={{cursor: 'pointer'}}>
            <CoreografiaCard
              nome={coreografia.nome}
              capa={coreografia.capa}
              quantidade={coreografia.quantidade}
              className={`coreografia-instance coreografia-${idx+1}`}
            />
          </div>
        ))}
      </div>
    </>
  );
}

export default CoreografiasPage; 
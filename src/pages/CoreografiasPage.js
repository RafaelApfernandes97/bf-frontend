import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CoreografiaCard from '../components/CoreografiaCard';
import CoreografiaTop from '../components/CoreografiaTop';
import './CoreografiasBody.css';

function CoreografiasPage() {
  const { eventoId } = useParams();
  const [coreografias, setCoreografias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:3001/api/eventos/${encodeURIComponent(eventoId)}/coreografias`)
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

  if (loading) return <div>Carregando coreografias...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <CoreografiaTop nome={eventoId.replace(/%20/g, ' ')} />
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
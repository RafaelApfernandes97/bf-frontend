import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CoreografiaTop from '../components/CoreografiaTop';
import api from '../config/api';
import './EventoHomePage.css';

export default function EventoHomePage() {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    carregarEvento();
  }, [eventoId]);

  async function carregarEvento() {
    try {
      setLoading(true);
      const response = await api.get(`/public/eventos/nome/${encodeURIComponent(eventoId)}`);
      const eventoData = response.data;
      
      // Verificar se o evento tem dias selecionados
      if (!eventoData.diasSelecionados || eventoData.diasSelecionados.length === 0) {
        // Se não tem dias selecionados, redirecionar para a página normal de coreografias
        navigate(`/eventos/${eventoId}/coreografias`);
        return;
      }
      
      setEvento(eventoData);
    } catch (err) {
      console.error('Erro ao carregar evento:', err);
      setError('Erro ao carregar evento');
    } finally {
      setLoading(false);
    }
  }

  function handleDiaClick(dia) {
    // Navegar para a página de coreografias com o dia selecionado
    navigate(`/eventos/${eventoId}/coreografias?dia=${encodeURIComponent(dia)}`);
  }

  if (loading) {
    return (
      <div className="evento-home-container">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="evento-home-container">
        <Header />
        <div className="error-container">
          <h2>Erro</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn-voltar">
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="evento-home-container">
        <Header />
        <div className="error-container">
          <h2>Evento não encontrado</h2>
          <button onClick={() => navigate('/')} className="btn-voltar">
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="evento-home-container">
      <Header />
      
      <CoreografiaTop nome={evento.nome}>
        {evento.data && (
          <div className="evento-data-info">
            <span className="evento-data">
              {new Date(evento.data).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </span>
          </div>
        )}
      </CoreografiaTop>

      <div className="evento-home-content">
        <div className="dias-grid">
          {evento.diasSelecionados.map((dia, index) => {
            const temCapa = evento.capasDias && evento.capasDias[dia];
            const urlCapa = evento.capasDias?.[dia];
            
            return (
              <div 
                key={index} 
                className="dia-card"
                onClick={() => handleDiaClick(dia)}
              >
                <div className="dia-card-image">
                  {temCapa && urlCapa ? (
                    <img 
                      src={urlCapa} 
                      alt={`Capa ${dia}`}
                      className="dia-capa"
                    />
                  ) : (
                    <div className="dia-capa-placeholder">
                      <span className="placeholder-icon">📸</span>
                    </div>
                  )}
                </div>
                
                <div className="dia-card-content">
                  <h3 className="dia-nome">{dia}</h3>
                  <p className="dia-descricao">
                    Clique para ver as fotos
                  </p>
                </div>
                
                <div className="dia-card-overlay">
                  <span className="ver-fotos-btn">Ver Fotos</span>
                </div>
              </div>
            );
          })}
        </div>

        {evento.diasSelecionados.length === 0 && (
          <div className="sem-dias">
            <p>Este evento não possui dias configurados.</p>
            <button 
              onClick={() => navigate(`/eventos/${eventoId}/coreografias`)}
              className="btn-ver-todas"
            >
              Ver Todas as Fotos
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
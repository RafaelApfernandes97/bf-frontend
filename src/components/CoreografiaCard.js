import React, { useReducer } from "react";
import PropTypes from "prop-types";
import './CoreografiaCard.css';

function reducer(state, action) {
  switch (action) {
    case "mouse_enter":
      return { ...state, status: "hover" };
    case "mouse_leave":
      return { ...state, status: "padr-o" };
    default:
      return state;
  }
}

export default function CoreografiaCard({
  nome = "Coreografia 01",
  capa,
  quantidade = 0,
  versO = "two",
  status = "padr-o",
  line = "/line-2.svg",
  className = "",
}) {
  const isMobile = window.innerWidth <= 700;
  const [state, dispatch] = useReducer(reducer, {
    versO: isMobile ? "one" : versO,
    status: status,
  });

  // Lógica para escolher a linha (pode ser expandida conforme necessário)
  const lineSrc = line;

  return (
    <div
      className={`coreografia ${state.versO} ${state.status} ${className}`}
      onMouseEnter={() => !isMobile && dispatch("mouse_enter")}
      onMouseLeave={() => !isMobile && dispatch("mouse_leave")}
    >
      <div
        className="imagem-instance"
        style={{ backgroundImage: `url(${capa})` }}
      />
      <div className="frame">
        <div className="h">{nome}</div>
        <img className="line" alt="Line" src={lineSrc} />
        <div className="info">
          <span className="camera-instance">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="5" width="12" height="8" rx="2" fill="#A0A0A0"/>
              <circle cx="8" cy="9" r="2" fill="#181818"/>
              <rect x="6" y="3" width="4" height="2" rx="1" fill="#A0A0A0"/>
            </svg>
          </span>
          <div className="text-wrapper">{quantidade} fotos</div>
        </div>
      </div>
    </div>
  );
}

CoreografiaCard.propTypes = {
  nome: PropTypes.string,
  capa: PropTypes.string,
  quantidade: PropTypes.number,
  versO: PropTypes.oneOf(["two", "one"]),
  status: PropTypes.oneOf(["padr-o", "hover"]),
  line: PropTypes.string,
  className: PropTypes.string,
}; 
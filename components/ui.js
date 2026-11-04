'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IconFechar } from './Icons';

// ---------------------------------------------------------------- Toast
export function useToast() {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);
  const mostrar = useCallback((texto, tipo = 'ok') => {
    clearTimeout(timer.current);
    setMsg({ texto, tipo });
    timer.current = setTimeout(() => setMsg(null), 3200);
  }, []);
  const node = msg ? (
    <div className={`toast ${msg.tipo === 'erro' ? 'erro' : ''}`} role="status">
      {msg.texto}
    </div>
  ) : null;
  return { mostrar, node };
}

// ---------------------------------------------------------------- Sheet
export function Sheet({ aberto, onFechar, titulo, children, rodape, alta = false }) {
  useEffect(() => {
    if (!aberto) return;
    document.body.classList.add('travado');
    const esc = (e) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', esc);
    return () => {
      document.body.classList.remove('travado');
      window.removeEventListener('keydown', esc);
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className={`sheet ${alta ? 'alta' : ''}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="sheet-topo">
          <h2>{titulo}</h2>
          <button className="btn-icone" onClick={onFechar} aria-label="Fechar">
            <IconFechar size={20} />
          </button>
        </div>
        <div className="sheet-corpo">{children}</div>
        {rodape ? <div className="sheet-rodape">{rodape}</div> : null}
      </div>
    </div>
  );
}

export function Campo({ rotulo, dica, children }) {
  return (
    <div className="campo">
      {rotulo ? <label>{rotulo}</label> : null}
      {children}
      {dica ? <small>{dica}</small> : null}
    </div>
  );
}

export function Ornamento() {
  return (
    <div className="ornamento" aria-hidden="true">
      <i />
    </div>
  );
}

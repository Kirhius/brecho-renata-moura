'use client';
import { useState } from 'react';
import Logo from './Logo';
import { IconCadeado } from './Icons';
import { chamar } from '@/lib/client';

export const CHAVE_SENHA = 'rm_admin_senha';

// Formulario de senha da area da loja (usado no rodape do site e na rota /admin)
export default function AdminLogin({ onSucesso, onVoltar }) {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    if (!senha) return;
    setCarregando(true);
    setErro('');
    try {
      await chamar('admin.login', {}, senha);
      try {
        sessionStorage.setItem(CHAVE_SENHA, senha);
      } catch {
        /* navegacao privada: segue sem guardar */
      }
      onSucesso(senha);
    } catch (err) {
      setErro(err.message === 'Senha incorreta.' ? 'Senha incorreta. Tente novamente.' : err.message);
      setSenha('');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={entrar}>
        <Logo className="logo" />
        <h2 className="serif" style={{ fontSize: 28, margin: '4px 0 2px', color: 'var(--wine)' }}>
          Área da loja
        </h2>
        <p className="mudo" style={{ margin: '0 0 18px' }}>
          Digite a senha para gerenciar o catálogo.
        </p>
        <div className="campo">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••"
            aria-label="Senha"
          />
        </div>
        {erro ? <div className="aviso erro">{erro}</div> : null}
        <button className="btn solido cheio" disabled={carregando || !senha}>
          <IconCadeado size={18} /> {carregando ? 'Entrando...' : 'Entrar'}
        </button>
        {onVoltar ? (
          <button type="button" className="link-admin" onClick={onVoltar}>
            Voltar ao catálogo
          </button>
        ) : null}
      </form>
    </div>
  );
}

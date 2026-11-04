'use client';
import { useEffect, useState } from 'react';
import { Campo } from '../ui';
import { IconWhatsapp } from '../Icons';
import { MODO_DEMO } from '@/lib/client';
import { restaurarDemo } from '@/lib/adapter-local';
import { linkWhatsapp } from '@/lib/whatsapp';

export default function AjustesTab({ dados, exec, recarregar }) {
  const [f, setF] = useState(dados.config);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => setF(dados.config), [dados.config]);

  const set = (campo) => (e) => setF((x) => ({ ...x, [campo]: e.target.value }));

  async function salvar() {
    setSalvando(true);
    await exec('config.salvar', f, 'Ajustes salvos!');
    setSalvando(false);
  }

  async function restaurar() {
    if (!window.confirm('Apagar tudo o que foi feito neste aparelho e voltar às peças de exemplo?')) return;
    restaurarDemo();
    await recarregar();
  }

  return (
    <>
      <div className="admin-titulo">
        <h2>Ajustes</h2>
      </div>

      <Campo rotulo="Nome da loja">
        <input value={f.nome_loja || ''} onChange={set('nome_loja')} maxLength={60} />
      </Campo>
      <Campo
        rotulo="WhatsApp que recebe os pedidos"
        dica="Com DDD. Ex.: 61 99999-9999. É para este número que o botão “Finalizar pedido” envia a mensagem."
      >
        <input value={f.whatsapp || ''} onChange={set('whatsapp')} inputMode="tel" placeholder="61 99999-9999" />
      </Campo>
      <Campo rotulo="Instagram (opcional)" dica="Só o nome de usuário, sem @.">
        <input value={f.instagram || ''} onChange={set('instagram')} placeholder="renatamoura.brecho" maxLength={60} />
      </Campo>
      <Campo rotulo="Frase de destaque do catálogo">
        <input value={f.destaque || ''} onChange={set('destaque')} maxLength={120} />
      </Campo>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn solido" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar ajustes'}
        </button>
        {dados.config.whatsapp ? (
          <a
            className="btn suave"
            href={linkWhatsapp(dados.config.whatsapp, 'Teste do catálogo Renata Moura')}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconWhatsapp size={18} /> Testar WhatsApp
          </a>
        ) : null}
      </div>

      <div className="sep" />

      <div className="aviso">
        <b>Senha da área da loja:</b> o padrão é <b>1602</b>. Para trocar, defina a variável{' '}
        <code>ADMIN_PASSWORD</code> na Vercel e faça um novo deploy.
      </div>

      {MODO_DEMO ? (
        <>
          <div className="aviso">
            <b>Modo demonstração:</b> o site ainda não está ligado ao Supabase, então tudo fica salvo apenas neste
            aparelho. Siga o README para ligar o banco de dados e as fotos reais.
          </div>
          <button className="btn perigo pequeno" onClick={restaurar}>
            Restaurar peças de exemplo
          </button>
        </>
      ) : null}
    </>
  );
}

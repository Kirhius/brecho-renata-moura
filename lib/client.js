'use client';
// Facade usada pelas telas: em producao chama /api/rpc (Supabase);
// sem Supabase configurado, roda no navegador (modo demonstracao).

import { executar } from './handlers.js';
import { adapterLocal } from './adapter-local.js';
import { ADMIN_PASS_PADRAO } from './constants.js';
import { comprimirImagem, blobParaDataUrl } from './image.js';

export const MODO_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function chamar(acao, payload = {}, senha = '') {
  if (MODO_DEMO) {
    return executar(adapterLocal, acao, payload, senha, ADMIN_PASS_PADRAO);
  }
  let res;
  try {
    res = await fetch('/api/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao, payload, senha }),
    });
  } catch {
    throw new Error('Sem conexão. Verifique a internet e tente novamente.');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.erro || 'Algo deu errado. Tente novamente.');
  return json;
}

// Comprime a foto no aparelho e envia (Supabase Storage) ou guarda como data URL (demo)
export async function enviarFoto(file, senha) {
  const blob = await comprimirImagem(file, MODO_DEMO ? 800 : 1200, MODO_DEMO ? 0.7 : 0.82);
  if (MODO_DEMO) return blobParaDataUrl(blob);
  const fd = new FormData();
  fd.append('file', blob, 'foto.jpg');
  fd.append('senha', senha);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.erro || 'Não foi possível enviar a foto.');
  return json.url;
}

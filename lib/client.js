'use client';
// Facade usada pelas telas: em producao chama /api/rpc (Supabase);
// sem Supabase configurado, roda no navegador (modo demonstracao).

import { executar } from './handlers.js';
import { adapterLocal } from './adapter-local.js';
import { ADMIN_PASS_PADRAO } from './constants.js';
import { comprimirImagem, blobParaDataUrl } from './image.js';
import { comprimirVideo } from './video.js';

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

// Prepara o video no aparelho (leve, H.264/MP4) e envia para o Supabase Storage
export async function enviarVideo(file, senha, onProgresso) {
  if (MODO_DEMO) {
    throw new Error('Vídeos só funcionam depois que o site estiver ligado ao Supabase (não no modo demonstração).');
  }
  const blob = await comprimirVideo(file, { onProgresso });
  if (onProgresso) onProgresso('enviando');
  const ext = blob.type.includes('webm') ? 'webm' : 'mp4';
  const fd = new FormData();
  fd.append('file', blob, `video.${ext}`);
  fd.append('senha', senha);
  let res;
  try {
    res = await fetch('/api/upload', { method: 'POST', body: fd });
  } catch {
    throw new Error('Sem conexão ao enviar o vídeo. Tente de novo.');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(res.status === 413 ? 'Vídeo grande demais. Use um trecho mais curto.' : json.erro || 'Não foi possível enviar o vídeo.');
  }
  return json.url;
}

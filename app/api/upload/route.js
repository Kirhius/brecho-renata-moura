import { NextResponse } from 'next/server';
import { senhaAdmin } from '@/lib/handlers';
import { criarClienteSupabase, supabaseConfigurado } from '@/lib/adapter-supabase';

export const dynamic = 'force-dynamic';

const BUCKET = 'produtos';
// fotos: ate 4 MB. videos (ja reduzidos no aparelho): ate ~4,2 MB (limite da Vercel e 4,5 MB por envio)
const TIPOS = {
  'image/jpeg': { ext: 'jpg', max: 4 * 1024 * 1024 },
  'image/png': { ext: 'png', max: 4 * 1024 * 1024 },
  'image/webp': { ext: 'webp', max: 4 * 1024 * 1024 },
  'video/mp4': { ext: 'mp4', max: 4 * 1024 * 1024 + 200 * 1024 },
  'video/webm': { ext: 'webm', max: 4 * 1024 * 1024 + 200 * 1024 },
};

export async function POST(request) {
  if (!supabaseConfigurado()) {
    return NextResponse.json({ erro: 'Supabase não configurado.' }, { status: 500 });
  }
  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ erro: 'Envio inválido ou grande demais.' }, { status: 400 });
  }
  if (String(form.get('senha') || '') !== String(senhaAdmin())) {
    return NextResponse.json({ erro: 'Senha incorreta.' }, { status: 401 });
  }
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ erro: 'Nenhum arquivo enviado.' }, { status: 400 });
  }
  const tipo = String(file.type || '').split(';')[0];
  const regra = TIPOS[tipo];
  if (!regra) {
    return NextResponse.json({ erro: 'Formato não suportado.' }, { status: 400 });
  }
  if (file.size > regra.max) {
    return NextResponse.json({ erro: 'Arquivo muito grande.' }, { status: 413 });
  }

  const sb = criarClienteSupabase();
  const nome = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${regra.ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await sb.storage.from(BUCKET).upload(nome, bytes, {
    contentType: tipo,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ erro: 'Falha ao salvar o arquivo: ' + error.message }, { status: 500 });
  }
  const { data } = sb.storage.from(BUCKET).getPublicUrl(nome);
  return NextResponse.json({ url: data.publicUrl });
}

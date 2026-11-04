import { NextResponse } from 'next/server';
import { senhaAdmin } from '@/lib/handlers';
import { criarClienteSupabase, supabaseConfigurado } from '@/lib/adapter-supabase';

export const dynamic = 'force-dynamic';

const BUCKET = 'produtos';
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request) {
  if (!supabaseConfigurado()) {
    return NextResponse.json({ erro: 'Supabase não configurado.' }, { status: 500 });
  }
  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ erro: 'Envio inválido.' }, { status: 400 });
  }
  if (String(form.get('senha') || '') !== String(senhaAdmin())) {
    return NextResponse.json({ erro: 'Senha incorreta.' }, { status: 401 });
  }
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ erro: 'Nenhuma foto enviada.' }, { status: 400 });
  }
  if (!TIPOS.includes(file.type)) {
    return NextResponse.json({ erro: 'Formato de imagem não suportado.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ erro: 'Foto muito grande (máx. 4 MB).' }, { status: 413 });
  }

  const sb = criarClienteSupabase();
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const nome = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await sb.storage.from(BUCKET).upload(nome, bytes, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ erro: 'Falha ao salvar a foto: ' + error.message }, { status: 500 });
  }
  const { data } = sb.storage.from(BUCKET).getPublicUrl(nome);
  return NextResponse.json({ url: data.publicUrl });
}

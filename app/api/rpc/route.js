import { NextResponse } from 'next/server';
import { executar, senhaAdmin, ErroApp } from '@/lib/handlers';
import { criarAdapterSupabase, supabaseConfigurado } from '@/lib/adapter-supabase';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!supabaseConfigurado()) {
    return NextResponse.json(
      { erro: 'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.' },
      { status: 500 }
    );
  }
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: 'Requisição inválida.' }, { status: 400 });
  }
  try {
    const db = criarAdapterSupabase();
    const resultado = await executar(db, corpo.acao, corpo.payload, corpo.senha, senhaAdmin());
    return NextResponse.json(resultado ?? { ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    if (e instanceof ErroApp) {
      return NextResponse.json({ erro: e.message }, { status: e.codigo });
    }
    console.error('rpc error', corpo?.acao, e);
    return NextResponse.json({ erro: 'Erro no servidor: ' + (e?.message || 'desconhecido') }, { status: 500 });
  }
}

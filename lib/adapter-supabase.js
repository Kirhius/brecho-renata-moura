// Adapter do Supabase. SO e usado no servidor (rotas /api), com a service role.
import { createClient } from '@supabase/supabase-js';

export function supabaseConfigurado() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function criarClienteSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function ok({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export function criarAdapterSupabase(sb = criarClienteSupabase()) {
  return {
    async list(tabela) {
      return ok(await sb.from(tabela).select('*').limit(5000));
    },
    async get(tabela, id) {
      return ok(await sb.from(tabela).select('*').eq('id', id).maybeSingle());
    },
    async insert(tabela, row) {
      return ok(await sb.from(tabela).insert(row).select().single());
    },
    async update(tabela, id, patch) {
      return ok(await sb.from(tabela).update(patch).eq('id', id).select().single());
    },
    async remove(tabela, id) {
      ok(await sb.from(tabela).delete().eq('id', id));
    },
    // Troca de status so se ainda estiver no status esperado (evita reserva dupla)
    async claim(tabela, id, statusAtual, patch) {
      const data = ok(
        await sb.from(tabela).update(patch).eq('id', id).eq('status', statusAtual).select('id')
      );
      return Array.isArray(data) && data.length > 0;
    },
    async upsert(tabela, row) {
      return ok(await sb.from(tabela).upsert(row).select().single());
    },
  };
}

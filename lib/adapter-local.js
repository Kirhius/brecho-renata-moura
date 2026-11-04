// Adapter de modo demonstracao: guarda tudo no localStorage do navegador.
import { semearDemo } from './demo-seed.js';

const chave = (t) => `rm_brecho_${t}`;
const FLAG = 'rm_brecho_semeado_v1';

function ler(tabela) {
  try {
    return JSON.parse(localStorage.getItem(chave(tabela)) || '[]');
  } catch {
    return [];
  }
}

function gravar(tabela, linhas) {
  try {
    localStorage.setItem(chave(tabela), JSON.stringify(linhas));
  } catch {
    throw new Error('Sem espaço no navegador (modo demonstração). Use menos fotos ou configure o Supabase.');
  }
}

function novoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function garantirSemente() {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem(FLAG)) return;
  const d = semearDemo();
  for (const t of Object.keys(d)) gravar(t, d[t]);
  localStorage.setItem(FLAG, '1');
}

export function restaurarDemo() {
  localStorage.removeItem(FLAG);
  garantirSemente();
}

export const adapterLocal = {
  async list(tabela) {
    garantirSemente();
    return ler(tabela);
  },
  async get(tabela, id) {
    garantirSemente();
    return ler(tabela).find((r) => r.id === id) || null;
  },
  async insert(tabela, row) {
    garantirSemente();
    const nova = { id: novoId(), created_at: new Date().toISOString(), ...row };
    gravar(tabela, [...ler(tabela), nova]);
    return nova;
  },
  async update(tabela, id, patch) {
    garantirSemente();
    const linhas = ler(tabela);
    const i = linhas.findIndex((r) => r.id === id);
    if (i < 0) throw new Error('Registro não encontrado.');
    linhas[i] = { ...linhas[i], ...patch };
    gravar(tabela, linhas);
    return linhas[i];
  },
  async remove(tabela, id) {
    garantirSemente();
    gravar(tabela, ler(tabela).filter((r) => r.id !== id));
  },
  async claim(tabela, id, statusAtual, patch) {
    garantirSemente();
    const linhas = ler(tabela);
    const i = linhas.findIndex((r) => r.id === id);
    if (i < 0 || linhas[i].status !== statusAtual) return false;
    linhas[i] = { ...linhas[i], ...patch };
    gravar(tabela, linhas);
    return true;
  },
  async upsert(tabela, row) {
    garantirSemente();
    const linhas = ler(tabela);
    const i = linhas.findIndex((r) => r.id === row.id);
    if (i >= 0) linhas[i] = { ...linhas[i], ...row };
    else linhas.push({ created_at: new Date().toISOString(), ...row });
    gravar(tabela, linhas);
    return i >= 0 ? linhas[i] : linhas[linhas.length - 1];
  },
};

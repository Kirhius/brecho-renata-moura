// Regras de negocio do brecho. Usadas tanto no servidor (Supabase) quanto no
// navegador (modo demonstracao com localStorage) por meio de um "adapter".
//
// adapter: list(tabela) get(tabela,id) insert(tabela,row) update(tabela,id,patch)
//          remove(tabela,id) claim(tabela,id,statusAtual,patch) upsert(tabela,row)

import { ADMIN_PASS_PADRAO, CONFIG_PADRAO } from './constants.js';
import { novoIdCurto, normalizarWhatsapp } from './format.js';
import { EXEMPLOS } from './exemplos.js';

export class ErroApp extends Error {
  constructor(mensagem, codigo = 400) {
    super(mensagem);
    this.codigo = codigo;
  }
}

const num = (v) => {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const txt = (v, max = 300) => String(v ?? '').trim().slice(0, max);

function porDataDesc(a, b) {
  return String(b.created_at || '').localeCompare(String(a.created_at || ''));
}

function limparProduto(p, comCusto) {
  const { custo, ...resto } = p;
  return comCusto ? p : resto;
}

async function lerConfig(db) {
  const c = await db.get('config', 'main');
  return { ...CONFIG_PADRAO, ...(c || {}) };
}

function configPublica(c) {
  return {
    nome_loja: c.nome_loja,
    whatsapp: c.whatsapp,
    instagram: c.instagram,
    destaque: c.destaque,
  };
}

async function criarLancamentoVenda(db, pedido) {
  await db.insert('lancamentos', {
    tipo: 'receita',
    descricao: `Venda - pedido #${pedido.codigo} (${pedido.cliente_nome})`,
    valor: pedido.total,
    data: new Date().toISOString().slice(0, 10),
    pedido_id: pedido.id,
  });
}

// ---------------------------------------------------------------- acoes
const acoes = {
  // ------------------------------------------------------------ publicas
  async 'loja.carregar'(db) {
    const [produtos, config] = await Promise.all([db.list('produtos'), lerConfig(db)]);
    const visiveis = produtos
      .filter((p) => p.status === 'disponivel' || p.status === 'reservado')
      .map((p) => limparProduto(p, false))
      .sort(porDataDesc);
    return { produtos: visiveis, config: configPublica(config) };
  },

  async 'pedido.criar'(db, { nome, ids }) {
    const cliente = txt(nome, 80);
    if (!cliente) throw new ErroApp('Informe seu nome para finalizar o pedido.');
    if (!Array.isArray(ids) || ids.length === 0) throw new ErroApp('Sua sacola está vazia.');
    const unicos = [...new Set(ids)].slice(0, 30);

    const reservados = [];
    const indisponiveis = [];
    for (const id of unicos) {
      const produto = await db.get('produtos', id);
      if (!produto) {
        indisponiveis.push({ id, nome: 'Peça removida' });
        continue;
      }
      const ok = await db.claim('produtos', id, 'disponivel', { status: 'reservado' });
      if (ok) reservados.push(produto);
      else indisponiveis.push({ id, nome: produto.nome });
    }

    if (reservados.length === 0) {
      return { pedido: null, indisponiveis };
    }

    const itens = reservados.map((p) => ({
      id: p.id,
      nome: p.nome,
      marca: p.marca || '',
      tamanho: p.tamanho || '',
      cor: p.cor || '',
      preco: num(p.preco),
      custo: num(p.custo),
      fotos: (p.fotos || []).slice(0, 4),
    }));
    const total = itens.reduce((s, i) => s + i.preco, 0);
    const pedido = await db.insert('pedidos', {
      codigo: novoIdCurto(),
      cliente_nome: cliente,
      itens,
      total,
      status: 'aberto',
    });
    return { pedido, indisponiveis };
  },

  // --------------------------------------------------------------- admin
  async 'admin.login'() {
    return { ok: true };
  },

  async 'admin.carregar'(db) {
    const [produtos, pedidos, lancamentos, config] = await Promise.all([
      db.list('produtos'),
      db.list('pedidos'),
      db.list('lancamentos'),
      lerConfig(db),
    ]);
    return {
      produtos: produtos.sort(porDataDesc),
      pedidos: pedidos.sort(porDataDesc),
      lancamentos: lancamentos.sort((a, b) =>
        String(b.data).localeCompare(String(a.data)) || porDataDesc(a, b)
      ),
      config,
    };
  },

  async 'produto.salvar'(db, p) {
    const nome = txt(p.nome, 120);
    if (!nome) throw new ErroApp('Informe o nome da peça.');
    const dados = {
      nome,
      marca: txt(p.marca, 80),
      categoria: txt(p.categoria, 40),
      tamanho: txt(p.tamanho, 20),
      cor: txt(p.cor, 40),
      descricao: txt(p.descricao, 800),
      preco: num(p.preco),
      custo: num(p.custo),
      fotos: Array.isArray(p.fotos) ? p.fotos.filter(Boolean).slice(0, 8) : [],
      status: ['disponivel', 'reservado', 'vendido'].includes(p.status) ? p.status : 'disponivel',
    };
    if (p.id) return db.update('produtos', p.id, dados);
    return db.insert('produtos', dados);
  },

  async 'produto.excluir'(db, { id }) {
    await db.remove('produtos', id);
    return { ok: true };
  },

  // Conclui a venda: pecas viram "vendido" e entra a receita no financeiro
  async 'pedido.concluir'(db, { id }) {
    const pedido = await db.get('pedidos', id);
    if (!pedido) throw new ErroApp('Pedido não encontrado.', 404);
    if (pedido.status !== 'aberto') throw new ErroApp('Este pedido já foi finalizado.');
    for (const item of pedido.itens) {
      await db.update('produtos', item.id, { status: 'vendido' }).catch(() => null);
    }
    const atualizado = await db.update('pedidos', id, { status: 'concluido' });
    await criarLancamentoVenda(db, atualizado);
    return atualizado;
  },

  // Cancela o pedido e devolve as pecas para o catalogo
  async 'pedido.cancelar'(db, { id }) {
    const pedido = await db.get('pedidos', id);
    if (!pedido) throw new ErroApp('Pedido não encontrado.', 404);
    if (pedido.status !== 'aberto') throw new ErroApp('Este pedido já foi finalizado.');
    for (const item of pedido.itens) {
      await db.update('produtos', item.id, { status: 'disponivel' }).catch(() => null);
    }
    return db.update('pedidos', id, { status: 'cancelado' });
  },

  // Libera uma unica peca de um pedido em aberto
  async 'reserva.liberar'(db, { produtoId }) {
    const pedidos = await db.list('pedidos');
    const pedido = pedidos.find(
      (p) => p.status === 'aberto' && p.itens.some((i) => i.id === produtoId)
    );
    await db.update('produtos', produtoId, { status: 'disponivel' }).catch(() => null);
    if (pedido) {
      const itens = pedido.itens.filter((i) => i.id !== produtoId);
      const total = itens.reduce((s, i) => s + num(i.preco), 0);
      await db.update('pedidos', pedido.id, {
        itens,
        total,
        status: itens.length ? 'aberto' : 'cancelado',
      });
    }
    return { ok: true };
  },

  // Cadastra as pecas ficticias de teste (nao duplica se ja existirem)
  async 'exemplos.adicionar'(db) {
    const existentes = await db.list('produtos');
    const jaTem = new Set(existentes.map((p) => (p.fotos && p.fotos[0]) || ''));
    let adicionados = 0;
    for (const ex of EXEMPLOS) {
      if (jaTem.has(ex.fotos[0])) continue;
      await db.insert('produtos', { ...ex, status: 'disponivel' });
      adicionados += 1;
    }
    return { adicionados };
  },

  async 'lancamento.salvar'(db, l) {
    const descricao = txt(l.descricao, 120);
    if (!descricao) throw new ErroApp('Informe uma descrição.');
    const valor = num(l.valor);
    if (valor <= 0) throw new ErroApp('Informe um valor maior que zero.');
    return db.insert('lancamentos', {
      tipo: l.tipo === 'receita' ? 'receita' : 'despesa',
      descricao,
      valor,
      data: /^\d{4}-\d{2}-\d{2}$/.test(l.data || '') ? l.data : new Date().toISOString().slice(0, 10),
      pedido_id: null,
    });
  },

  async 'lancamento.excluir'(db, { id }) {
    await db.remove('lancamentos', id);
    return { ok: true };
  },

  async 'config.salvar'(db, c) {
    const atual = await lerConfig(db);
    const nova = {
      ...atual,
      id: 'main',
      nome_loja: txt(c.nome_loja, 60) || atual.nome_loja,
      whatsapp: normalizarWhatsapp(c.whatsapp),
      instagram: txt(c.instagram, 60).replace(/^@/, ''),
      destaque: txt(c.destaque, 120),
    };
    await db.upsert('config', nova);
    return nova;
  },
};

const PUBLICAS = new Set(['loja.carregar', 'pedido.criar']);

export function senhaAdmin() {
  return (typeof process !== 'undefined' && process.env && process.env.ADMIN_PASSWORD) || ADMIN_PASS_PADRAO;
}

export async function executar(db, acao, payload, senha, senhaCorreta) {
  const fn = acoes[acao];
  if (!fn) throw new ErroApp('Ação desconhecida.', 404);
  if (!PUBLICAS.has(acao) && String(senha || '') !== String(senhaCorreta)) {
    throw new ErroApp('Senha incorreta.', 401);
  }
  return fn(db, payload || {});
}

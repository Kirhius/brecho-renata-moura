// Pecas de exemplo (marcas ficticias) para visualizar o site antes de configurar o Supabase.
import { CONFIG_PADRAO } from './constants.js';

function placeholder(c1, c2, marca, tipo) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
  <rect width="600" height="800" fill="url(#g)"/>
  <g fill="none" stroke="#ffffff" stroke-opacity=".85" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M300 250 v-30 a28 28 0 1 1 28 28"/>
    <path d="M300 250 L120 400 Q100 418 124 418 H476 Q500 418 480 400 Z"/>
  </g>
  <text x="300" y="520" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#ffffff" fill-opacity=".95" letter-spacing="6">${marca.toUpperCase()}</text>
  <text x="300" y="565" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="26" fill="#ffffff" fill-opacity=".85">${tipo}</text>
  <text x="300" y="740" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#ffffff" fill-opacity=".7" letter-spacing="4">FOTO DE EXEMPLO</text>
</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const dias = (n) => new Date(Date.now() - n * 86400000).toISOString();

export function semearDemo() {
  const base = [
    { id: 'demo-1', nome: 'Vestido midi de seda', marca: 'Maison Aurore', categoria: 'Vestidos', tamanho: 'M', cor: 'Nude rosado', preco: 389, custo: 140, c: ['#e8b7bd', '#c98c97'], d: 'Vestido midi em seda pura, caimento fluido e fenda lateral discreta. Usado poucas vezes, impecável.', dia: 1 },
    { id: 'demo-2', nome: 'Blazer alfaiataria', marca: 'Atelier Violette', categoria: 'Casacos', tamanho: '38', cor: 'Off-white', preco: 459, custo: 180, c: ['#d9c7b8', '#b69f8c'], d: 'Blazer estruturado com forro em cetim e botões dourados.', dia: 2 },
    { id: 'demo-3', nome: 'Bolsa de couro matelassê', marca: 'Casa Lumière', categoria: 'Bolsas', tamanho: 'Único', cor: 'Caramelo', preco: 890, custo: 420, c: ['#c9a27a', '#9a7350'], d: 'Bolsa em couro legítimo com corrente dourada. Acompanha dust bag.', dia: 3 },
    { id: 'demo-4', nome: 'Blusa de cetim com laço', marca: 'Maison Aurore', categoria: 'Blusas', tamanho: 'P', cor: 'Rosa chá', preco: 189, custo: 60, c: ['#f0c9cf', '#d9a0ab'], d: 'Blusa de cetim com laço na gola, perfeita para o dia a dia elegante.', dia: 4 },
    { id: 'demo-5', nome: 'Saia plissada midi', marca: 'Atelier Violette', categoria: 'Saias', tamanho: 'M', cor: 'Champagne', preco: 229, custo: 80, c: ['#e6d3b3', '#c3a778'], d: 'Saia plissada com cintura alta e leve brilho acetinado.', dia: 5 },
    { id: 'demo-6', nome: 'Scarpin salto 9', marca: 'Casa Lumière', categoria: 'Sapatos', tamanho: '37', cor: 'Nude', preco: 349, custo: 130, c: ['#ddb9a5', '#b98f78'], d: 'Scarpin clássico de bico fino, salto 9 cm. Sola preservada.', dia: 6 },
    { id: 'demo-7', nome: 'Conjunto tricô duas peças', marca: 'Maison Aurore', categoria: 'Conjuntos', tamanho: 'G', cor: 'Rosé', preco: 329, custo: 110, c: ['#efbfc6', '#cf8e9a'], d: 'Conjunto de tricô macio com cardigã e saia.', dia: 8 },
    { id: 'demo-8', nome: 'Calça pantalona linho', marca: 'Atelier Violette', categoria: 'Calças', tamanho: '40', cor: 'Areia', preco: 259, custo: 90, c: ['#e3d5bf', '#c2ac88'], d: 'Pantalona em linho com cintura alta e caimento leve.', dia: 9 },
    { id: 'demo-9', nome: 'Vestido longo bordado', marca: 'Casa Lumière', categoria: 'Vestidos', tamanho: 'M', cor: 'Vinho', preco: 690, custo: 260, c: ['#a45a6e', '#6b2f42'], d: 'Vestido de festa com bordados delicados.', dia: 10 },
  ];

  const produtos = base.map((p) => ({
    id: p.id,
    nome: p.nome,
    marca: p.marca,
    categoria: p.categoria,
    tamanho: p.tamanho,
    cor: p.cor,
    preco: p.preco,
    custo: p.custo,
    descricao: p.d,
    fotos: [placeholder(p.c[0], p.c[1], p.marca, p.nome)],
    status: p.id === 'demo-6' ? 'reservado' : p.id === 'demo-9' ? 'vendido' : 'disponivel',
    created_at: dias(p.dia),
  }));

  const item = (id) => {
    const p = produtos.find((x) => x.id === id);
    return { id: p.id, nome: p.nome, marca: p.marca, tamanho: p.tamanho, cor: p.cor, preco: p.preco, custo: p.custo, fotos: p.fotos };
  };

  const pedidos = [
    { id: 'ped-demo-1', codigo: 'A1B2', cliente_nome: 'Camila Duarte', itens: [item('demo-6')], total: 349, status: 'aberto', created_at: dias(0.2) },
    { id: 'ped-demo-2', codigo: 'C3D4', cliente_nome: 'Fernanda Lima', itens: [item('demo-9')], total: 690, status: 'concluido', created_at: dias(6) },
  ];

  const hoje = new Date().toISOString().slice(0, 10);
  const lancamentos = [
    { id: 'lan-demo-1', tipo: 'receita', descricao: 'Venda - pedido #C3D4 (Fernanda Lima)', valor: 690, data: hoje, pedido_id: 'ped-demo-2', created_at: dias(5) },
    { id: 'lan-demo-2', tipo: 'despesa', descricao: 'Embalagens e sacolas', valor: 85, data: hoje, pedido_id: null, created_at: dias(4) },
  ];

  const config = [{ ...CONFIG_PADRAO, whatsapp: '5561999999999', instagram: 'renatamoura.brecho', created_at: dias(10) }];

  return { produtos, pedidos, lancamentos, config };
}

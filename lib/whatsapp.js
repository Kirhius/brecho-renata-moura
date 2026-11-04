import { brl } from './format.js';

export function montarMensagem({ nome, codigo, itens, total, origem = '' }) {
  const linhas = [`Olá, Renata! Sou ${nome} e reservei estas peças no catálogo:`, ''];
  itens.forEach((it, i) => {
    linhas.push(`*${i + 1}. ${it.nome}*`);
    const det = [it.marca, it.tamanho && `Tam. ${it.tamanho}`, it.cor].filter(Boolean).join(' · ');
    if (det) linhas.push(det);
    linhas.push(brl(it.preco));
    let foto = it.fotos && it.fotos[0];
    // fotos de exemplo ficam no proprio site (caminho relativo): vira link completo
    if (foto && foto.startsWith('/') && origem) foto = origem + foto;
    if (foto && /^https?:\/\//i.test(foto)) linhas.push(foto);
    linhas.push('');
  });
  linhas.push(`*Total: ${brl(total)}*`);
  linhas.push(`Pedido #${codigo}`);
  return linhas.join('\n');
}

export function linkWhatsapp(numero, mensagem) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

// Abre a folha de compartilhamento do celular com as fotos anexadas (o usuario escolhe o WhatsApp)
export async function compartilharFotos(itens, texto) {
  const arquivos = [];
  for (const it of itens.slice(0, 6)) {
    const src = it.fotos && it.fotos[0];
    if (!src) continue;
    try {
      const r = await fetch(src);
      const b = await r.blob();
      const tipo = b.type && b.type.startsWith('image/') ? b.type : 'image/jpeg';
      const nome = (it.nome || 'peca').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) || 'peca';
      arquivos.push(new File([b], `${nome}.jpg`, { type: tipo }));
    } catch {
      /* ignora foto que nao carregou */
    }
  }
  if (!arquivos.length) return { ok: false, motivo: 'sem-fotos' };
  if (!navigator.canShare || !navigator.canShare({ files: arquivos })) {
    return { ok: false, motivo: 'nao-suportado' };
  }
  try {
    await navigator.share({ files: arquivos, text: texto });
    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: e && e.name === 'AbortError' ? 'cancelado' : 'erro' };
  }
}

// A lista `fotos` de cada peca guarda fotos E videos (mesma coluna, sem mudar o banco).
// O tipo e reconhecido pela extensao do arquivo.

export const MAX_MIDIAS = 8;
export const MAX_VIDEOS = 2;
export const MAX_SEGUNDOS_VIDEO = 20;

export function ehVideo(url) {
  const u = String(url || '');
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u) || u.startsWith('data:video/');
}

export const soImagens = (lista) => (lista || []).filter((u) => u && !ehVideo(u));
export const soVideos = (lista) => (lista || []).filter((u) => u && ehVideo(u));

// Capa = primeira FOTO (nunca um video)
export const capaDe = (lista) => soImagens(lista)[0] || null;

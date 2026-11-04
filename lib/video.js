// Prepara videos no proprio aparelho (somente navegador).
//
// Videos de iPhone costumam ser HEVC (.mov), que nem todo navegador/celular toca, e sao pesados.
// Aqui o video e reproduzido (sem som), redesenhado em tamanho menor e regravado em H.264/MP4
// (ou WebM onde o MP4 nao existir) com taxa de bits baixa. Resultado: arquivo leve e que toca em
// iPhone e Android. O processo roda em tempo real (video de 10 s leva cerca de 10 s).

import { MAX_SEGUNDOS_VIDEO } from './midia.js';

export const LIMITE_BYTES_VIDEO = 4 * 1024 * 1024 + 200 * 1024; // cabe no limite de 4,5 MB da Vercel

const CANDIDATOS = [
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4;codecs=avc1',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
];

export function escolherFormato() {
  if (typeof MediaRecorder === 'undefined') return null;
  if (typeof HTMLCanvasElement === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return null;
  return CANDIDATOS.find((m) => MediaRecorder.isTypeSupported(m)) || null;
}

const limitar = (v, min, max) => Math.max(min, Math.min(max, v));

export async function comprimirVideo(
  file,
  { maxLado = 960, maxSeg = MAX_SEGUNDOS_VIDEO, orcamentoBytes = 3.4 * 1024 * 1024, onProgresso } = {}
) {
  const mime = escolherFormato();
  if (!mime) {
    throw new Error('Este navegador não consegue preparar vídeos. Use o Safari ou o Chrome atualizados.');
  }

  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.preload = 'auto';
  video.src = url;
  // fica no documento (iPhone so decodifica video "presente"), mas invisivel
  Object.assign(video.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '2px',
    height: '2px',
    opacity: '0.01',
    pointerEvents: 'none',
  });
  document.body.appendChild(video);

  let stream;
  try {
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = () =>
        reject(new Error('Não consegui ler este vídeo neste aparelho. Tente gravar de novo ou escolher outro.'));
    });

    const dur = video.duration;
    if (!Number.isFinite(dur) || dur <= 0) throw new Error('Não consegui ler a duração do vídeo.');
    if (dur > maxSeg + 0.5) {
      throw new Error(`Vídeo muito longo (${Math.round(dur)} s). Use no máximo ${maxSeg} segundos.`);
    }

    const vw = video.videoWidth || 720;
    const vh = video.videoHeight || 1280;
    const esc = Math.min(1, maxLado / Math.max(vw, vh));
    const w = Math.max(2, Math.round((vw * esc) / 2) * 2);
    const h = Math.max(2, Math.round((vh * esc) / 2) * 2);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    const bps = limitar(Math.floor((orcamentoBytes * 8 * 0.85) / dur), 400000, 1500000);
    stream = canvas.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bps });
    const pedacos = [];
    rec.ondataavailable = (e) => e.data && e.data.size && pedacos.push(e.data);
    const parou = new Promise((resolve) => {
      rec.onstop = resolve;
    });

    let ativo = true;
    const desenhar = () => {
      if (!ativo) return;
      ctx.drawImage(video, 0, 0, w, h);
      if (onProgresso) onProgresso(Math.min(99, Math.round((video.currentTime / dur) * 100)));
      if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(desenhar);
      else requestAnimationFrame(desenhar);
    };

    rec.start(1000);
    video.currentTime = 0;
    const terminou = new Promise((resolve, reject) => {
      video.onended = resolve;
      video.onerror = () => reject(new Error('O vídeo parou de tocar durante o preparo. Tente de novo.'));
      setTimeout(() => reject(new Error('O preparo do vídeo demorou demais. Tente um vídeo menor.')), dur * 2000 + 20000);
    });
    await video.play();
    desenhar();
    await terminou;

    ativo = false;
    ctx.drawImage(video, 0, 0, w, h);
    await new Promise((r) => setTimeout(r, 250)); // deixa o ultimo quadro entrar na gravacao
    rec.stop();
    await parou;

    const blob = new Blob(pedacos, { type: mime.split(';')[0] });
    if (blob.size < 2000) throw new Error('Falha ao preparar o vídeo. Tente de novo.');
    if (blob.size > LIMITE_BYTES_VIDEO) {
      throw new Error('O vídeo ficou pesado demais. Use um trecho mais curto (até 10 segundos funciona melhor).');
    }
    if (onProgresso) onProgresso(100);
    return blob;
  } finally {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    video.pause();
    video.removeAttribute('src');
    video.remove();
    URL.revokeObjectURL(url);
  }
}

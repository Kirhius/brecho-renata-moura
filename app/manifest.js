export default function manifest() {
  return {
    name: 'Renata Moura | Brechó de Grife',
    short_name: 'Renata Moura',
    description: 'Catálogo de peças femininas de grife. Reserve e finalize pelo WhatsApp.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fdf1f4',
    theme_color: '#fdf1f4',
    lang: 'pt-BR',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

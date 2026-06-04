import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OusaBolão',
    short_name: 'OusaBolão',
    description: 'O Bolão dos Parças — Copa do Mundo 2026',
    start_url: '/inicio',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F6F5F1',
    theme_color: '#C8881E',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}

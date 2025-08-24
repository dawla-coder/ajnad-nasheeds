import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ajnad Nasheeds - Islamic Nasheeds by Ajnad Media',
    short_name: 'Ajnad Nasheeds',
    description: 'Listen to authentic Islamic nasheeds by Ajnad Media and Al-Ajnad Foundation for Media Production.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#1a1a1a',
    orientation: 'portrait',
    categories: ['music', 'entertainment', 'religion'],
    lang: 'en',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}

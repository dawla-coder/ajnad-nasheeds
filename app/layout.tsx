import type { Metadata } from 'next'
import './globals.css'
import { Cairo } from 'next/font/google'
import StructuredData from '../src/components/StructuredData'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400','600','700'],
  variable: '--font-cairo'
})

export const metadata: Metadata = {
  title: 'Ajnad Nasheeds | Islamic Nasheeds by Ajnad Media | Al-Ajnad Foundation',
  description: 'Listen to authentic Islamic nasheeds by Ajnad Media and Al-Ajnad Foundation for Media Production. High-quality Islamic state nasheeds, anasheed, and Islamic songs for spiritual enrichment.',
  keywords: [
    'Ajnad Media',
    'Ajnad Nasheed',
    'Islamic Nasheed',
    'Islamic State',
    'Al-Ajnad Foundation',
    'Anasheed',
    'Islamic Songs',
    'Islamic Music',
    'Nasheed Collection',
    'Islamic Audio',
    'Religious Songs',
    'Arabic Nasheeds'
  ],
  authors: [{ name: 'Al-Ajnad Foundation for Media Production' }],
  creator: 'Ajnad Media',
  publisher: 'Al-Ajnad Foundation',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ajnad-nasheeds.vercel.app'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
      'ar': '/ar',
    },
  },
  openGraph: {
    title: 'Ajnad Nasheeds | Islamic Nasheeds by Ajnad Media',
    description: 'Listen to authentic Islamic nasheeds by Ajnad Media and Al-Ajnad Foundation for Media Production. High-quality Islamic state nasheeds and anasheed.',
    url: 'https://ajnad-nasheeds.vercel.app',
    siteName: 'Ajnad Nasheeds',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ajnad Nasheeds - Islamic Nasheeds Collection',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ajnad Nasheeds | Islamic Nasheeds by Ajnad Media',
    description: 'Listen to authentic Islamic nasheeds by Ajnad Media and Al-Ajnad Foundation for Media Production.',
    images: ['/twitter-image.jpg'],
    creator: '@AjnadMedia',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

// Run all server-rendered routes on the Edge runtime (required by Cloudflare Pages SSR)
export const runtime = 'edge'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <StructuredData type="website" />
      </head>
      <body className={`${cairo.variable}`}>{children}</body>
    </html>
  )
}

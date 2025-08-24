import type { Metadata } from 'next'
import './globals.css'
import { Cairo } from 'next/font/google'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400','600','700'],
  variable: '--font-cairo'
})

export const metadata: Metadata = {
  title: 'Ajnad Nasheeds',
  description: 'Stream and organize Nasheeds powered by Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${cairo.variable}`}>{children}</body>
    </html>
  )
}

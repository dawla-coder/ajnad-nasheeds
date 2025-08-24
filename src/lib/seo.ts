export const seoConfig = {
  siteName: 'Ajnad Nasheeds',
  siteUrl: 'https://ajnad-nasheeds.vercel.app',
  defaultTitle: 'Ajnad Nasheeds | Islamic Nasheeds by Ajnad Media | Al-Ajnad Foundation',
  defaultDescription: 'Listen to authentic Islamic nasheeds by Ajnad Media and Al-Ajnad Foundation for Media Production. High-quality Islamic state nasheeds, anasheed, and Islamic songs for spiritual enrichment.',
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
    'Arabic Nasheeds',
    'Islamic Chants',
    'Religious Music',
    'Spiritual Songs'
  ],
  author: 'Al-Ajnad Foundation for Media Production',
  creator: 'Ajnad Media',
  publisher: 'Al-Ajnad Foundation',
  twitterHandle: '@AjnadMedia',
  socialMedia: {
    twitter: 'https://twitter.com/AjnadMedia',
    telegram: 'https://t.me/AjnadMedia',
  },
  languages: ['en', 'ar'],
  defaultLocale: 'en',
}

export function generatePageMetadata({
  title,
  description,
  path = '',
  image,
  noIndex = false,
}: {
  title?: string
  description?: string
  path?: string
  image?: string
  noIndex?: boolean
}) {
  const fullTitle = title 
    ? `${title} | ${seoConfig.siteName}`
    : seoConfig.defaultTitle
  
  const fullDescription = description || seoConfig.defaultDescription
  const fullUrl = `${seoConfig.siteUrl}${path}`
  const fullImage = image || '/og-image.jpg'

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: seoConfig.keywords,
    authors: [{ name: seoConfig.author }],
    creator: seoConfig.creator,
    publisher: seoConfig.publisher,
    metadataBase: new URL(seoConfig.siteUrl),
    alternates: {
      canonical: path || '/',
      languages: {
        'en-US': `/en-US${path}`,
        'ar': `/ar${path}`,
      },
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: fullUrl,
      siteName: seoConfig.siteName,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [fullImage],
      creator: seoConfig.twitterHandle,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

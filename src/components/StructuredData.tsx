import Script from 'next/script'

interface StructuredDataProps {
  type?: 'website' | 'musicGroup' | 'audioObject'
  title?: string
  description?: string
  url?: string
  audioUrl?: string
  duration?: string
}

export default function StructuredData({ 
  type = 'website',
  title,
  description,
  url,
  audioUrl,
  duration 
}: StructuredDataProps) {
  const getStructuredData = () => {
    const baseData = {
      "@context": "https://schema.org",
      "@type": type === 'website' ? 'WebSite' : type === 'musicGroup' ? 'MusicGroup' : 'AudioObject',
      "name": title || "Ajnad Nasheeds | Islamic Nasheeds by Ajnad Media",
      "description": description || "Listen to authentic Islamic nasheeds by Ajnad Media and Al-Ajnad Foundation for Media Production. High-quality Islamic state nasheeds, anasheed, and Islamic songs for spiritual enrichment.",
      "url": url || "https://ajnad-nasheeds.vercel.app",
      "publisher": {
        "@type": "Organization",
        "name": "Al-Ajnad Foundation for Media Production",
        "alternateName": "Ajnad Media"
      },
      "keywords": [
        "Ajnad Media",
        "Ajnad Nasheed", 
        "Islamic Nasheed",
        "Islamic State",
        "Al-Ajnad Foundation",
        "Anasheed",
        "Islamic Songs",
        "Islamic Music",
        "Nasheed Collection",
        "Islamic Audio",
        "Religious Songs",
        "Arabic Nasheeds"
      ],
      "genre": "Islamic Music",
      "inLanguage": ["ar", "en"]
    }

    if (type === 'website') {
      return {
        ...baseData,
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://ajnad-nasheeds.vercel.app/?search={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    }

    if (type === 'musicGroup') {
      return {
        ...baseData,
        "@type": "MusicGroup",
        "genre": "Islamic Music",
        "foundingDate": "2014",
        "foundingLocation": {
          "@type": "Place",
          "name": "Middle East"
        }
      }
    }

    if (type === 'audioObject' && audioUrl) {
      return {
        ...baseData,
        "@type": "AudioObject",
        "contentUrl": audioUrl,
        "duration": duration,
        "encodingFormat": "audio/mpeg",
        "genre": "Islamic Music",
        "inLanguage": "ar"
      }
    }

    return baseData
  }

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getStructuredData()),
      }}
    />
  )
}

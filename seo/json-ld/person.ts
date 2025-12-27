import { SITE_URL, SITE_AUTHOR, SITE_DESCRIPTION, SOCIAL_URLS } from '@/seo/constants'

/**
 * JSON-LD Person schema type.
 * @see https://schema.org/Person
 */
export type JsonLdPerson = {
  '@context': string
  '@type': string
  name: string
  jobTitle: string
  description: string
  image: string
  url: string
  sameAs: string[]
}

/**
 * Generates JSON-LD structured data for the site owner as a Person.
 * Used on the home page to represent Michael Uloth.
 * @see https://schema.org/Person
 */
export function generatePersonJsonLd(): JsonLdPerson {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE_AUTHOR,
    jobTitle: 'Software Engineer',
    description: SITE_DESCRIPTION,
    image: 'https://res.cloudinary.com/ooloth/image/upload/v1645057009/mu/michael-landscape.jpg',
    url: SITE_URL,
    sameAs: [SOCIAL_URLS.github, SOCIAL_URLS.linkedin, SOCIAL_URLS.twitter, SOCIAL_URLS.youtube],
  }
}

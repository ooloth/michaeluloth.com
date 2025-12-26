import { describe, it, expect } from 'vitest'
import { generatePersonJsonLd } from './person'

describe('generatePersonJsonLd', () => {
  it('generates correct JSON-LD structure with all required fields', () => {
    const jsonLd = generatePersonJsonLd()

    expect(jsonLd).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Michael Uloth',
      jobTitle: 'Software Engineer',
      description: 'Software engineer helping scientists discover new medicines at Recursion.',
      image: 'https://res.cloudinary.com/ooloth/image/upload/v1645057009/mu/michael-landscape.jpg',
      url: 'https://michaeluloth.com/',
      sameAs: [
        'https://github.com/ooloth',
        'https://www.linkedin.com/in/michaeluloth',
        'https://x.com/ooloth',
        'https://youtube.com/michaeluloth',
      ],
    })
  })

  it('includes correct Schema.org context and type', () => {
    const jsonLd = generatePersonJsonLd()

    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd['@type']).toBe('Person')
  })

  it('includes person name', () => {
    const jsonLd = generatePersonJsonLd()

    expect(jsonLd.name).toBe('Michael Uloth')
  })

  it('includes job title', () => {
    const jsonLd = generatePersonJsonLd()

    expect(jsonLd.jobTitle).toBe('Software Engineer')
  })

  it('includes description', () => {
    const jsonLd = generatePersonJsonLd()

    expect(jsonLd.description).toBe('Software engineer helping scientists discover new medicines at Recursion.')
  })

  it('includes profile image URL', () => {
    const jsonLd = generatePersonJsonLd()

    expect(jsonLd.image).toBe('https://res.cloudinary.com/ooloth/image/upload/v1645057009/mu/michael-landscape.jpg')
  })

  it('includes website URL', () => {
    const jsonLd = generatePersonJsonLd()

    expect(jsonLd.url).toBe('https://michaeluloth.com/')
  })

  it('includes social profile URLs in sameAs array', () => {
    const jsonLd = generatePersonJsonLd()

    expect(jsonLd.sameAs).toEqual([
      'https://github.com/ooloth',
      'https://www.linkedin.com/in/michaeluloth',
      'https://x.com/ooloth',
      'https://youtube.com/michaeluloth',
    ])
  })

  it('sameAs includes GitHub profile', () => {
    const jsonLd = generatePersonJsonLd()

    expect(jsonLd.sameAs).toContain('https://github.com/ooloth')
  })

  it('sameAs includes LinkedIn profile', () => {
    const jsonLd = generatePersonJsonLd()

    expect(jsonLd.sameAs).toContain('https://www.linkedin.com/in/michaeluloth')
  })

  it('sameAs includes Twitter profile', () => {
    const jsonLd = generatePersonJsonLd()

    expect(jsonLd.sameAs).toContain('https://x.com/ooloth')
  })

  it('sameAs includes YouTube channel', () => {
    const jsonLd = generatePersonJsonLd()

    expect(jsonLd.sameAs).toContain('https://youtube.com/michaeluloth')
  })
})

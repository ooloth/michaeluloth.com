/**
 * Generates the default OG image (1200x630px) with:
 * - Dark background (zinc-900: #18181b)
 * - Photo from Cloudinary
 * - "Michael Uloth" in Inter font
 * - Accent color (#ff98a4) for visual interest
 *
 * Run: npx tsx metadata/generate-og-image.ts
 * Output: public/og-image.png
 */

import satori from 'satori'
import sharp from 'sharp'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

// Use Cloudinary face detection (g_face) to center the crop on your face
const PHOTO_URL =
  'https://res.cloudinary.com/ooloth/image/upload/c_fill,w_640,h_640,g_face/v1645057009/mu/michael-landscape.jpg'
const ZINC_900 = '#18181b'
const ACCENT = '#ff98a4'

async function fetchFont() {
  const fontPath = join(process.cwd(), 'metadata', 'fonts', 'Inter-Bold.ttf')
  return await readFile(fontPath)
}

async function fetchPhoto() {
  const response = await fetch(PHOTO_URL)
  const buffer = await response.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  return `data:image/jpeg;base64,${base64}`
}

async function generateOgImage() {
  console.log('Fetching Inter font...')
  const fontData = await fetchFont()

  console.log('Fetching photo from Cloudinary...')
  const photoBase64 = await fetchPhoto()

  console.log('Generating OG image with satori...')
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: ZINC_900,
          padding: '80px',
        },
        children: [
          // Text section
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '72px',
                      fontWeight: 700,
                      color: 'white',
                      lineHeight: 1.2,
                    },
                    children: 'Michael Uloth',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      width: '100px',
                      height: '6px',
                      backgroundColor: ACCENT,
                      borderRadius: '3px',
                    },
                  },
                },
              ],
            },
          },
          // Photo section
          {
            type: 'img',
            props: {
              src: photoBase64,
              width: 300,
              height: 300,
              style: {
                borderRadius: '150px',
                objectFit: 'cover',
              },
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    },
  )

  console.log('Converting SVG to PNG with sharp...')
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer()

  const outputPath = join(process.cwd(), 'public', 'og-image.png')
  await writeFile(outputPath, pngBuffer)

  console.log(`✅ OG image generated: ${outputPath}`)
}

generateOgImage().catch(error => {
  console.error('❌ Failed to generate OG image:', error)
  process.exit(1)
})

import { generateText, gateway, Output } from 'ai'
import { z } from 'zod'

const liveAIEnabled = process.env.AI_MODE === 'live' || process.env.VERCEL === '1'

const analysisSchema = z.object({
  productName: z.string().min(1).max(80),
  category: z.string().min(1).max(80),
  materials: z.array(z.string().max(40)).max(5),
  dominantColors: z.array(z.string().max(40)).max(5),
  productSummary: z.string().min(1).max(260),
  preservationNotes: z.string().min(1).max(260),
})

const directionSchema = z.object({
  id: z.string().min(1).max(40),
  title: z.string().min(1).max(50),
  description: z.string().min(1).max(160),
  visualDirection: z.string().min(1).max(180),
  palette: z.array(z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)).length(2),
  mood: z.string().min(1).max(30),
})

const demoDirections = [
  {
    id: 'quiet-luxury',
    title: 'Quiet luxury',
    description: 'A softly lit, tactile studio scene with a considered premium feel.',
    visualDirection: 'Warm stone, directional window light and restrained styling.',
    palette: ['#f2e8d9', '#d9c8ae'],
    mood: 'Premium',
  },
  {
    id: 'clean-commerce',
    title: 'Clean commerce',
    description: 'A crisp, confident packshot that puts the product first.',
    visualDirection: 'Soft ivory seamless, balanced daylight and a subtle grounded shadow.',
    palette: ['#f4f1e8', '#dce1d1'],
    mood: 'Minimal',
  },
  {
    id: 'sunlit-lifestyle',
    title: 'Sunlit lifestyle',
    description: 'An inviting, lived-in moment with warm natural light.',
    visualDirection: 'Late-afternoon sun, gentle organic shapes and a calm home setting.',
    palette: ['#ecd9c5', '#d7dfc9'],
    mood: 'Lifestyle',
  },
  {
    id: 'editorial-pop',
    title: 'Editorial pop',
    description: 'A playful campaign frame with bold color and confident contrast.',
    visualDirection: 'A chartreuse accent, sculptural backdrop and punchy editorial lighting.',
    palette: ['#d9e89a', '#f0d4a8'],
    mood: 'Editorial',
  },
]

export async function analyzeProductImage({ image, mediaType, demoLabel }) {
  if (!liveAIEnabled) {
    return {
      productName: demoLabel,
      category: 'Not analyzed in demo mode',
      materials: [],
      dominantColors: [],
      productSummary: 'Your image is ready to style. Live image understanding is not enabled in this demo.',
      preservationNotes: 'The demo preview keeps your original image intact.',
    }
  }

  const result = await generateText({
    model: gateway('google/gemini-3-flash'),
    output: Output.object({ schema: analysisSchema }),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this ecommerce product photo for an image-to-image photography workflow. Identify only visual facts supported by the image. Return a concise product name, category, visible material cues, dominant color names, a short neutral summary, and strict preservation notes. Never invent brand text or unseen features.',
          },
          { type: 'image', image, mediaType },
        ],
      },
    ],
  })

  return result.output
}

export async function generateSuggestions(analysis) {
  if (!liveAIEnabled) {
    return demoDirections
  }

  const result = await generateText({
    model: gateway('google/gemini-3-flash'),
    output: Output.array({ element: directionSchema, minItems: 4, maxItems: 4 }),
    prompt: `Create exactly four distinct, practical product photography directions based on this image analysis. Avoid asking the user to write a prompt. Each direction must preserve the exact product, silhouette, color, labels, and details. Use different art direction approaches (premium studio, clean ecommerce, lifestyle, editorial) only when suitable. Return concise user-facing titles and explanations, a concrete visual direction, two CSS-compatible color values for a preview palette, and a short mood label. Analysis: ${JSON.stringify(analysis)}`,
  })

  return result.output
}

export async function generateProductImage({ image, mediaType, direction, variation }) {
  if (!liveAIEnabled) {
    return null
  }

  const result = await generateText({
    model: gateway('google/gemini-3.1-flash-image'),
    providerOptions: {
      google: { responseModalities: ['TEXT', 'IMAGE'] },
    },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Create a professional image-to-image ecommerce product photograph using the uploaded image as the product reference. Product must remain the same exact object: preserve silhouette, proportions, materials, color, logo, labels and all legible details. Do not add text, objects, or redesign packaging. Change only the scene, lighting, and surface. Apply this art direction: ${direction.title}. ${direction.visualDirection}. Mood: ${direction.mood}. Variation seed description: ${variation}. Return only the finished image.`,
          },
          { type: 'image', image, mediaType },
        ],
      },
    ],
    maxRetries: 0,
  })

  const generatedImage = result.files.find((file) => file.mediaType.startsWith('image/'))
  if (!generatedImage) {
    throw new Error('The image model did not return an image.')
  }

  return {
    bytes: generatedImage.uint8Array,
    mediaType: generatedImage.mediaType,
  }
}

export function getDemoDirections() {
  return demoDirections
}

export function getAnalysisSchema() {
  return analysisSchema
}

export function getDirectionSchema() {
  return directionSchema
}

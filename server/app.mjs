import express from 'express'
import multer from 'multer'
import { z } from 'zod'
import {
  analyzeProductImage,
  generateProductImage,
  generateSuggestions,
  getAnalysisSchema,
  getDemoDirections,
  getDirectionSchema,
} from './ai.mjs'
import { storageMode, storeObject } from './storage.mjs'

const app = express()
const maxUploadSize = 4 * 1024 * 1024
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const useLiveAI = process.env.AI_MODE === 'live' || process.env.VERCEL === '1'
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadSize, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      callback(new Error('Please upload a JPG, PNG, or WebP image.'))
      return
    }
    callback(null, true)
  },
})

function hasValidImageSignature(file) {
  const bytes = file.buffer
  if (file.mimetype === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (file.mimetype === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (file.mimetype === 'image/webp') return bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  return false
}

app.disable('x-powered-by')
app.use(express.json({ limit: '32kb' }))

app.get('/api/health', (_request, response) => {
  response.json({ mode: useLiveAI ? 'live' : 'demo', storage: storageMode() })
})

app.post('/api/analyze', upload.single('image'), async (request, response) => {
  if (!request.file) {
    response.status(400).json({ error: 'Choose a JPG, PNG, or WebP image to continue.' })
    return
  }
  if (!hasValidImageSignature(request.file)) {
    response.status(415).json({ error: 'The uploaded file does not match its image type. Choose a valid JPG, PNG, or WebP image.' })
    return
  }

  try {
    const file = request.file
    await storeObject({ bytes: file.buffer, mediaType: file.mimetype, purpose: 'originals' })
    const demoLabel = file.originalname
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .trim()
      .slice(0, 60) || 'Your product'
    const analysis = await analyzeProductImage({
      image: file.buffer,
      mediaType: file.mimetype,
      demoLabel,
    })

    response.json({ analysis: { ...analysis, mode: useLiveAI ? 'live' : 'demo' }, mode: useLiveAI ? 'live' : 'demo' })
  } catch {
    response.status(502).json({ error: 'We could not analyze this image right now. Please try again.' })
  }
})

app.post('/api/suggestions', async (request, response) => {
  const parsed = getAnalysisSchema().safeParse(request.body?.analysis)
  if (!parsed.success) {
    response.status(400).json({ error: 'The product analysis is incomplete. Upload the image again to restart.' })
    return
  }

  try {
    const suggestions = useLiveAI
      ? await generateSuggestions(parsed.data)
      : getDemoDirections()
    response.json({ suggestions, mode: useLiveAI ? 'live' : 'demo' })
  } catch {
    response.status(502).json({ error: 'Creative directions could not be prepared. Please try again.' })
  }
})

app.post('/api/generate', upload.single('image'), async (request, response) => {
  if (!request.file) {
    response.status(400).json({ error: 'Choose a product image before generating.' })
    return
  }
  if (!hasValidImageSignature(request.file)) {
    response.status(415).json({ error: 'The uploaded file does not match its image type. Choose a valid JPG, PNG, or WebP image.' })
    return
  }

  let directionValue
  try {
    directionValue = JSON.parse(request.body?.direction ?? '')
  } catch {
    response.status(400).json({ error: 'Choose a creative direction before generating.' })
    return
  }

  const direction = getDirectionSchema().safeParse(directionValue)
  const variation = z.string().max(80).optional().safeParse(request.body?.variation)
  if (!direction.success || !variation.success) {
    response.status(400).json({ error: 'That creative direction is no longer available. Choose it again to continue.' })
    return
  }

  try {
    const file = request.file
    await storeObject({ bytes: file.buffer, mediaType: file.mimetype, purpose: 'originals' })
    const generated = await generateProductImage({
      image: file.buffer,
      mediaType: file.mimetype,
      direction: direction.data,
      variation: variation.data || 'first variation',
    })

    if (!generated) {
      response.json({ mode: 'demo', stored: false })
      return
    }

    await storeObject({ bytes: generated.bytes, mediaType: generated.mediaType, purpose: 'generated' })
    response.json({
      mode: 'live',
      stored: true,
      imageDataUrl: `data:${generated.mediaType};base64,${Buffer.from(generated.bytes).toString('base64')}`,
    })
  } catch {
    response.status(502).json({ error: 'Image generation did not finish. Try again or choose another direction.' })
  }
})

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    response.status(413).json({ error: 'This image is over 4 MB. Choose a smaller file to continue.' })
    return
  }
  if (error instanceof multer.MulterError) {
    response.status(400).json({ error: 'Choose one JPG, PNG, or WebP image at a time.' })
    return
  }
  if (error?.message === 'Please upload a JPG, PNG, or WebP image.') {
    response.status(415).json({ error: error.message })
    return
  }
  response.status(500).json({ error: 'Something went wrong on the server. Please try again.' })
})

export default app

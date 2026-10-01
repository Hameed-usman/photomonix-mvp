import type {
  AnalysisResponse,
  CreativeDirection,
  GenerationResponse,
  ProductAnalysis,
  SuggestionResponse,
} from '../types'

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(path, init)
  } catch {
    throw new Error('Could not reach the Photomonix server. Check your connection and try again.')
  }

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      typeof payload.error === 'string'
        ? payload.error
        : 'Something went wrong. Please try again.',
    )
  }

  return payload as T
}

export function analyzeProduct(file: File) {
  const body = new FormData()
  body.append('image', file)
  return request<AnalysisResponse>('/api/analyze', { method: 'POST', body })
}

export function getSuggestions(analysis: ProductAnalysis) {
  return request<SuggestionResponse>('/api/suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis }),
  })
}

export function generateProduct(file: File, direction: CreativeDirection, variation = 0) {
  const body = new FormData()
  body.append('image', file)
  body.append('direction', JSON.stringify(direction))
  body.append('variation', String(variation))
  return request<GenerationResponse>('/api/generate', { method: 'POST', body })
}

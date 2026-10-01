export type AppMode = 'demo' | 'live'

export type ProductAnalysis = {
  productName: string
  category: string
  materials: string[]
  dominantColors: string[]
  productSummary: string
  preservationNotes: string
  mode: AppMode
}

export type CreativeDirection = {
  id: string
  title: string
  description: string
  visualDirection: string
  palette: string[]
  mood: string
}

export type AnalysisResponse = {
  analysis: ProductAnalysis
  mode: AppMode
}

export type SuggestionResponse = {
  suggestions: CreativeDirection[]
  mode: AppMode
}

export type GenerationResponse = {
  mode: AppMode
  imageDataUrl?: string
  stored: boolean
}

export type WorkspaceStep = 'upload' | 'analysis' | 'suggestions' | 'generating' | 'result'

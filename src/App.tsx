import { useState } from 'react'
import { ArrowUpRight, Check, CircleHelp, Flower2, Sparkles, X } from 'lucide-react'
import { AnalysisStage } from './components/AnalysisStage'
import { ResultStage } from './components/ResultStage'
import { StepProgress } from './components/StepProgress'
import { SuggestionStage } from './components/SuggestionStage'
import { UploadStage } from './components/UploadStage'
import { analyzeProduct, generateProduct, getSuggestions } from './lib/api'
import { renderDemoPreview } from './lib/demoPreview'
import type { AppMode, CreativeDirection, ProductAnalysis, WorkspaceStep } from './types'

const maxUploadBytes = 4 * 1024 * 1024
const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export default function App() {
  const [step, setStep] = useState<WorkspaceStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null)
  const [suggestions, setSuggestions] = useState<CreativeDirection[]>([])
  const [selectedDirection, setSelectedDirection] = useState<CreativeDirection | null>(null)
  const [mode, setMode] = useState<AppMode | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [comparison, setComparison] = useState(50)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [generationCount, setGenerationCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function prepareSuggestions(productAnalysis: ProductAnalysis) {
    setSuggestionsLoading(true)
    setError(null)
    try {
      const response = await getSuggestions(productAnalysis)
      setSuggestions(response.suggestions)
      setMode(response.mode)
    } catch (requestError) {
      setError(messageFor(requestError))
    } finally {
      setSuggestionsLoading(false)
    }
  }

  async function handleFile(fileToUpload: File) {
    setError(null)
    if (!supportedTypes.has(fileToUpload.type)) {
      setError('Please choose a JPG, PNG, or WebP image.')
      return
    }
    if (fileToUpload.size > maxUploadBytes) {
      setError('This image is over 4 MB. Choose a smaller file to continue.')
      return
    }

    setFile(fileToUpload)
    setImageUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl)
      return URL.createObjectURL(fileToUpload)
    })
    setAnalysis(null)
    setSuggestions([])
    setSelectedDirection(null)
    setResultUrl(null)
    setMode(null)
    setStep('analysis')

    try {
      const response = await analyzeProduct(fileToUpload)
      setAnalysis(response.analysis)
      setMode(response.mode)
      setStep('suggestions')
      await prepareSuggestions(response.analysis)
    } catch (requestError) {
      setStep('upload')
      setError(messageFor(requestError))
    }
  }

  async function handleGenerate(direction: CreativeDirection, variation = generationCount) {
    if (!file) return
    setError(null)
    setSelectedDirection(direction)
    setStep('generating')

    try {
      const response = await generateProduct(file, direction, variation)
      const nextResult = response.imageDataUrl || await renderDemoPreview(file, direction)
      setMode(response.mode)
      setResultUrl(nextResult)
      setComparison(50)
      setGenerationCount((count) => count + 1)
      setStep('result')
    } catch (requestError) {
      setStep('suggestions')
      setError(messageFor(requestError))
    }
  }

  function startOver() {
    setImageUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl)
      return null
    })
    setFile(null)
    setAnalysis(null)
    setSuggestions([])
    setSelectedDirection(null)
    setMode(null)
    setResultUrl(null)
    setComparison(50)
    setGenerationCount(0)
    setError(null)
    setStep('upload')
  }

  async function downloadResult() {
    if (!resultUrl) return
    try {
      const response = await fetch(resultUrl)
      const image = await response.blob()
      const downloadUrl = URL.createObjectURL(image)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `photomonix-${selectedDirection?.id || 'studio'}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(downloadUrl)
    } catch {
      setError('The image could not be downloaded. Please try again.')
    }
  }

  function retry() {
    if (step === 'suggestions' && analysis && suggestions.length === 0) {
      void prepareSuggestions(analysis)
    } else if (step === 'suggestions' && selectedDirection) {
      void handleGenerate(selectedDirection, Math.max(1, generationCount))
    } else if (file) {
      void handleFile(file)
    }
  }

  const displayedStep: WorkspaceStep = step === 'generating' ? 'generating' : step
  const canRetry = Boolean(file)

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Photomonix home">
          <span className="brand-mark"><Flower2 size={20} strokeWidth={1.8} /></span>
          <span>photo<span className="brand-accent">monix</span><sup>®</sup></span>
        </a>
        <nav className="topnav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#workflow">Studio</a>
        </nav>
        <a className="topbar-cta" href="#workflow">Open the studio <ArrowUpRight size={15} /></a>
      </header>

      <main id="top">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="hero-overline"><span className="hero-star"><Sparkles size={13} /></span> A BETTER KIND OF PRODUCT PHOTO</div>
            <h1 id="hero-title">Your product.<br /><em>In its best light.</em></h1>
            <p>From everyday photo to polished product story. No studio, no prompt-writing, just a direction that feels right.</p>
            <a className="button button--dark hero-button" href="#workflow">Make your first image <ArrowUpRight size={16} /></a>
            <div className="hero-reassurance"><span><Check size={14} /> No prompt needed</span><span><Check size={14} /> Made for product photos</span></div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-art__backdrop" />
            <img src="/images/studio-sample.png" alt="" />
            <div className="hero-art__label"><span className="hero-art__label-icon"><Sparkles size={15} /></span><span><strong>See the possibility</strong><small>A product, a point of view.</small></span></div>
            <div className="hero-art__index">01 <span>—</span> 04</div>
          </div>
          <div className="hero-side-note"><span className="hero-side-line" />AN AI PRODUCT PHOTO STUDIO</div>
        </section>

        <section className="workflow-section" id="workflow" aria-labelledby="workspace-title">
          <div className="container">
            <div className="workflow-heading">
              <div><div className="section-kicker">THE PHOTOMONIX WORKFLOW</div><h2 id="workspace-title">From upload to <em>unforgettable.</em></h2></div>
              <p>Five small steps.<br />One photo worth keeping.</p>
            </div>

            <div className="workspace panel">
              <div className="workspace-topline">
                <div className="workspace-title"><span className="workspace-title-mark"><Flower2 size={16} /></span><span>YOUR CREATIVE SPACE</span></div>
                <div className="workspace-indicator"><span className="status-dot" /> {mode === 'live' ? 'AI STUDIO' : mode === 'demo' ? 'DEMO WORKFLOW' : 'READY WHEN YOU ARE'}</div>
              </div>
              <StepProgress activeStep={displayedStep} />
              <div className="workspace-content" aria-live="polite">
                {step === 'upload' && <UploadStage onSelectFile={handleFile} />}
                {step === 'analysis' && imageUrl && file && <AnalysisStage imageUrl={imageUrl} fileName={file.name} fileSize={file.size} mode={mode} analysis={analysis} />}
                {step === 'suggestions' && <SuggestionStage analysis={analysis} suggestions={suggestions} selectedId={selectedDirection?.id ?? null} loading={suggestionsLoading} mode={mode} onSelect={(direction) => void handleGenerate(direction)} onRetry={() => analysis && void prepareSuggestions(analysis)} />}
                {step === 'generating' && selectedDirection && <GenerationStage direction={selectedDirection} imageUrl={imageUrl} mode={mode} />}
                {step === 'result' && imageUrl && resultUrl && selectedDirection && mode && (
                  <ResultStage originalUrl={imageUrl} resultUrl={resultUrl} direction={selectedDirection} mode={mode} comparison={comparison} onComparisonChange={setComparison} onGenerateAnother={() => void handleGenerate(selectedDirection, generationCount)} onDownload={() => void downloadResult()} onStartOver={startOver} />
                )}
              </div>
              {error && (
                <div className="error-banner" role="alert">
                  <CircleHelp size={17} /> <span>{error}</span>
                  {canRetry && <button className="error-retry" type="button" onClick={retry}>Try again</button>}
                  <button className="error-dismiss" type="button" onClick={() => setError(null)} aria-label="Dismiss error"><X size={16} /></button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="how-section container" id="how-it-works" aria-labelledby="how-heading">
          <div className="how-intro"><div className="section-kicker">GOOD PHOTOS, LESS FUSS</div><h2 id="how-heading">The creative work,<br /><em>without the busywork.</em></h2></div>
          <div className="how-steps">
            <HowStep number="01" title="Show us your product" copy="Upload the photo you already have. No special setup or studio shot needed." />
            <HowStep number="02" title="Pick a point of view" copy="Get a handful of thoughtful visual directions, then choose the one that fits." />
            <HowStep number="03" title="Make it yours" copy="Create a new image, compare it with your original, and download what you love." />
          </div>
        </section>
      </main>

      <footer className="footer container">
        <a className="brand brand--footer" href="#top"><span className="brand-mark"><Flower2 size={18} /></span><span>photo<span className="brand-accent">monix</span><sup>®</sup></span></a>
        <span>Thoughtful product imagery, made more accessible.</span>
        <a className="footer-top" href="#top">Back to top <ArrowUpRight size={14} /></a>
      </footer>
    </div>
  )
}

function GenerationStage({ direction, imageUrl, mode }: { direction: CreativeDirection; imageUrl: string | null; mode: AppMode | null }) {
  return (
    <section className="generation-stage" aria-labelledby="generation-heading" aria-live="polite">
      <div className="generation-image">
        {imageUrl && <img src={imageUrl} alt="Your product, ready for its new scene" />}
        <span className="generation-image__glow" />
        <span className="generation-sparkle generation-sparkle--one"><Sparkles size={16} /></span>
        <span className="generation-sparkle generation-sparkle--two"><Sparkles size={12} /></span>
      </div>
      <div className="generation-copy">
        <div className="eyebrow"><span className="eyebrow-dot" /> STEP 04 · IMAGE TO IMAGE</div>
        <h2 id="generation-heading">{mode === 'demo' ? 'Setting the scene.' : 'Making a little magic.'}</h2>
        <p className="stage-intro">{mode === 'demo' ? 'Preparing a clearly labeled studio composition preview.' : `Creating your ${direction.title.toLowerCase()} photograph. Keeping the details that make your product yours.`}</p>
        <div className="generation-status"><span className="generation-spinner" /> {mode === 'demo' ? 'Preparing demo preview' : 'Generating your product image'}</div>
        <div className="generation-selected"><span className="generation-selected__icon"><Check size={15} /></span><span><small>YOUR DIRECTION</small><strong>{direction.title}</strong></span></div>
      </div>
    </section>
  )
}

function HowStep({ number, title, copy }: { number: string; title: string; copy: string }) {
  return <article className="how-step"><span className="how-step__number">{number}</span><h3>{title}</h3><p>{copy}</p></article>
}

function messageFor(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

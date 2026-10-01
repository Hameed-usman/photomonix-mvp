import { Check, Eye, Image as ImageIcon, Palette, ScanSearch, Shapes } from 'lucide-react'
import type { AppMode, ProductAnalysis } from '../types'

export function AnalysisStage({
  imageUrl,
  fileName,
  fileSize,
  mode,
  analysis,
}: {
  imageUrl: string
  fileName: string
  fileSize: number
  mode: AppMode | null
  analysis: ProductAnalysis | null
}) {
  const isDemo = mode !== 'live'

  return (
    <section className="analysis-layout" aria-labelledby="analysis-heading">
      <div className="analysis-image panel">
        <img src={imageUrl} alt={`Your uploaded product photo: ${fileName}`} />
        <span className="image-corner-label"><ImageIcon size={13} /> ORIGINAL PHOTO</span>
      </div>
      <div className="analysis-content panel">
        <div className="eyebrow"><span className="eyebrow-dot" /> STEP 02 · PRODUCT UNDERSTANDING</div>
        <h2 id="analysis-heading">{mode === null ? 'Getting to know your product.' : 'A closer look.'}</h2>
        {mode === null ? (
          <p className="stage-intro">We&apos;re checking the details in your image before suggesting a creative direction.</p>
        ) : (
          <>
            <p className="stage-intro">{analysis?.productSummary}</p>
            <div className={`mode-note ${isDemo ? 'mode-note--demo' : 'mode-note--live'}`} role="status">
              <span className="mode-note__icon">{isDemo ? <Eye size={16} /> : <Check size={16} />}</span>
              <span>{isDemo ? 'Demo mode · This image has not been analyzed by an AI model.' : 'Image analysis complete · Details are grounded in your photo.'}</span>
            </div>
            <div className="analysis-facts">
              <div className="analysis-fact">
                <span className="analysis-fact__icon"><Shapes size={16} /></span>
                <div><span className="fact-label">PRODUCT</span><strong>{analysis?.productName || fileName}</strong></div>
              </div>
              <div className="analysis-fact">
                <span className="analysis-fact__icon"><ScanSearch size={16} /></span>
                <div><span className="fact-label">CATEGORY</span><strong>{isDemo ? 'Pending live analysis' : analysis?.category}</strong></div>
              </div>
              <div className="analysis-fact">
                <span className="analysis-fact__icon"><Palette size={16} /></span>
                <div>
                  <span className="fact-label">MATERIALS & COLOUR</span>
                  <strong>{isDemo ? `${formatBytes(fileSize)} · ${fileName.split('.').pop()?.toUpperCase() || 'IMAGE'}` : [...(analysis?.materials ?? []), ...(analysis?.dominantColors ?? [])].join(' · ') || 'No details detected'}</strong>
                </div>
              </div>
            </div>
          </>
        )}
        {mode === null && <div className="analysis-progress" role="status"><span /><span /><span /> Analyzing product details</div>}
        <div className="analysis-next-note"><Check size={15} /> Next, we&apos;ll prepare creative directions. No prompt required.</div>
      </div>
    </section>
  )
}

function formatBytes(size: number) {
  return size < 1_000_000 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1_000_000).toFixed(1)} MB`
}

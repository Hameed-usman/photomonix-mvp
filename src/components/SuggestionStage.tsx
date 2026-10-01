import { ArrowUpRight, Check, Sparkles } from 'lucide-react'
import type { AppMode, CreativeDirection, ProductAnalysis } from '../types'

export function SuggestionStage({
  analysis,
  suggestions,
  selectedId,
  loading,
  mode,
  onSelect,
  onRetry,
}: {
  analysis: ProductAnalysis | null
  suggestions: CreativeDirection[]
  selectedId: string | null
  loading: boolean
  mode: AppMode | null
  onSelect: (direction: CreativeDirection) => void
  onRetry: () => void
}) {
  return (
    <section className="suggestion-stage" aria-labelledby="suggestions-heading">
      <div className="suggestion-heading-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> STEP 03 · YOUR CREATIVE DIRECTION</div>
          <h2 id="suggestions-heading">Choose the feeling.</h2>
          <p className="stage-intro">A few distinct ways to bring {analysis?.productName || 'your product'} to life. Pick one to continue.</p>
        </div>
        <div className="suggestion-count"><Sparkles size={15} /> {suggestions.length ? `${suggestions.length} ideas` : 'Preparing ideas'}</div>
      </div>

      {loading ? (
        <div className="suggestion-grid" aria-label="Preparing creative directions" aria-busy="true">
          {[0, 1, 2, 3].map((item) => <div className="suggestion-skeleton" key={item}><span /><span /><span /></div>)}
        </div>
      ) : suggestions.length ? (
        <div className="suggestion-grid">
          {suggestions.map((direction, index) => {
            const selected = direction.id === selectedId
            return (
              <button
                className={`direction-card ${selected ? 'is-selected' : ''}`}
                type="button"
                key={direction.id}
                onClick={() => onSelect(direction)}
                aria-pressed={selected}
              >
                <div className={`direction-art direction-art--${index + 1}`} style={{ background: `linear-gradient(140deg, ${direction.palette[0]}, ${direction.palette[1]})` }}>
                  <span className="direction-art__orb" />
                  <span className="direction-art__shape" />
                  <span className="direction-art__label">{direction.mood}</span>
                  {selected && <span className="direction-selected"><Check size={15} /></span>}
                </div>
                <div className="direction-copy">
                  <span className="direction-title-row"><strong>{direction.title}</strong><ArrowUpRight size={15} /></span>
                  <span className="direction-description">{direction.description}</span>
                  <span className="direction-visual">{direction.visualDirection}</span>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="suggestion-empty">
          <p>We couldn&apos;t prepare creative directions yet.</p>
          <button className="button button--outline" type="button" onClick={onRetry}>Try again <ArrowUpRight size={15} /></button>
        </div>
      )}
      <div className="suggestion-footnote"><Check size={14} /> Choose a direction to start image generation. You can always create another variation.</div>
      {mode === 'demo' && <p className="demo-callout">These are sample creative directions. Connect AI mode to tailor them to your product.</p>}
    </section>
  )
}

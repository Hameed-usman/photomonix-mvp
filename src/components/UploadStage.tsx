import { useRef, useState, type DragEvent } from 'react'
import { ArrowUpRight, FileImage, ImagePlus, LockKeyhole, Sparkles } from 'lucide-react'

const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']

export function UploadStage({ onSelectFile }: { onSelectFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function acceptFile(file?: File) {
    if (file) onSelectFile(file)
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    acceptFile(event.dataTransfer.files[0])
  }

  return (
    <section className="workspace-grid" aria-labelledby="upload-heading">
      <div className="upload-panel panel">
        <div className="eyebrow"><span className="eyebrow-dot" /> START WITH A PRODUCT PHOTO</div>
        <h2 id="upload-heading">Let&apos;s make<br />something <em>stand out.</em></h2>
        <p className="stage-intro">Drop in a product photo. We&apos;ll understand the details and suggest a few ways to shoot it.</p>

        <div
          className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
          onDragEnter={(event) => { event.preventDefault(); setIsDragging(true) }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false)
          }}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept={acceptedImageTypes.join(',')}
            aria-label="Choose a product image"
            onChange={(event) => acceptFile(event.currentTarget.files?.[0])}
          />
          <div className="dropzone-icon"><ImagePlus size={25} strokeWidth={1.6} /></div>
          <p className="dropzone-title">Drop your image here</p>
          <p className="dropzone-copy">or choose a file from your device</p>
          <button className="button button--dark" type="button" onClick={() => inputRef.current?.click()}>
            Choose image <ArrowUpRight size={16} />
          </button>
          <p className="file-note"><FileImage size={14} /> JPG, PNG or WebP <span>·</span> up to 4 MB</p>
        </div>

        <div className="privacy-note"><LockKeyhole size={14} /> No prompt writing. No account needed.</div>
      </div>

      <aside className="reference-panel" aria-label="Example product photography direction">
        <div className="reference-image-wrap">
          <img src="/images/studio-sample.png" alt="Amber skincare bottle photographed on a warm stone display with a green studio accent" />
          <div className="reference-overlay">
            <span className="reference-kicker"><Sparkles size={13} /> A NEW KIND OF PRODUCT SHOOT</span>
            <p>Your product,<br /><em>in a new light.</em></p>
          </div>
          <div className="reference-index"><span>01</span> / 04</div>
        </div>
        <div className="reference-caption">
          <span><span className="status-dot" /> A creative direction, made simple</span>
          <span className="reference-arrow"><ArrowUpRight size={17} /></span>
        </div>
      </aside>
    </section>
  )
}

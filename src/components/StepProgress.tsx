import { Check } from 'lucide-react'
import type { WorkspaceStep } from '../types'

const steps = [
  { id: 'upload', number: '01', label: 'Upload' },
  { id: 'analysis', number: '02', label: 'Understand' },
  { id: 'suggestions', number: '03', label: 'Choose a look' },
  { id: 'generating', number: '04', label: 'Create' },
  { id: 'result', number: '05', label: 'Your image' },
] as const

const stepOrder: WorkspaceStep[] = ['upload', 'analysis', 'suggestions', 'generating', 'result']

export function StepProgress({ activeStep }: { activeStep: WorkspaceStep }) {
  const activeIndex = stepOrder.indexOf(activeStep)

  return (
    <nav className="step-progress" aria-label="Product image workflow">
      {steps.map((step, index) => {
        const isComplete = index < activeIndex
        const isCurrent = index === activeIndex

        return (
          <div
            className={`progress-step ${isCurrent ? 'is-current' : ''} ${isComplete ? 'is-complete' : ''}`}
            key={step.id}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className="progress-step__marker">
              {isComplete ? <Check size={14} strokeWidth={2.5} aria-hidden="true" /> : step.number}
            </span>
            <span className="progress-step__label">{step.label}</span>
            {index < steps.length - 1 && <span className="progress-step__connector" aria-hidden="true" />}
          </div>
        )
      })}
    </nav>
  )
}

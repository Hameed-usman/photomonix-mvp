import type { CreativeDirection } from '../types'

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
}

export function renderDemoPreview(file: File, direction: CreativeDirection) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1350
      const context = canvas.getContext('2d')

      if (!context) {
        reject(new Error('Your browser could not prepare the demo preview.'))
        return
      }

      const [startColor, endColor] = direction.palette
      const backdrop = context.createLinearGradient(0, 0, 1080, 1350)
      backdrop.addColorStop(0, startColor || '#f2eadc')
      backdrop.addColorStop(1, endColor || '#d7dcbe')
      context.fillStyle = backdrop
      context.fillRect(0, 0, canvas.width, canvas.height)

      context.globalAlpha = 0.26
      context.fillStyle = '#ffffff'
      context.beginPath()
      context.arc(880, 190, 315, 0, Math.PI * 2)
      context.fill()
      context.globalAlpha = 1

      context.save()
      context.shadowColor = 'rgba(39, 34, 25, 0.18)'
      context.shadowBlur = 48
      context.shadowOffsetY = 26
      roundedRect(context, 82, 90, 916, 1120, 30)
      context.fillStyle = 'rgba(255, 253, 247, 0.92)'
      context.fill()
      context.restore()

      const inset = 136
      const boxWidth = 808
      const boxHeight = 1008
      const scale = Math.min(boxWidth / image.width, boxHeight / image.height)
      const drawWidth = image.width * scale
      const drawHeight = image.height * scale
      const x = inset + (boxWidth - drawWidth) / 2
      const y = 146 + (boxHeight - drawHeight) / 2

      context.save()
      context.filter = 'saturate(1.04) contrast(1.015)'
      context.drawImage(image, x, y, drawWidth, drawHeight)
      context.restore()

      context.fillStyle = '#23251d'
      context.font = '600 19px "DM Sans", sans-serif'
      context.letterSpacing = '0.18em'
      context.fillText(direction.title.toUpperCase(), 138, 1170)
      context.fillStyle = 'rgba(35, 37, 29, 0.55)'
      context.font = '500 14px "DM Sans", sans-serif'
      context.letterSpacing = '0.12em'
      context.fillText('STUDIO PREVIEW · DEMO MODE', 138, 1198)

      URL.revokeObjectURL(image.src)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => reject(new Error('This image could not be used for a preview.'))
    image.src = URL.createObjectURL(file)
  })
}

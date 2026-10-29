import { useRef } from 'react'
import { useFrame } from '../lib/clock'
import { type ControlProps, type ViewProps } from '../lib/timeline'
import { Group, Row, input } from './ui'

function imageBlend(day: number, points: number[]) {
  if (points.length < 2) return { from: 0, to: 0, progress: 0 }
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i], to = points[i + 1]
    if (day >= Math.min(from, to) && day <= Math.max(from, to)) {
      const progress = from === to ? 1 : Math.max(0, Math.min(1, (day - from) / (to - from)))
      return { from: i, to: i + 1, progress }
    }
  }
  const first = Math.min(...points)
  const from = day < first ? 0 : points.length - 1
  return { from, to: from, progress: 0 }
}

export function StoryImages({ cfg, plan }: ViewProps) {
  const images = useRef<Array<HTMLImageElement | null>>([])

  useFrame(({ day }) => {
    const blend = imageBlend(day, plan.points)
    images.current.forEach((image, index) => {
      if (!image) return
      const opacity = index === blend.from
        ? 1 - blend.progress
        : index === blend.to ? blend.progress : 0
      image.style.opacity = String(opacity)
    })
  })

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[56cqw] bottom-0 z-0 overflow-hidden bg-black/20" aria-label="Timeline story images">
      {cfg.storyImages.map((url, index) => (
        <img
          key={index}
          ref={node => { images.current[index] = node }}
          src={url || undefined}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0 }}
          decoding="async"
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
    </div>
  )
}

function StoryImagesControls({ cfg, set }: ControlProps) {
  const update = (index: number, url: string) => {
    const storyImages = [...cfg.storyImages]
    storyImages[index] = url
    set({ storyImages })
  }
  const field = (label: string, index: number) => (
    <Row label={label}>
      <input
        type="url"
        className={input}
        placeholder="https://example.com/image.jpg"
        value={cfg.storyImages[index] ?? ''}
        onChange={e => update(index, e.target.value)}
      />
    </Row>
  )

  return (
    <Group title="Image URLs">
      <p className="text-xs text-white/50">Add an image URL for the start, each stop, and the end. Images crossfade with the shared timeline.</p>
      {field('Start', 0)}
      {cfg.stops.map((_, index) => field(`Stop ${index + 1}`, index + 1))}
      {field('End', cfg.stops.length + 1)}
    </Group>
  )
}

export { StoryImagesControls }
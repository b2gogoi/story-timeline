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
  const images = useRef<Array<HTMLDivElement | null>>([])

  useFrame(({ day }) => {
    const blend = imageBlend(day, plan.points)
    images.current.forEach((image, index) => {
      if (!image) return
      const opacity = index <= blend.from
        ? 1
        : index === blend.to ? blend.progress : 0
      image.style.opacity = String(opacity)
    })
  })

  return (
    <div
      className="pointer-events-none absolute left-[12cqw] top-[62cqw] bottom-[9cqw] z-0 w-[70cqw]"
      aria-label="Timeline story photo stack"
    >
      {cfg.storyImages.map((url, index) => {
        const tilt = index === 0 ? 5 : index % 2 === 1 ? -2 - (index % 3) : 2 + (index % 3)
        const offset = Math.min(index * 0.55, 3.3)
        const city = cfg.storyCities[index]?.trim()
        return (
          <div
            key={index}
            ref={node => { images.current[index] = node }}
            className="absolute inset-0 rounded-[0.8cqw] border-[1.2cqw] border-[#e8e0ce] bg-[#e8e0ce] p-[0.9cqw] shadow-[0_2cqw_4cqw_rgba(0,0,0,0.65),inset_0_0.2cqw_0.3cqw_rgba(255,255,255,0.75),inset_0_-0.35cqw_0.6cqw_rgba(0,0,0,0.25)]"
            style={{
              opacity: 0,
              zIndex: index,
              transform: `translate(${offset}cqw, ${offset}cqw) rotate(${tilt}deg)`,
              transformOrigin: 'center',
            }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-[0.35cqw] bg-black/20">
              <img
                src={url || undefined}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{ opacity: 1 }}
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
              {city && (
                <span
                  className="absolute bottom-[2.2cqw] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap bg-[#fffdf3] px-[2.6cqw] py-[1.25cqw] font-serif text-[2.8cqw] font-bold italic tracking-[0.08em] text-[#27231d] shadow-[0_0.4cqw_1cqw_rgba(0,0,0,0.35)]"
                  style={{
                    clipPath: 'polygon(0 10%, 5% 0, 10% 10%, 15% 0, 20% 10%, 25% 0, 30% 10%, 35% 0, 40% 10%, 45% 0, 50% 10%, 55% 0, 60% 10%, 65% 0, 70% 10%, 75% 0, 80% 10%, 85% 0, 90% 10%, 95% 0, 100% 10%, 100% 90%, 95% 100%, 90% 90%, 85% 100%, 80% 90%, 75% 100%, 70% 90%, 65% 100%, 60% 90%, 55% 100%, 50% 90%, 45% 100%, 40% 90%, 35% 100%, 30% 90%, 25% 100%, 20% 90%, 15% 100%, 10% 90%, 5% 100%, 0 90%)',
                  }}
                >
                  {city}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StoryImagesControls({ cfg, set }: ControlProps) {
  const update = (index: number, url: string) => {
    const storyImages = [...cfg.storyImages]
    storyImages[index] = url
    set({ storyImages })
  }
  const updateCity = (index: number, city: string) => {
    const storyCities = [...cfg.storyCities]
    storyCities[index] = city
    set({ storyCities })
  }
  const cityField = (label: string, index: number) => (
    <Row label={label}>
      <input
        type="text"
        className={input}
        placeholder="City name"
        value={cfg.storyCities[index] ?? ''}
        onChange={e => updateCity(index, e.target.value)}
      />
    </Row>
  )
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
    <Group title="Photos & city labels">
      {field('Start image', 0)}
      {cityField('Start city', 0)}
      {cfg.stops.map((_, index) => (
        <div key={index} className="space-y-2">
          {field(`Stop ${index + 1} image`, index + 1)}
          {cityField(`Stop ${index + 1} city`, index + 1)}
        </div>
      ))}
      {field('End image', cfg.stops.length + 1)}
      {cityField('End city', cfg.stops.length + 1)}
    </Group>
  )
}

export { StoryImagesControls }
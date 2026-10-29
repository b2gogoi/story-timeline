import { useRef } from 'react'
import { useFrame } from '../lib/clock'
import { type ControlProps, type ViewProps } from '../lib/timeline'
import { Group, Row, input } from './ui'

function valueAt(day: number, points: number[], values: number[]) {
  if (points.length < 2) return values[0] ?? 0
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i], to = points[i + 1]
    const low = Math.min(from, to), high = Math.max(from, to)
    if (day >= low && day <= high) {
      const progress = from === to ? 1 : Math.max(0, Math.min(1, (day - from) / (to - from)))
      const a = values[i] ?? 0, b = values[i + 1] ?? a
      return a + (b - a) * progress
    }
  }
  return day < Math.min(...points) ? values[0] ?? 0 : values[values.length - 1] ?? 0
}

export function RollingCounter({ cfg, plan }: ViewProps) {
  const digits = useRef<Array<HTMLSpanElement | null>>([])

  useFrame(({ day }) => {
    const value = Math.max(0, Math.min(9999, valueAt(day, plan.points, cfg.rollingValues)))
    digits.current.forEach((track, index) => {
      if (!track) return
      const place = 10 ** (3 - index)
      const digit = (value / place) % 10
      track.style.transform = `translateY(-${digit}em)`
    })
  })

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[20cqw] z-10 flex justify-center" aria-label="Rolling counter">
      <div className="flex h-[1em] font-mono text-[18cqw] font-semibold leading-none tabular-nums">
        {[0, 1, 2, 3].map(index => (
          <div key={index} className="h-[1em] w-[0.68em] overflow-hidden text-center">
            <span ref={node => { digits.current[index] = node }} className="flex h-[10em] flex-col will-change-transform">
              {Array.from({ length: 10 }, (_, n) => <span key={n} className="block h-[1em] shrink-0">{n}</span>)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RollingCounterControls({ cfg, set }: ControlProps) {
  const update = (index: number, raw: string) => {
    const values = [...cfg.rollingValues]
    values[index] = Math.max(0, Math.min(9999, Math.floor(Number(raw) || 0)))
    set({ rollingValues: values })
  }
  const field = (label: string, index: number) => (
    <Row label={label}>
      <input type="number" min={0} max={9999} step={1} className={input} value={cfg.rollingValues[index] ?? 0} onChange={e => update(index, e.target.value)} />
    </Row>
  )

  return (
    <Group title="Counter values">
      <p className="text-xs text-white/50">Enter a value from 0000 to 9999 for each timeline point. The counter rolls between them.</p>
      {field('Start', 0)}
      {cfg.stops.map((_, i) => field(`Stop ${i + 1}`, i + 1))}
      {field('End', cfg.stops.length + 1)}
    </Group>
  )
}

export { RollingCounterControls }
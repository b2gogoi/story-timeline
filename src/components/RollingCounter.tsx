import { useRef } from 'react'
import { useFrame } from '../lib/clock'
import { type ControlProps, type ViewProps } from '../lib/timeline'
import { Group, Row, input } from './ui'

const DIGIT_HEIGHT = 11 // cqw; keep in sync with the drum and ribbon row heights

function valueAt(day: number, points: number[], values: number[]) {
  if (points.length < 2) return values[0] ?? 0
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i], to = points[i + 1]
    if (day >= Math.min(from, to) && day <= Math.max(from, to)) {
      const progress = from === to ? 1 : Math.max(0, Math.min(1, (day - from) / (to - from)))
      const start = values[i] ?? 0
      const end = values[i + 1] ?? start
      return start + (end - start) * progress
    }
  }
  return day < Math.min(...points) ? values[0] ?? 0 : values[values.length - 1] ?? 0
}

export function RollingCounter({ cfg, plan }: ViewProps) {
  const ribbons = useRef<Array<HTMLSpanElement | null>>([])

  useFrame(({ day }) => {
    const value = Math.max(0, Math.min(9999, valueAt(day, plan.points, cfg.rollingValues)))

    // The units wheel turns continuously; each higher wheel engages only as
    // the wheel to its right passes through 9 into 0.
    for (let index = 3; index >= 0; index--) {
      const place = 10 ** (3 - index)
      let digitWithFraction: number

      if (index === 3) {
        digitWithFraction = value % 10
      } else {
        const childDigit = (value / (place / 10)) % 10
        const wholeDigit = Math.floor((value / place) % 10)
        digitWithFraction = childDigit > 9 ? wholeDigit + childDigit - 9 : wholeDigit
      }

      const digit = ((digitWithFraction % 10) + 10) % 10
      const ribbon = ribbons.current[index]
      if (ribbon) ribbon.style.transform = `translate3d(0, -${(10 + digit) * DIGIT_HEIGHT}cqw, 0)`
    }
  })

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[20cqw] z-10 flex justify-center" aria-label="Rolling counter">
      <div className="relative rounded-[1.8cqw] border border-white/15 bg-gradient-to-b from-[#282b2e] via-[#151719] to-[#08090a] p-[1.8cqw] shadow-[0_2cqw_4cqw_rgba(0,0,0,0.75),inset_0_0.5cqw_0.6cqw_rgba(255,255,255,0.14),inset_0_-0.8cqw_1cqw_rgba(0,0,0,0.9)]">
        <div className="rounded-[0.8cqw] border border-black bg-[#030405] p-[0.7cqw] shadow-[inset_0_0.8cqw_1.4cqw_rgba(0,0,0,0.95),0_0.3cqw_0.5cqw_rgba(255,255,255,0.12)]">
          <div className="relative flex overflow-hidden rounded-[0.45cqw] bg-black">
            {[0, 1, 2, 3].map(index => (
              <div key={index} className="relative h-[11cqw] w-[10cqw] overflow-hidden border-r border-black/30 bg-gradient-to-r from-[#b5b5b1] via-[#f0eee7] to-[#aaa9a3] last:border-r-0">
                <span ref={node => { ribbons.current[index] = node }} className="absolute left-0 top-0 flex flex-col will-change-transform" style={{ width: '100%' }}>
                  {Array.from({ length: 30 }, (_, n) => {
                    const digit = n % 10
                    const color = index >= 2
                      ? 'text-[#bf2525] [text-shadow:0_1px_0_rgba(255,190,190,0.35),0_-1px_0_rgba(70,0,0,0.45)]'
                      : 'text-[#111315] [text-shadow:0_1px_0_rgba(255,255,255,0.5),0_-1px_0_rgba(0,0,0,0.25)]'
                    return (
                      <span key={n} className={`flex shrink-0 items-center justify-center font-mono text-[8.2cqw] font-bold leading-none tabular-nums ${color}`} style={{ height: `${DIGIT_HEIGHT}cqw` }}>
                        {digit}
                      </span>
                    )
                  })}
                </span>
              </div>
            ))}
            <div className="pointer-events-none absolute inset-0 z-10 rounded-[0.45cqw] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.28)_12%,rgba(255,255,255,0.2)_23%,transparent_38%,transparent_62%,rgba(0,0,0,0.3)_84%,rgba(0,0,0,0.68)_100%)]" />
          </div>
        </div>
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
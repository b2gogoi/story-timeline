import { useEffect, useMemo, useRef } from 'react'
import { type Config, type Plan, DAY, DAYS_PER_MONTH, labelOf, positionAt } from '../lib/timeline'

type Props = { cfg: Config; plan: Plan; playing: boolean }

export function Story({ cfg, plan, playing }: Props) {
  const layer = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const units = useRef<HTMLSpanElement>(null)
  const clock = useRef(0)
  const N = cfg.monthsVisible * DAYS_PER_MONTH
  const dir = cfg.direction === 'up' ? 1 : -1

  const lo = Math.floor(Math.min(...plan.points)) - Math.ceil(N / 2) - 40
  const hi = Math.ceil(Math.max(...plan.points)) + Math.ceil(N / 2) + 40
  const count = hi - lo                                   // place() stays the same
  const place = (i: number) => { const u = (i - lo) / count; return dir === 1 ? u : 1 - u }

  useEffect(() => {
    let raf = 0, last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      if (playing) clock.current += dt
      const t = positionAt(plan, clock.current)
      if (layer.current) layer.current.style.transform = `translateY(${-place(t) * 100}%)`
      if (label.current) label.current.textContent = labelOf(Math.round(t))
      const a = plan.points[0], b = plan.points[plan.points.length - 1]
      if (units.current) units.current.textContent = `${b === a ? 0 : Math.round(((t - a) / (b - a)) * 1000)} / 1000`
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, playing, lo, count, dir])

  const ticks = useMemo(() => {
    const out: JSX.Element[] = []
    const start = new Date(lo * DAY)
    let y = start.getUTCFullYear(), m = start.getUTCMonth()
    for (;;) {
      const day = Date.UTC(y, m, 1) / DAY
      if (day > hi) break
      if (day >= lo) {
        const year = m === 0, quarter = m % 3 === 0
        out.push(
          <div key={day} className="absolute right-0 flex items-center justify-end" style={{ top: `${place(day) * 100}%`, transform: 'translateY(-50%)' }}>
            {year && <span className="mr-[1.6cqw] font-mono text-[2.5cqw] font-semibold leading-none">{y}</span>}
            <span className="h-px" style={{ background: 'currentColor', width: year ? '6cqw' : quarter ? '3.4cqw' : '2cqw', opacity: year ? 1 : quarter ? 0.6 : 0.35 }} />
          </div>
        )
      }
      if (++m > 11) { m = 0; y++ }
    }
    return out
  }, [count, lo, dir]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="@container relative h-full aspect-[9/16] overflow-hidden"
      style={{ containerType: 'size', color: cfg.fontColor, background: `linear-gradient(90deg, ${cfg.bgFrom} ${cfg.bgSplit}%, ${cfg.bgTo} 100%)` }}
    >
      <div className="absolute inset-y-0 right-[4cqw] w-px opacity-40" style={{ background: 'currentColor' }} />
      <div ref={layer} className="absolute right-[4cqw] w-[10cqw] will-change-transform" style={{ top: '50%', height: `${(count * 100) / N}%` }}>
        {ticks}
      </div>
      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center pl-[50cqw] pr-[4cqw]">
        <span ref={label} className="mr-[2.4cqw] whitespace-nowrap font-mono text-[2.6cqw] tracking-[0.22em]" />
        <span className="h-px flex-1" style={{ background: 'currentColor' }} />
        <span ref={units} className="absolute left-[40cqw] top-1/2 mt-[2.2cqw] font-mono text-[2.2cqw] tracking-[0.15em] opacity-70" />
      </div>
    </div>
  )
}

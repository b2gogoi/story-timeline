import { useMemo, useRef } from 'react'
import { useFrame } from '../lib/clock'
import { type ControlProps, type ViewProps, DAY, DAYS_PER_MONTH, labelOf } from '../lib/timeline'
import { Group, Slider, btn } from './ui'

export function RulerView({ cfg, plan }: ViewProps) {
  const layer = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const N = cfg.monthsVisible * DAYS_PER_MONTH
  const dir = cfg.direction === 'up' ? 1 : -1

  const lo = Math.floor(Math.min(...plan.points)) - Math.ceil(N / 2) - 40
  const hi = Math.ceil(Math.max(...plan.points)) + Math.ceil(N / 2) + 40
  const count = hi - lo
  const place = (i: number) => { const u = (i - lo) / count; return dir === 1 ? u : 1 - u }

  useFrame(({ day }) => {
    if (layer.current) layer.current.style.transform = `translateY(${-place(day) * 100}%)`
    if (label.current) label.current.textContent = labelOf(day)
  })

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
    <>
      <div className="absolute inset-y-0 right-0 w-px opacity-40" style={{ background: 'currentColor' }} />
      <div ref={layer} className="absolute right-0 w-[10cqw] will-change-transform" style={{ top: '50%', height: `${(count * 100) / N}%` }}>
        {ticks}
      </div>
      <div className="absolute inset-x-0 top-[56cqw] flex -translate-y-1/2 items-center pl-[40cqw] pr-0">
        <span ref={label} className="mr-[2.4cqw] whitespace-nowrap font-mono text-[2.6cqw] tracking-[0.22em]" />
        <span className="h-px flex-1" style={{ background: 'currentColor' }} />
      </div>
    </>
  )
}

export function RulerControls({ cfg, set }: ControlProps) {
  return (
    <>
      <Slider label="Months visible in frame" value={cfg.monthsVisible} min={6} max={120} step={1} on={v => set({ monthsVisible: v })} />
      <div className="grid grid-cols-2 gap-2">
        {(['up', 'down'] as const).map(d => (
          <button key={d} className={`${btn} ${cfg.direction === d ? '!border-cyan-400/70 !bg-cyan-400/15' : ''}`} onClick={() => set({ direction: d })}>
            Scroll {d}
          </button>
        ))}
      </div>
    </>
  )
}
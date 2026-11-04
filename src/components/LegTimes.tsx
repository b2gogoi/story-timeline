import { useRef } from 'react'
import { START_PAUSE_SECONDS, useFrame } from '../lib/clock'
import { type Plan, toISO } from '../lib/timeline'

export function LegTimes({ plan, mode }: { plan: Plan; mode: 'auto' | 'manual' }) {
  const lastLeg = plan.segs.length - 1
  const moving = plan.segs.reduce((sum, s) => sum + s.move, 0)
  const pauses = plan.total - moving + START_PAUSE_SECONDS
  const rows = useRef<(HTMLLIElement | null)[]>([])

  // Leg 0 is the startup pause; numbered route legs follow the timeline segments.
  useFrame(({ day, startProgress }) => {
    let current = lastLeg
    for (let i = 0; i <= lastLeg; i++) {
      const { from, to } = plan.segs[i]
      const inside = from <= to ? day >= from && day < to : day <= from && day > to
      if (inside) { current = i; break }
    }
    rows.current.forEach((row, i) => {
      if (!row) return
      const startup = i === 0
      const active = startup ? startProgress < 1 : startProgress >= 1 && i - 1 === current
      const p = startup
        ? Math.min(1, Math.max(0, startProgress))
        : active
          ? (plan.segs[i - 1].to === plan.segs[i - 1].from ? 1 : Math.min(1, Math.max(0, (day - plan.segs[i - 1].from) / (plan.segs[i - 1].to - plan.segs[i - 1].from))))
          : 0
      row.style.setProperty('--p', p.toFixed(3))
      const value = String(active)
      if (row.dataset.active !== value) row.dataset.active = value
    })
  })

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-white/10 bg-neutral-950 p-5 xl:flex">
      <div>
        <h2 className="text-sm font-semibold text-white">Leg durations</h2>
        <p className="mt-1 text-xs text-white/50">
          Timing follows {plan.values ? 'the rolling counter' : 'ruler dates'}
        </p>
      </div>

      <ol className="space-y-2">
        <li
          ref={node => { rows.current[0] = node }}
          data-active="false"
          className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 transition-colors data-[active=true]:border-cyan-400/60 data-[active=true]:bg-cyan-400/10"
        >
          <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-cyan-400 opacity-0 group-data-[active=true]:opacity-100" style={{ transform: 'scaleX(var(--p, 0))' }} />
          <div className="min-w-0">
            <div className="text-xs text-white/50 group-data-[active=true]:text-cyan-300">Leg 0</div>
            <div className="truncate font-mono text-[11px] text-white/80">Counter initialization</div>
          </div>
          <div className="shrink-0 font-mono text-sm text-cyan-300">{START_PAUSE_SECONDS.toFixed(2)} s</div>
        </li>
        {plan.segs.map((s, i) => (
          <li
            key={i}
            ref={node => { rows.current[i + 1] = node }}
            data-active="false"
            className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 transition-colors data-[active=true]:border-cyan-400/60 data-[active=true]:bg-cyan-400/10"
          >
            <span
              className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-cyan-400 opacity-0 group-data-[active=true]:opacity-100"
              style={{ transform: 'scaleX(var(--p, 0))' }}
            />
            <div className="min-w-0">
              <div className="text-xs text-white/50 group-data-[active=true]:text-cyan-300">{i === lastLeg ? 'Final leg' : `Leg ${i + 1}`}</div>
              <div className="truncate font-mono text-[11px] text-white/80">{toISO(s.from)} to {toISO(s.to)}</div>
            </div>
            <div className="shrink-0 font-mono text-sm text-cyan-300">{s.move.toFixed(2)} s</div>
          </li>
        ))}
      </ol>

      <dl className="space-y-1.5 border-t border-white/10 pt-3 text-xs text-white/60">
        <div className="flex justify-between"><dt>Moving</dt><dd className="font-mono text-white/80">{moving.toFixed(2)} s</dd></div>
        {mode === 'auto' && (
          <>
            <div className="flex justify-between"><dt>Pauses (incl. Leg 0)</dt><dd className="font-mono text-white/80">{pauses.toFixed(2)} s</dd></div>
            <div className="flex justify-between"><dt>Full cycle (incl. Leg 0)</dt><dd className="font-mono text-white">{(plan.total + START_PAUSE_SECONDS).toFixed(2)} s</dd></div>
          </>
        )}
      </dl>
    </aside>
  )
}

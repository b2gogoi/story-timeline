import { useState, type ReactNode } from 'react'
import { type Config, toDay, toISO } from '../lib/timeline'

type Props = {
  cfg: Config; set: (p: Partial<Config>) => void
  playing: boolean; onToggle: () => void; onRestart: () => void
}

const input = 'w-full rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none focus:border-cyan-400/70 [color-scheme:dark]'
const btn = 'rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10 focus-visible:outline focus-visible:outline-cyan-400'

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3 border-t border-white/10 pt-5">
    <h2 className="text-sm font-semibold text-white">{title}</h2>
    {children}
  </section>
)
const Row = ({ label, value, children }: { label: string; value?: string; children: ReactNode }) => (
  <label className="block space-y-1.5 text-xs text-white/60">
    <span className="flex justify-between"><span>{label}</span><span className="font-mono text-white/80">{value}</span></span>
    {children}
  </label>
)
const Slider = (p: { label: string; value: number; min: number; max: number; step: number; unit?: string; on: (v: number) => void }) => (
  <Row label={p.label} value={`${p.value}${p.unit ?? ''}`}>
    <input type="range" className="w-full accent-cyan-400" min={p.min} max={p.max} step={p.step} value={p.value} onChange={e => p.on(+e.target.value)} />
  </Row>
)
const Color = ({ label, value, on }: { label: string; value: string; on: (v: string) => void }) => (
  <Row label={label} value={value}>
    <input type="color" className="h-9 w-full cursor-pointer rounded-md border border-white/10 bg-transparent" value={value} onChange={e => on(e.target.value)} />
  </Row>
)

export function Controls({ cfg, set, playing, onToggle, onRestart }: Props) {
  const [evenN, setEvenN] = useState(4)
  const days = Math.abs(toDay(cfg.end) - toDay(cfg.start)) 
  const setStop = (i: number, v: string) => set({ stops: cfg.stops.map((s, k) => (k === i ? v : s)) })
  const spread = () => {
    const a = toDay(cfg.start), b = toDay(cfg.end)
    set({ stops: Array.from({ length: evenN }, (_, k) => toISO(Math.round(a + ((b - a) * (k + 1)) / (evenN + 1)))) })
  }

  return (
    <aside className="w-[380px] shrink-0 space-y-5 overflow-y-auto border-r border-white/10 bg-neutral-950 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-white">Story timeline</h1>
        <div className="flex gap-2">
          <button className={btn} onClick={onToggle}>{playing ? 'Pause' : 'Play'}</button>
          <button className={btn} onClick={onRestart}>Restart</button>
        </div>
      </div>
      <p className="text-xs text-white/60">
  {days.toLocaleString()} days = 1,000 units · 1 unit ≈ {(days / 1000).toFixed(2)} days
</p>
      <Group title="Dates and stops">
        <div className="grid grid-cols-2 gap-3">
          <Row label="Start"><input type="date" className={input} value={cfg.start} onChange={e => e.target.value && set({ start: e.target.value })} /></Row>
          <Row label="End"><input type="date" className={input} value={cfg.end} onChange={e => e.target.value && set({ end: e.target.value })} /></Row>
        </div>
        <div className="space-y-2">
          {cfg.stops.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input type="date" className={input} value={s} onChange={e => e.target.value && setStop(i, e.target.value)} aria-label={`Stop ${i + 1}`} />
              <button className={btn} onClick={() => set({ stops: cfg.stops.filter((_, k) => k !== i) })} aria-label={`Remove stop ${i + 1}`}>Remove</button>
            </div>
          ))}
          {cfg.stops.length === 0 && <p className="text-xs text-white/50">No stops between start and end. Add one, or space several evenly.</p>}
        </div>
        <div className="flex items-center gap-2">
          <button className={btn} onClick={() => set({ stops: [...cfg.stops, cfg.end] })}>Add stop</button>
          <span className="ml-auto text-xs text-white/50">Space</span>
          <input type="number" min={1} max={24} className={`${input} !w-16`} value={evenN} onChange={e => setEvenN(Math.max(1, +e.target.value || 1))} />
        <button className={btn} onClick={spread}> Replace Evenly</button>
        </div>
      </Group>

      <Group title="Motion">
        <Slider label="Top speed" value={cfg.speed} min={2} max={60} step={1} unit=" mo/s" on={v => set({ speed: v })} />
        <Slider label="Braking sharpness" value={cfg.easePower} min={1.5} max={6} step={0.1} on={v => set({ easePower: v })} />
        <Slider label="Pause at each stop" value={cfg.dwell} min={0} max={5} step={0.1} unit=" s" on={v => set({ dwell: v })} />
        <Row label="Scroll direction">
          <div className="grid grid-cols-2 gap-2">
            {(['up', 'down'] as const).map(d => (
              <button key={d} className={`${btn} ${cfg.direction === d ? '!border-cyan-400/70 !bg-cyan-400/15' : ''}`} onClick={() => set({ direction: d })}>{d === 'up' ? 'Up' : 'Down'}</button>
            ))}
          </div>
        </Row>
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input type="checkbox" className="accent-cyan-400" checked={cfg.loop} onChange={e => set({ loop: e.target.checked })} /> Loop back to start
        </label>
      </Group>

      <Group title="Scale">
        <Slider label="Months visible in frame" value={cfg.monthsVisible} min={6} max={120} step={1} on={v => set({ monthsVisible: v })} />
      </Group>

      <Group title="Look">
        <div className="grid grid-cols-2 gap-3">
          <Color label="Background left" value={cfg.bgFrom} on={v => set({ bgFrom: v })} />
          <Color label="Background right" value={cfg.bgTo} on={v => set({ bgTo: v })} />
        </div>
        <Slider label="Dark area width" value={cfg.bgSplit} min={0} max={80} step={1} unit="%" on={v => set({ bgSplit: v })} />
        <Color label="Text and ticks" value={cfg.fontColor} on={v => set({ fontColor: v })} />
      </Group>
    </aside>
  )
}

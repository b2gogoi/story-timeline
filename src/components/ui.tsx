import { type ReactNode } from 'react'

export const input = 'w-full rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none focus:border-cyan-400/70 [color-scheme:dark]'
export const btn = 'rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10 focus-visible:outline focus-visible:outline-cyan-400'

export const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="space-y-5">
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300/80">{title}</h2>
    {children}
  </div>
)
export const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3 border-t border-white/10 pt-5">
    <h3 className="text-sm font-semibold text-white">{title}</h3>
    {children}
  </section>
)
export const Row = ({ label, value, children }: { label: string; value?: string; children: ReactNode }) => (
  <label className="block space-y-1.5 text-xs text-white/60">
    <span className="flex justify-between"><span>{label}</span><span className="font-mono text-white/80">{value}</span></span>
    {children}
  </label>
)
export const Slider = (p: { label: string; value: number; min: number; max: number; step: number; unit?: string; on: (v: number) => void }) => (
  <Row label={p.label} value={`${p.value}${p.unit ?? ''}`}>
    <input type="range" className="w-full accent-cyan-400" min={p.min} max={p.max} step={p.step} value={p.value} onChange={e => p.on(+e.target.value)} />
  </Row>
)
export const Color = ({ label, value, on }: { label: string; value: string; on: (v: string) => void }) => (
  <Row label={label} value={value}>
    <input type="color" className="h-9 w-full cursor-pointer rounded-md border border-white/10 bg-transparent" value={value} onChange={e => on(e.target.value)} />
  </Row>
)
import { useState } from 'react'
import { type ComponentId, type Plan, type Config } from '../lib/timeline'
import { Story } from './Story'
import { REGISTRY } from './registry'
import { GlobalControls } from './GlobalControls'
import type { ControlProps } from '../lib/timeline'

export function ComponentPreview({ cfg, plan, selected, set }: { cfg: Config; plan: Plan; selected: ComponentId | 'global'; set: ControlProps['set'] }) {
  const [scale, setScale] = useState(120)
  const show = Object.fromEntries(Object.keys(cfg.show).map(key => [key, selected !== 'global' && key === selected])) as Config['show']
  return (
    <aside className="flex w-[720px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-white/10 bg-neutral-950 p-4">
      <header>
        <h2 className="text-base font-semibold text-white">Controls and Preview</h2>
        <p className="mt-1 text-xs text-white/50">{selected === 'global' ? 'Global' : selected}</p>
      </header>
      {selected === 'global' ? <div className="max-h-[55%] overflow-y-auto"><GlobalControls cfg={cfg} set={set} /></div> : (() => {
        const ComponentControls = REGISTRY.find(item => item.id === selected)?.Controls
        return ComponentControls ? <div className="max-h-[45%] overflow-y-auto border-b border-white/10 pb-3"><ComponentControls cfg={cfg} set={set} /></div> : null
      })()}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30 pb-4">
        <div className="h-[320px] origin-center" style={{ transform: `scale(${scale / 100})` }}>
          <Story cfg={{ ...cfg, show }} plan={plan} previewComponent={selected === 'global' ? undefined : selected} previewScale={1} />
        </div>
      </div>
      <label className="text-xs text-white/60">Component size <span className="float-right font-mono text-white/80">{scale}%</span>
        <input type="range" min="40" max="200" step="1" value={scale} onChange={e => setScale(Number(e.target.value))} className="mt-2 w-full accent-cyan-400" />
      </label>
    </aside>
  )
}

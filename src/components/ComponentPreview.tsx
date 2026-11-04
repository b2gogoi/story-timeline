import { useState } from 'react'
import { type ComponentId, type Plan, type Config } from '../lib/timeline'
import { Story } from './Story'
import { REGISTRY } from './registry'
import type { ControlProps } from '../lib/timeline'

export function ComponentPreview({ cfg, plan, selected, set }: { cfg: Config; plan: Plan; selected: ComponentId | 'global'; set: ControlProps['set'] }) {
  const [scale, setScale] = useState(0.55)
  const show = Object.fromEntries(Object.keys(cfg.show).map(key => [key, selected !== 'global' && key === selected])) as Config['show']
  return (
    <aside className="flex w-[720px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-white/10 bg-neutral-950 p-4">
      <header>
        <h2 className="text-base font-semibold text-white">Controls and Preview</h2>
        <p className="mt-1 text-xs text-white/50">{selected === 'global' ? 'Global' : selected}</p>
      </header>
      {selected !== 'global' && (() => {
        const ComponentControls = REGISTRY.find(item => item.id === selected)?.Controls
        return ComponentControls ? <div className="max-h-[45%] overflow-y-auto border-b border-white/10 pb-3"><ComponentControls cfg={cfg} set={set} /></div> : null
      })()}
      <div className="flex min-h-0 flex-1 items-end justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30 pb-4">
        <div className="h-[320px] origin-bottom" style={{ transform: `scale(${scale})` }}>
          <Story cfg={{ ...cfg, show }} plan={plan} />
        </div>
      </div>
      <label className="text-xs text-white/60">Preview size
        <input type="range" min="0.35" max="1" step="0.05" value={scale} onChange={e => setScale(Number(e.target.value))} className="mt-2 w-full accent-cyan-400" />
      </label>
    </aside>
  )
}

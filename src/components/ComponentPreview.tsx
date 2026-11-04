import { useEffect, useMemo, useState } from 'react'
import { type ComponentId, type Config, buildPlan, toDay } from '../lib/timeline'
import { Story } from './Story'
import { REGISTRY } from './registry'
import { GlobalControls } from './GlobalControls'
import type { ControlProps } from '../lib/timeline'

export function ComponentPreview({ cfg, selected, set }: { cfg: Config; selected: ComponentId | 'global'; set: ControlProps['set'] }) {
  const [scale, setScale] = useState(120)
  const [draftCfg, setDraftCfg] = useState(cfg)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setDraftCfg(cfg)
    setDirty(false)
  }, [selected])

  const updateDraft: ControlProps['set'] = patch => {
    setDraftCfg(current => ({ ...current, ...patch }))
    setDirty(true)
  }
  const applyDraft = () => {
    set({ ...draftCfg, show: cfg.show })
    setDirty(false)
  }

  const plan = useMemo(
    () => buildPlan([draftCfg.start, ...draftCfg.stops, draftCfg.end].map(toDay), draftCfg, draftCfg.mapping === 'counter' ? draftCfg.rollingValues : undefined),
    [draftCfg.start, draftCfg.end, draftCfg.stops, draftCfg.speed, draftCfg.easePower, draftCfg.dwell, draftCfg.loop, draftCfg.mapping, draftCfg.rollingValues],
  )
  const show = Object.fromEntries(Object.keys(cfg.show).map(key => [key, selected !== 'global' && key === selected])) as Config['show']
  return (
    <aside className="flex w-[720px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-white/10 bg-neutral-950 p-4">
      <header>
        <h2 className="text-base font-semibold text-white">Controls and Preview</h2>
        <p className="mt-1 text-xs text-white/50">{selected === 'global' ? 'Global' : selected}</p>
      </header>
      {selected === 'global' ? <div className="max-h-[55%] overflow-y-auto"><GlobalControls cfg={draftCfg} set={updateDraft} /></div> : (() => {
        const ComponentControls = REGISTRY.find(item => item.id === selected)?.Controls
        return ComponentControls ? <div className="max-h-[45%] overflow-y-auto border-b border-white/10 pb-3"><ComponentControls cfg={draftCfg} set={updateDraft} /></div> : null
      })()}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30 pb-4">
        <div className="h-[320px] origin-center" style={{ transform: `scale(${scale / 100})` }}>
          <Story cfg={{ ...draftCfg, show }} plan={plan} previewComponent={selected === 'global' ? undefined : selected} previewScale={1} />
        </div>
      </div>
      <label className="text-xs text-white/60">Component size <span className="float-right font-mono text-white/80">{scale}%</span>
        <input type="range" min="40" max="200" step="1" value={scale} onChange={e => setScale(Number(e.target.value))} className="mt-2 w-full accent-cyan-400" />
      </label>
      <button
        type="button"
        onClick={applyDraft}
        disabled={!dirty}
        className="w-full rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
      >
        Apply to story
      </button>
    </aside>
  )
}

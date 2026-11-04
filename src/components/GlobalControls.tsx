import { type Config } from '../lib/timeline'
import { Color, Group, Row, Section, Slider, btn, input } from './ui'

export function GlobalControls({ cfg, set }: { cfg: Config; set: (p: Partial<Config>) => void }) {
  const removeStop = (index: number) => set({
    stops: cfg.stops.filter((_, i) => i !== index),
    rollingValues: cfg.rollingValues.filter((_, i) => i !== index + 1),
    storyImages: cfg.storyImages.filter((_, i) => i !== index + 1),
    storyCities: cfg.storyCities.filter((_, i) => i !== index + 1),
    storyEvents: cfg.storyEvents.filter((_, i) => i !== index + 1),
  })
  return (
    <div className="space-y-5">
      <Section title="Global settings">
        <Group title="Dates and stops">
          <div className="grid grid-cols-2 gap-3">
            <Row label="Start"><input type="date" className={input} value={cfg.start} onChange={e => e.target.value && set({ start: e.target.value })} /></Row>
            <Row label="End"><input type="date" className={input} value={cfg.end} onChange={e => e.target.value && set({ end: e.target.value })} /></Row>
          </div>
          {cfg.stops.map((stop, index) => (
            <div key={index} className="flex items-end gap-2">
              <Row label={`Stop ${index + 1}`}><input type="date" className={input} value={stop} onChange={e => e.target.value && set({ stops: cfg.stops.map((value, i) => i === index ? e.target.value : value) })} /></Row>
              <button type="button" className={btn} onClick={() => removeStop(index)}>Remove</button>
            </div>
          ))}
        </Group>
        <Group title="Motion">
          <Row label="Stop advance"><div className="grid grid-cols-2 gap-2">{(['auto', 'manual'] as const).map(mode => <button key={mode} className={`${btn} ${cfg.mode === mode ? '!border-cyan-400/70 !bg-cyan-400/15' : ''}`} onClick={() => set({ mode })}>{mode === 'auto' ? 'Auto' : 'Manual'}</button>)}</div></Row>
          <Row label="Timing follows"><div className="grid grid-cols-2 gap-2">{(['dates', 'counter'] as const).map(mapping => <button key={mapping} className={`${btn} ${cfg.mapping === mapping ? '!border-cyan-400/70 !bg-cyan-400/15' : ''}`} onClick={() => set({ mapping })}>{mapping === 'dates' ? 'Ruler dates' : 'Rolling counter'}</button>)}</div></Row>
          <Slider label="Top speed" value={cfg.speed} min={2} max={60} step={1} unit=" mo/s" on={v => set({ speed: v })} />
          <Slider label="Braking sharpness" value={cfg.easePower} min={1.5} max={6} step={0.1} on={v => set({ easePower: v })} />
          {cfg.mode === 'auto' && <><Slider label="Pause at each stop" value={cfg.dwell} min={0} max={5} step={0.1} unit=" s" on={v => set({ dwell: v })} /><label className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" className="accent-cyan-400" checked={cfg.loop} onChange={e => set({ loop: e.target.checked })} />Loop back to start</label></>}
        </Group>
        <Group title="Appearance">
          <div className="grid grid-cols-2 gap-3"><Color label="Background left" value={cfg.bgFrom} on={v => set({ bgFrom: v })} /><Color label="Background right" value={cfg.bgTo} on={v => set({ bgTo: v })} /></div>
          <Slider label="Dark area width" value={cfg.bgSplit} min={0} max={80} step={1} unit="%" on={v => set({ bgSplit: v })} />
          <Color label="Text and ticks" value={cfg.fontColor} on={v => set({ fontColor: v })} />
        </Group>
      </Section>
    </div>
  )
}
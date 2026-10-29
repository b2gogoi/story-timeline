import { useState } from 'react'
import { type Config, toDay, toISO } from '../lib/timeline'
import { REGISTRY } from './registry'
import { Color, Group, Row, Section, Slider, btn, input } from './ui'

type Props = {
  cfg: Config; set: (p: Partial<Config>) => void
  playing: boolean; onToggle: () => void; onRestart: () => void
}

export function Controls({ cfg, set, playing, onToggle, onRestart }: Props) {
  const [evenN, setEvenN] = useState(4)
  const days = Math.abs(toDay(cfg.end) - toDay(cfg.start))
  const setStop = (i: number, v: string) => set({ stops: cfg.stops.map((s, k) => (k === i ? v : s)) })
  const spread = () => {
    const a = toDay(cfg.start), b = toDay(cfg.end)
    set({
      stops: Array.from({ length: evenN }, (_, k) =>
        toISO(Math.round(a + ((b - a) * (k + 1)) / (evenN + 1))),
      ),
      rollingValues: Array.from({ length: evenN + 2 }, (_, k) =>
        Math.round(
          cfg.rollingValues[0] +
            ((cfg.rollingValues[cfg.rollingValues.length - 1] - cfg.rollingValues[0]) * k) /
              (evenN + 1),
        ),
      ),
    })
  }

  const addStop = () => {
    const values = cfg.rollingValues
    const lastStop = values[values.length - 2] ?? values[0] ?? 0
    const end = values[values.length - 1] ?? 0

    set({
      stops: [...cfg.stops, cfg.end],
      rollingValues: [...values.slice(0, -1), Math.round((lastStop + end) / 2), end],
    })
  }

  return (
    <aside className="w-[380px] shrink-0 space-y-8 overflow-y-auto border-r border-white/10 bg-neutral-950 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-white">Story timeline</h1>
        <div className="flex gap-2">
          <button className={btn} onClick={onToggle} disabled={cfg.mode === 'manual'}>{playing ? 'Pause' : 'Play'}</button>
          <button className={btn} onClick={onRestart}>Restart</button>
        </div>
      </div>

      <Section title="Global">
        <Group title="Athlete">
          <Row label="Date of birth">
            <input type="date" className={input} value={cfg.dob} onChange={e => e.target.value && set({ dob: e.target.value })} />
          </Row>
        </Group>
        <Group title="Dates and stops">
          <div className="grid grid-cols-2 gap-3">
            <Row label="Start"><input type="date" className={input} value={cfg.start} onChange={e => e.target.value && set({ start: e.target.value })} /></Row>
            <Row label="End"><input type="date" className={input} value={cfg.end} onChange={e => e.target.value && set({ end: e.target.value })} /></Row>
          </div>
          <div className="space-y-2">
            {cfg.stops.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input type="date" className={input} value={s} onChange={e => e.target.value && setStop(i, e.target.value)} aria-label={`Stop ${i + 1}`} />
                {/* <button className={btn} onClick={}>Remove</button> */}
                <button
                  className={btn}
                  onClick={() =>
                    set({
                      stops: cfg.stops.filter((_, k) => k !== i),
                      rollingValues: cfg.rollingValues.filter((_, k) => k !== i + 1),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className={btn} onClick={addStop}>Add stop</button>
            <span className="ml-auto text-xs text-white/50">Replace with</span>
            <input type="number" min={1} max={24} className={`${input} !w-16`} value={evenN} onChange={e => setEvenN(Math.max(1, +e.target.value || 1))} />
            <button className={btn} onClick={spread}>even stops</button>
          </div>
          <p className="text-xs text-white/60">{days.toLocaleString()} days = 1,000 units · 1 unit ≈ {(days / 1000).toFixed(2)} days</p>
        </Group>

        <Group title="Motion">
          <Row label="Stop advance">
            <div className="grid grid-cols-2 gap-2">
              {(['auto', 'manual'] as const).map(m => (
                <button
                  key={m}
                  className={`${btn} ${cfg.mode === m ? '!border-cyan-400/70 !bg-cyan-400/15' : ''}`}
                  onClick={() => set({ mode: m })}
                >
                  {m === 'auto' ? 'Auto' : 'Manual'}
                </button>
              ))}
            </div>
          </Row>

          <Slider label="Top speed" value={cfg.speed} min={2} max={60} step={1} unit=" mo/s" on={v => set({ speed: v })} />
          <Slider label="Braking sharpness" value={cfg.easePower} min={1.5} max={6} step={0.1} on={v => set({ easePower: v })} />

          {cfg.mode === 'auto' && (
            <>
              <Slider label="Pause at each stop" value={cfg.dwell} min={0} max={5} step={0.1} unit=" s" on={v => set({ dwell: v })} />
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input type="checkbox" className="accent-cyan-400" checked={cfg.loop} onChange={e => set({ loop: e.target.checked })} /> Loop back to start
              </label>
            </>
          )}
        </Group>

        <Group title="Look">
          <div className="grid grid-cols-2 gap-3">
            <Color label="Background left" value={cfg.bgFrom} on={v => set({ bgFrom: v })} />
            <Color label="Background right" value={cfg.bgTo} on={v => set({ bgTo: v })} />
          </div>
          <Slider label="Dark area width" value={cfg.bgSplit} min={0} max={80} step={1} unit="%" on={v => set({ bgSplit: v })} />
          <Color label="Text and ticks" value={cfg.fontColor} on={v => set({ fontColor: v })} />
        </Group>
      </Section>

      <Section title="Components">
        {REGISTRY.map(({ id, label, Controls: C }) => (
          <section key={id} className="space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <label className="flex cursor-pointer items-center justify-between text-sm font-semibold text-white">
              {label}
              <input type="checkbox" className="size-4 accent-cyan-400" checked={cfg.show[id]} onChange={e => set({ show: { ...cfg.show, [id]: e.target.checked } })} />
            </label>
            {cfg.show[id] && C && <C cfg={cfg} set={set} />}
          </section>
        ))}
      </Section>
    </aside>
  )
}
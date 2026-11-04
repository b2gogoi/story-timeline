import { useState } from 'react'
import { type ComponentId } from '../lib/timeline'
import { type Config, toDay, toISO } from '../lib/timeline'
import { REGISTRY } from './registry'
import { Color, Group, Row, Section, Slider, btn, input } from './ui'

type Props = {
  cfg: Config; set: (p: Partial<Config>) => void
  playing: boolean; onToggle: () => void; onRestart: () => void
  selected: ComponentId | 'global'; onSelect: (id: ComponentId | 'global') => void
}

export function Controls({ cfg, set, playing, onToggle, onRestart, selected, onSelect }: Props) {
  const [evenN, setEvenN] = useState(4)
  const days = Math.abs(toDay(cfg.end) - toDay(cfg.start))
  const last = cfg.stops.length + 1
  const counterStart = cfg.rollingValues[0] ?? 0
  const counterEnd = cfg.rollingValues[last] ?? 0
  const counterRange = Math.abs(counterEnd - counterStart)
  const setStop = (i: number, v: string) => set({ stops: cfg.stops.map((s, k) => (k === i ? v : s)) })
  const spread = () => {
    const a = toDay(cfg.start), b = toDay(cfg.end)
    const imageEnd = cfg.storyImages[cfg.storyImages.length - 1] ?? ''
    const cityStart = cfg.storyCities[0] ?? ''
    const cityEnd = cfg.storyCities[cfg.storyCities.length - 1] ?? ''
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
      storyImages: Array.from({ length: evenN + 2 }, (_, k) => {
        if (k === 0) return cfg.storyImages[0] ?? ''
        if (k === evenN + 1) return imageEnd
        return `https://picsum.photos/seed/story-timeline-stop-${k}/1080/1200`
      }),
      storyCities: Array.from({ length: evenN + 2 }, (_, k) =>
        k === 0 ? cityStart : k === evenN + 1 ? cityEnd : '',
      ),
    })
  }

  const addStop = () => {
    const values = cfg.rollingValues
    const images = cfg.storyImages
    const lastStop = values[values.length - 2] ?? values[0] ?? 0
    const end = values[values.length - 1] ?? 0
    const endImage = images[images.length - 1] ?? ''
    const cities = cfg.storyCities
    const endCity = cities[cities.length - 1] ?? ''

    set({
      stops: [...cfg.stops, cfg.end],
      rollingValues: [...values.slice(0, -1), Math.round((lastStop + end) / 2), end],
      storyImages: [
        ...images.slice(0, -1),
        `https://picsum.photos/seed/story-timeline-stop-${cfg.stops.length + 1}/1080/1200`,
        endImage,
      ],
      storyCities: [...cities.slice(0, -1), '', endCity],
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

      <Section title="Controls and Preview">
        <button
          type="button"
          onClick={() => onSelect('global')}
          aria-pressed={selected === 'global'}
          className={`w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm font-semibold hover:text-cyan-200 ${selected === 'global' ? 'text-cyan-200' : 'text-white'}`}
        >
          Global
        </button>
        {REGISTRY.map(({ id, label, Controls: C }) => (
          <section key={id} className="space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-white">
              <button
                type="button"
                onClick={() => onSelect(id)}
                aria-pressed={selected === id}
                className={`flex-1 rounded px-1 py-1 text-left hover:text-cyan-200 ${selected === id ? 'text-cyan-200' : ''}`}
              >
                {label}
              </button>
              <input
                type="checkbox"
                className="size-4 accent-cyan-400"
                aria-label={`Show ${label} in story`}
                checked={cfg.show[id]}
                onChange={e => set({ show: { ...cfg.show, [id]: e.target.checked } })}
              />
            </div>
          </section>
        ))}
      </Section>
    </aside>
  )
}
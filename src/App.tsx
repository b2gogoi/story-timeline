import { useMemo, useState } from 'react'
import { Controls } from './components/Controls'
import { Story } from './components/Story'
import { type Config, buildPlan, toDay } from './lib/timeline'

const initial: Config = {
  bgFrom: '#020c12', bgTo: '#0e8aa0', bgSplit: 25, fontColor: '#e6f4f7',
  speed: 18, easePower: 3, dwell: 1.2, direction: 'up', monthsVisible: 30, loop: true,
  start: '2019-10-12', end: '2026-10-06',
  stops: ['2019-12-07', '2021-11-28', '2022-11-26', '2024-10-05', '2025-11-23', '2026-08-29'],
}

export default function App() {
  const [cfg, setCfg] = useState(initial)
  const [playing, setPlaying] = useState(true)
  const [run, setRun] = useState(0)
  const set = (p: Partial<Config>) => setCfg(c => ({ ...c, ...p }))

  const plan = useMemo(
    () => buildPlan([cfg.start, ...cfg.stops, cfg.end].map(toDay), cfg),
    [cfg.start, cfg.end, cfg.stops, cfg.speed, cfg.easePower, cfg.dwell, cfg.loop], // eslint-disable-line react-hooks/exhaustive-deps
  )

  return (
    <div className="flex h-screen bg-neutral-900 font-sans">
      <Controls cfg={cfg} set={set} playing={playing} onToggle={() => setPlaying(p => !p)} onRestart={() => setRun(r => r + 1)} />
      <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 p-6">
        <div className="h-[calc(100vh-6rem)] max-h-[960px] rounded-2xl shadow-2xl ring-1 ring-white/10 overflow-hidden">
          <Story key={run} cfg={cfg} plan={plan} playing={playing} />
        </div>
        <p className="text-xs text-white/40">Story format 9:16 (1080 × 1920)</p>
      </main>
    </div>
  )
}

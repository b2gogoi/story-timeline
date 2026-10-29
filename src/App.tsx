// import { useMemo, useState } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { btn } from './components/ui'
import { Controls } from './components/Controls'
import { Story } from './components/Story'
import { TimelineClock } from './lib/clock'
import { type Config, buildPlan, toDay } from './lib/timeline'
import { StepControls } from './components/StepControls'

const initial: Config = {
  bgFrom: '#073738', bgTo: '#347d73', bgSplit: 25, fontColor: '#e6f4f7',
  speed: 18, easePower: 3, dwell: 1.2, direction: 'up', monthsVisible: 30, loop: true,
  start: '2019-10-12', end: '2026-10-06',
  stops: ['2019-12-07', '2021-11-28', '2022-11-26', '2024-10-05', '2025-11-23', '2026-08-29'],
  dob: '1982-09-24',
  show: { ruler: true, counter: true, dial: true },
  mode: 'auto',
}

export default function App() {
  const [cfg, setCfg] = useState(initial)
  const [playing, setPlaying] = useState(true)
  const [run, setRun] = useState(0)
  const set = (p: Partial<Config>) => setCfg(c => ({ ...c, ...p }))
  const [full, setFull] = useState(false)

  const plan = useMemo(
    () => buildPlan([cfg.start, ...cfg.stops, cfg.end].map(toDay), cfg),
    [cfg.start, cfg.end, cfg.stops, cfg.speed, cfg.easePower, cfg.dwell, cfg.loop], // eslint-disable-line react-hooks/exhaustive-deps
  )

  useEffect(() => {
    const onChange = () => setFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  
  const toggleFull = () =>
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
  
  // "F" toggles full screen (ignored while typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return
      if (e.key === 'f' || e.key === 'F') toggleFull()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <TimelineClock key={run} plan={plan} playing={playing} mode={cfg.mode}>
      <div className="flex h-screen bg-neutral-900 font-sans">
        <Controls cfg={cfg} set={set} playing={playing} onToggle={() => setPlaying(p => !p)} onRestart={() => setRun(r => r + 1)} />
        <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 p-6">
  <div className="h-[calc(100vh-7rem)] max-h-[960px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
    <Story cfg={cfg} plan={plan} />
  </div>
  <div className="flex items-center gap-4">
    {cfg.mode === 'manual'
      ? <StepControls count={cfg.stops.length + 2} />
      : <p className="text-xs text-white/40">Story format 9:16 (1080 × 1920)</p>}
    <button className={btn} onClick={toggleFull}>{full ? 'Exit full screen' : 'Full screen'}</button>
  </div>
</main>
      </div>
    </TimelineClock>
  )
}

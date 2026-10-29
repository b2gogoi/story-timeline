import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { type Plan, easeOut, easePowerForStop, moveDuration, positionAt } from './timeline'

export type Frame = { day: number; progress: number; units: number }
type Listener = (f: Frame) => void
type Api = {
  subscribe: (fn: Listener) => () => void
  onStop: (fn: (i: number) => void) => () => void
  getStop: () => number
  next: () => void
  prev: () => void
}
const Ctx = createContext<Api>(null!)

type Props = { plan: Plan; playing: boolean; mode: 'auto' | 'manual'; children: ReactNode }

export function TimelineClock({ plan, playing, mode, children }: Props) {
  const listeners = useRef(new Set<Listener>())
  const stopListeners = useRef(new Set<(i: number) => void>())
  const clock = useRef(0)                       // auto-mode plan time
  const live = useRef({ plan, playing, mode })
  live.current = { plan, playing, mode }
  const man = useRef({ index: 0, moving: false, from: 0, to: 0, t: 0, dur: 0, power: 3 })
  const lastDay = useRef(plan.points[0])
  const prevMode = useRef(mode)

  const setIndex = (i: number) => { man.current.index = i; stopListeners.current.forEach(fn => fn(i)) }
  const goTo = (i: number, fromDay: number) => {
    const { plan } = live.current
    const m = man.current
    m.from = fromDay; m.to = plan.points[i]; m.t = 0
    m.power = easePowerForStop(plan.power, i, plan.points.length - 1)
    m.dur = moveDuration(Math.abs(m.to - m.from), plan.speed, m.power)
    m.moving = true
    setIndex(i)
  }
  const step = (d: 1 | -1) => {
    if (live.current.mode !== 'manual') return
    const i = man.current.index + d
    if (i < 0 || i > live.current.plan.points.length - 1) return
    goTo(i, lastDay.current)   // retargets from wherever it is, so fast clicks chain smoothly
  }

  useEffect(() => {
    let raf = 0, last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const { plan, playing, mode } = live.current
      const m = man.current
      const lastIdx = plan.points.length - 1

      if (mode !== prevMode.current) {
        prevMode.current = mode
        if (mode === 'manual') {   // glide to the nearest stop
          let best = 0
          plan.points.forEach((p, i) => { if (Math.abs(p - lastDay.current) < Math.abs(plan.points[best] - lastDay.current)) best = i })
          goTo(best, lastDay.current)
        } else {                   // resume auto from the current stop
          m.moving = false
          clock.current = plan.arrive[Math.min(m.index, lastIdx)] ?? 0
        }
      }

      let day: number
      if (mode === 'manual') {
        if (m.index > lastIdx) setIndex(lastIdx)
        if (m.moving) {
          m.t += dt
          const p = Math.min(1, m.t / m.dur)
          day = m.from + (m.to - m.from) * easeOut(p, m.power)
          if (p >= 1) { m.moving = false; day = m.to }
        } else day = plan.points[m.index]
      } else {
        if (playing) clock.current += dt
        day = positionAt(plan, clock.current)
      }

      lastDay.current = day
      const a = plan.points[0], b = plan.points[lastIdx]
      const progress = b === a ? 0 : (day - a) / (b - a)
      const f = { day, progress, units: progress * 1000 }
      listeners.current.forEach(fn => fn(f))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // keyboard: arrows step through stops in manual mode (ignored while typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') step(1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const api = useMemo<Api>(() => ({
    subscribe: fn => { listeners.current.add(fn); return () => { listeners.current.delete(fn) } },
    onStop: fn => { stopListeners.current.add(fn); return () => { stopListeners.current.delete(fn) } },
    getStop: () => man.current.index,
    next: () => step(1),
    prev: () => step(-1),
  }), [])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useFrame(fn: Listener) {
  const { subscribe } = useContext(Ctx)
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => subscribe(f => ref.current(f)), [subscribe])
}

export const useClock = () => useContext(Ctx)

/** Index of the stop being shown or travelled to (manual mode). Re-renders only when it changes. */
export function useStop() {
  const { onStop, getStop } = useContext(Ctx)
  const [i, setI] = useState(getStop)
  useEffect(() => onStop(setI), [onStop])
  return i
}
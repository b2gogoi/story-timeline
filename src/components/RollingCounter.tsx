import { useEffect, useRef, useState } from 'react'
import { useFrame } from '../lib/clock'
import { type ControlProps, type ViewProps } from '../lib/timeline'
import { Group, Row, input } from './ui'

const DIGIT_HEIGHT = 11 // cqw; keep in sync with the drum and ribbon row heights
let soundEnabled = true
let audioContext: AudioContext | null = null
let lastSoundTime = 0

function unlockAudio() {
  if (!audioContext) audioContext = new AudioContext()
  if (audioContext.state === 'suspended') void audioContext.resume()
}

function playMechanicalTick() {
  const context = audioContext
  if (!soundEnabled || !context || context.state !== 'running') return
  const now = context.currentTime
  if (now - lastSoundTime < 0.025) return
  lastSoundTime = now

  const length = Math.floor(context.sampleRate * 0.012)
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.28))

  const noise = context.createBufferSource()
  noise.buffer = buffer
  const filter = context.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(1700 + Math.random() * 500, now)
  filter.Q.setValueAtTime(2.8, now)
  const noiseGain = context.createGain()
  noiseGain.gain.setValueAtTime(0.16, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.014)
  noise.connect(filter).connect(noiseGain).connect(context.destination)

  const thump = context.createOscillator()
  thump.type = 'triangle'
  thump.frequency.setValueAtTime(125, now)
  thump.frequency.exponentialRampToValueAtTime(48, now + 0.022)
  const thumpGain = context.createGain()
  thumpGain.gain.setValueAtTime(0.12, now)
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.024)
  thump.connect(thumpGain).connect(context.destination)

  noise.start(now)
  noise.stop(now + 0.015)
  thump.start(now)
  thump.stop(now + 0.026)
}

function valueAt(day: number, points: number[], values: number[]) {
  if (points.length < 2) return values[0] ?? 0
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i], to = points[i + 1]
    if (day >= Math.min(from, to) && day <= Math.max(from, to)) {
      const progress = from === to ? 1 : Math.max(0, Math.min(1, (day - from) / (to - from)))
      const start = values[i] ?? 0
      const end = values[i + 1] ?? start
      return start + (end - start) * progress
    }
  }
  return day < Math.min(...points) ? values[0] ?? 0 : values[values.length - 1] ?? 0
}

export function RollingCounter({ cfg, plan }: ViewProps) {
  const ribbons = useRef<Array<HTMLSpanElement | null>>([])
  const previousInteger = useRef<number | null>(null)

  useEffect(() => {
    const unlock = () => {
      unlockAudio()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useFrame(({ day }) => {
    const value = Math.max(0, Math.min(9999, valueAt(day, plan.points, cfg.rollingValues)))
    const integer = Math.floor(value)
    if (previousInteger.current !== null && integer !== previousInteger.current) playMechanicalTick()
    previousInteger.current = integer

    // The units wheel turns continuously; each higher wheel engages only as
    // the wheel to its right passes through 9 into 0.
    for (let index = 3; index >= 0; index--) {
      const place = 10 ** (3 - index)
      let digitWithFraction: number
      if (index === 3) {
        digitWithFraction = value % 10
      } else {
        const childDigit = (value / (place / 10)) % 10
        const wholeDigit = Math.floor((value / place) % 10)
        digitWithFraction = childDigit > 9 ? wholeDigit + childDigit - 9 : wholeDigit
      }

      const digit = ((digitWithFraction % 10) + 10) % 10
      const ribbon = ribbons.current[index]
      if (ribbon) ribbon.style.transform = `translate3d(0, -${(10 + digit) * DIGIT_HEIGHT}cqw, 0)`
    }
  })

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[20cqw] z-10 flex justify-center" aria-label="Rolling counter">
      <div className="relative rounded-[1.8cqw] border border-white/15 bg-gradient-to-b from-[#282b2e] via-[#151719] to-[#08090a] p-[1.8cqw] shadow-[0_2cqw_4cqw_rgba(0,0,0,0.75),inset_0_0.5cqw_0.6cqw_rgba(255,255,255,0.14),inset_0_-0.8cqw_1cqw_rgba(0,0,0,0.9)]">
        <div className="rounded-[0.8cqw] border border-black bg-[#030405] p-[0.7cqw] shadow-[inset_0_0.8cqw_1.4cqw_rgba(0,0,0,0.95),0_0.3cqw_0.5cqw_rgba(255,255,255,0.12)]">
          <div className="relative flex overflow-hidden rounded-[0.45cqw] bg-black">
            {[0, 1, 2, 3].map(index => (
              <div key={index} className="relative h-[11cqw] w-[10cqw] overflow-hidden border-r border-black/30 bg-gradient-to-r from-[#b5b5b1] via-[#f0eee7] to-[#aaa9a3] last:border-r-0">
                <span ref={node => { ribbons.current[index] = node }} className="absolute left-0 top-0 flex flex-col will-change-transform" style={{ width: '100%' }}>
                  {Array.from({ length: 30 }, (_, n) => {
                    const digit = n % 10
                    const color = index >= 2
                      ? 'text-[#bf2525] [text-shadow:0_1px_0_rgba(255,190,190,0.35),0_-1px_0_rgba(70,0,0,0.45)]'
                      : 'text-[#111315] [text-shadow:0_1px_0_rgba(255,255,255,0.5),0_-1px_0_rgba(0,0,0,0.25)]'
                    return (
                      <span key={n} className={`flex shrink-0 items-center justify-center font-mono text-[8.2cqw] font-bold leading-none tabular-nums ${color}`} style={{ height: `${DIGIT_HEIGHT}cqw` }}>
                        {digit}
                      </span>
                    )
                  })}
                </span>
              </div>
            ))}
            <div className="pointer-events-none absolute inset-0 z-10 rounded-[0.45cqw] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.28)_12%,rgba(255,255,255,0.2)_23%,transparent_38%,transparent_62%,rgba(0,0,0,0.3)_84%,rgba(0,0,0,0.68)_100%)]" />
          </div>
        </div>
      </div>
    </div>
  )
}

function RollingCounterControls({ cfg, set }: ControlProps) {
  const [sound, setSound] = useState(soundEnabled)
  const update = (index: number, raw: string) => {
    const values = [...cfg.rollingValues]
    values[index] = Math.max(0, Math.min(9999, Math.floor(Number(raw) || 0)))
    set({ rollingValues: values })
  }
  const field = (label: string, index: number) => (
    <Row label={label}>
      <input type="number" min={0} max={9999} step={1} className={input} value={cfg.rollingValues[index] ?? 0} onChange={e => update(index, e.target.value)} />
    </Row>
  )

  return (
    <Group title="Counter values">
      <p className="text-xs text-white/50">Enter a value from 0000 to 9999 for each timeline point. The counter rolls between them.</p>
      {field('Start', 0)}
      {cfg.stops.map((_, i) => field(`Stop ${i + 1}`, i + 1))}
      {field('End', cfg.stops.length + 1)}
      <label className="flex items-center gap-2 text-sm text-white/80">
        <input type="checkbox" className="accent-cyan-400" checked={sound} onChange={e => { soundEnabled = e.target.checked; setSound(e.target.checked) }} />
        Mechanical tick sound
      </label>
    </Group>
  )
}

export { RollingCounterControls }
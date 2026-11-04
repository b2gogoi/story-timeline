import { Fragment, useEffect, useRef, useState } from 'react'
import { START_PAUSE_SECONDS, useFrame } from '../lib/clock'
import { type ControlProps, type ViewProps, valueAt } from '../lib/timeline'
import { Group, Row, input } from './ui'

const DIGIT_HEIGHT = 19 // cqw; keep in sync with the drum and ribbon row heights
let soundEnabled = true
let audioContext: AudioContext | null = null
let lastSoundTime = 0

function unlockAudio() {
  if (!audioContext) audioContext = new AudioContext()
  return audioContext.state === 'suspended' ? audioContext.resume() : Promise.resolve()
}

function playMechanicalTick() {
  const context = audioContext
  if (!soundEnabled || !context || context.state !== 'running') return
  const now = context.currentTime
  const gap = now - lastSoundTime
  if (gap < 0.025) return
  lastSoundTime = now
  const weight = Math.min(1, gap / 0.35) // 0 = fast clatter, 1 = slow, heavy tick

  const length = Math.floor(context.sampleRate * (0.012 + weight * 0.01))
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.28))

  const noise = context.createBufferSource()
  noise.buffer = buffer
  const filter = context.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(1700 - weight * 500 + Math.random() * 500, now)
  filter.Q.setValueAtTime(2.8, now)
  const noiseGain = context.createGain()
  noiseGain.gain.setValueAtTime(0.16 * (1 + weight * 0.9), now)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.014 + weight * 0.012)
  noise.connect(filter).connect(noiseGain).connect(context.destination)

  const thump = context.createOscillator()
  thump.type = 'triangle'
  thump.frequency.setValueAtTime(125 - weight * 30, now)
  thump.frequency.exponentialRampToValueAtTime(48, now + 0.022 + weight * 0.03)
  const thumpGain = context.createGain()
  thumpGain.gain.setValueAtTime(0.12 * (1 + weight * 1.4), now)
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.024 + weight * 0.04)
  thump.connect(thumpGain).connect(context.destination)

  noise.start(now)
  noise.stop(now + 0.015 + weight * 0.012)
  thump.start(now)
  thump.stop(now + 0.026 + weight * 0.04)
}

function playFinalClunk() {
  const context = audioContext
  if (!soundEnabled || !context || context.state !== 'running') return
  const now = context.currentTime + 0.02

  const thud = context.createOscillator()
  thud.type = 'sine'
  thud.frequency.setValueAtTime(110, now)
  thud.frequency.exponentialRampToValueAtTime(38, now + 0.28)
  const thudGain = context.createGain()
  thudGain.gain.setValueAtTime(0.5, now)
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
  thud.connect(thudGain).connect(context.destination)
  thud.start(now)
  thud.stop(now + 0.46)

  const length = Math.floor(context.sampleRate * 0.05)
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.2))
  const click = context.createBufferSource()
  click.buffer = buffer
  const clickFilter = context.createBiquadFilter()
  clickFilter.type = 'bandpass'
  clickFilter.frequency.setValueAtTime(1100, now)
  clickFilter.Q.setValueAtTime(1.6, now)
  const clickGain = context.createGain()
  clickGain.gain.setValueAtTime(0.35, now)
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
  click.connect(clickFilter).connect(clickGain).connect(context.destination)
  click.start(now)
  click.stop(now + 0.06)

  const ring = context.createOscillator()
  ring.type = 'triangle'
  ring.frequency.setValueAtTime(1960, now)
  const ringGain = context.createGain()
  ringGain.gain.setValueAtTime(0.05, now)
  ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
  ring.connect(ringGain).connect(context.destination)
  ring.start(now)
  ring.stop(now + 0.5)
}

export function RollingCounter({ cfg, plan }: ViewProps) {
  const ribbons = useRef<Array<HTMLSpanElement | null>>([])
  const previousInteger = useRef<number | null>(null)
  const finaleDone = useRef(false)
  const startupTicksThrough = useRef(0)
  const previousStartProgress = useRef(1)

  useEffect(() => {
    const unlock = () => {
      void unlockAudio()
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

  useFrame(({ day, startProgress }) => {
    const startValue = Math.max(0, Math.min(9999, Math.floor(cfg.rollingValues[0] ?? 0)))
    const targetDigits = [0, 1, 2, 3].map(index => Math.floor(startValue / 10 ** (3 - index)) % 10)
    const totalStartupRotations = targetDigits.reduce((sum, digit) => sum + digit, 0)
    const value = Math.max(0, Math.min(9999, startProgress < 1 ? startValue : valueAt(day, plan.points, cfg.rollingValues)))
    const integer = Math.floor(value)
    if (startProgress < 1) {
      if (previousStartProgress.current >= 1) startupTicksThrough.current = 0
      const rotationsProgress = startProgress * totalStartupRotations
      const completedRotations = Math.min(totalStartupRotations, Math.floor(rotationsProgress + 1e-7))
      for (let tick = startupTicksThrough.current + 1; tick <= completedRotations; tick++) playMechanicalTick()
      startupTicksThrough.current = completedRotations
      previousInteger.current = null
    } else {
      if (previousInteger.current !== null && integer !== previousInteger.current) playMechanicalTick()
      previousInteger.current = integer
      startupTicksThrough.current = totalStartupRotations
    }
    previousStartProgress.current = startProgress
    const end = plan.points[plan.points.length - 1]
    const atEnd = plan.points.length > 1 && Math.abs(day - end) < 1e-6
    if (atEnd && !finaleDone.current) playFinalClunk()
    finaleDone.current = atEnd

    // The units wheel turns continuously during playback; higher wheels engage as
    // the wheel to their right passes through 9 into 0. Startup advances one step at a time.
    for (let index = 3; index >= 0; index--) {
      const place = 10 ** (3 - index)
      let digitWithFraction: number
      if (startProgress < 1) {
        const destination = targetDigits[index]
        const rotationsBefore = targetDigits.slice(index + 1).reduce((sum, digit) => sum + digit, 0)
        const rotationsOnWheel = Math.max(0, Math.min(destination, startProgress * totalStartupRotations - rotationsBefore))
        const completedOnWheel = Math.floor(rotationsOnWheel)
        const stepProgress = rotationsOnWheel - completedOnWheel
        const easedStep = 1 - (1 - stepProgress) ** 3
        digitWithFraction = rotationsOnWheel >= destination ? destination : completedOnWheel + easedStep
      } else if (index === 3) {
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
    <div className="pointer-events-none absolute inset-x-0 top-[28cqw] z-10 flex -translate-x-[3cqw] justify-center" aria-label="Rolling counter">
    {/* <div className="pointer-events-none absolute inset-x-0 top-[22cqw] z-10 flex -translate-x-[3cqw] justify-center" aria-label="Rolling counter"> */}
      <div className="relative rounded-[2.2cqw] border border-white/20 bg-gradient-to-b from-[#303438] via-[#171a1d] to-[#070809] p-[2.4cqw] shadow-[0_3cqw_5cqw_rgba(0,0,0,0.8),inset_0_0.6cqw_0.8cqw_rgba(255,255,255,0.16),inset_0_-1cqw_1.2cqw_rgba(0,0,0,0.95)]">
        <div className="rounded-[1cqw] border border-black bg-[#030405] p-[0.9cqw] shadow-[inset_0_1cqw_1.6cqw_rgba(0,0,0,0.95),0_0.35cqw_0.6cqw_rgba(255,255,255,0.16)]">
          <div className="relative flex items-center gap-[0.7cqw] overflow-hidden rounded-[0.6cqw] bg-[#030405]">
            {[0, 1, 2, 3].map(index => (
              <Fragment key={index}>
                {index === 2 && (
                  <span aria-hidden="true" className="mx-[0.35cqw] h-[19cqw] w-[0.75cqw] shrink-0 rounded-full bg-gradient-to-r from-[#08090a] via-[#c0c5c9] to-[#090a0b] shadow-[0.15cqw_0_0.35cqw_rgba(0,0,0,0.85),-0.1cqw_0_0.25cqw_rgba(255,255,255,0.4)]" />
                )}
                <div className="relative h-[19cqw] w-[17cqw] shrink-0 overflow-hidden rounded-[0.65cqw] border border-white/35 bg-gradient-to-r from-[#999b99] via-[#f1efe8] to-[#8f918f] shadow-[inset_0.6cqw_0_0.8cqw_rgba(255,255,255,0.7),inset_-0.65cqw_0_0.9cqw_rgba(0,0,0,0.42),0_0.2cqw_0.3cqw_rgba(0,0,0,0.7)]">
                  <span ref={node => { ribbons.current[index] = node }} className="absolute left-0 top-0 flex flex-col will-change-transform" style={{ width: '100%' }}>
                    {Array.from({ length: 30 }, (_, n) => {
                      const digit = n % 10
                      const color = index >= 2
                        ? 'text-[#c51f25] [text-shadow:0_1px_0_rgba(255,190,190,0.45),0_-1px_0_rgba(70,0,0,0.55)]'
                        : 'text-[#101214] [text-shadow:0_1px_0_rgba(255,255,255,0.58),0_-1px_0_rgba(0,0,0,0.34)]'
                      return (
                        <span key={n} className={`flex shrink-0 items-center justify-center font-sans text-[14.2cqw] font-bold leading-none tabular-nums ${color}`} style={{ height: `${DIGIT_HEIGHT}cqw` }}>
                          {digit}
                        </span>
                      )
                    })}
                  </span>
                </div>
              </Fragment>
            ))}
            <div className="pointer-events-none absolute inset-0 z-10 rounded-[0.6cqw] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.58)_0%,rgba(0,0,0,0.24)_12%,rgba(255,255,255,0.25)_23%,transparent_38%,transparent_62%,rgba(0,0,0,0.28)_84%,rgba(0,0,0,0.65)_100%)]" />
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
        <input type="checkbox" className="accent-cyan-400" checked={sound} onChange={e => { const enabled = e.target.checked; soundEnabled = enabled; setSound(enabled); if (enabled) void unlockAudio().then(() => playMechanicalTick()) }} />
        Mechanical tick sound
      </label>
    </Group>
  )
}

export { RollingCounterControls }
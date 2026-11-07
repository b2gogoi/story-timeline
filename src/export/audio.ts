import { frameAtTime } from '../lib/clock'
import { CounterSoundTracker } from '../lib/counterSound'
import { scheduleClunk, scheduleTick } from '../lib/sound'
import { type Plan } from '../lib/timeline'

export type SoundEvent =
  | { kind: 'tick'; time: number; weight: number }
  | { kind: 'clunk'; time: number }

/** Replays the clip frame by frame through the same tracker the live counter uses. */
export function simulateSoundEvents(plan: Plan, values: number[], duration: number, stepsPerSecond = 120): SoundEvent[] {
  const tracker = new CounterSoundTracker()
  const events: SoundEvent[] = []
  let lastTick = -10 // silence before the clip, so the first tick is a heavy one
  const steps = Math.ceil(duration * stepsPerSecond)
  for (let k = 0; k <= steps; k++) {
    const t = k / stepsPerSecond
    tracker.update(
      frameAtTime(plan, t),
      plan,
      values,
      () => {
        const gap = t - lastTick
        if (gap < 0.025) return // same rate limit as live playback
        lastTick = t
        events.push({ kind: 'tick', time: t, weight: Math.min(1, gap / 0.35) })
      },
      () => events.push({ kind: 'clunk', time: t + 0.02 }),
    )
  }
  return events
}

/** Small seeded random generator, so every export of the same story sounds identical. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type RenderedAudio = { wavBase64: string; ticks: number; clunks: number; peakBefore: number }

/** Renders the clip's sound to a 16-bit stereo WAV, normalized to a -1 dBFS peak. */
export async function renderAudio(plan: Plan, values: number[], duration: number, sampleRate = 48000): Promise<RenderedAudio> {
  const events = simulateSoundEvents(plan, values, duration)
  const random = mulberry32(0x5eed)
  const tail = 0.75
  const context = new OfflineAudioContext(2, Math.ceil((duration + tail) * sampleRate), sampleRate)
  for (const e of events) {
    if (e.kind === 'tick') scheduleTick(context, e.time, e.weight, random)
    else scheduleClunk(context, e.time, random)
  }
  const rendered = await context.startRendering()

  const length = Math.round(duration * sampleRate)
  const left = rendered.getChannelData(0)
  const right = rendered.numberOfChannels > 1 ? rendered.getChannelData(1) : left
  let peak = 0
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]))
  const gain = peak > 0 ? 0.89 / peak : 1 // 0.89 is about -1 dBFS

  const bytes = new Uint8Array(44 + length * 4)
  const view = new DataView(bytes.buffer)
  const text = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)) }
  text(0, 'RIFF'); view.setUint32(4, 36 + length * 4, true); text(8, 'WAVE'); text(12, 'fmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 2, true)
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 4, true); view.setUint16(32, 4, true); view.setUint16(34, 16, true)
  text(36, 'data'); view.setUint32(40, length * 4, true)
  const pcm = (x: number) => Math.round(Math.max(-1, Math.min(1, x * gain)) * 32767)
  for (let i = 0; i < length; i++) {
    view.setInt16(44 + i * 4, pcm(left[i]), true)
    view.setInt16(46 + i * 4, pcm(right[i]), true)
  }

  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return {
    wavBase64: btoa(binary),
    ticks: events.filter(e => e.kind === 'tick').length,
    clunks: events.filter(e => e.kind === 'clunk').length,
    peakBefore: peak,
  }
}

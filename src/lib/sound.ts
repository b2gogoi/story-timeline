/**
 * The mechanical sounds, written against BaseAudioContext so the same code plays live
 * (AudioContext) and renders offline for video export (OfflineAudioContext).
 */

/** A short click plus thump. weight: 0 = fast clatter, 1 = slow, heavy tick. */
export function scheduleTick(context: BaseAudioContext, when: number, weight: number, random: () => number = Math.random) {
  const length = Math.floor(context.sampleRate * (0.012 + weight * 0.01))
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) samples[i] = (random() * 2 - 1) * Math.exp(-i / (length * 0.28))

  const noise = context.createBufferSource()
  noise.buffer = buffer
  const filter = context.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(1700 - weight * 500 + random() * 500, when)
  filter.Q.setValueAtTime(2.8, when)
  const noiseGain = context.createGain()
  noiseGain.gain.setValueAtTime(0.16 * (1 + weight * 0.9), when)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, when + 0.014 + weight * 0.012)
  noise.connect(filter).connect(noiseGain).connect(context.destination)

  const thump = context.createOscillator()
  thump.type = 'triangle'
  thump.frequency.setValueAtTime(125 - weight * 30, when)
  thump.frequency.exponentialRampToValueAtTime(48, when + 0.022 + weight * 0.03)
  const thumpGain = context.createGain()
  thumpGain.gain.setValueAtTime(0.12 * (1 + weight * 1.4), when)
  thumpGain.gain.exponentialRampToValueAtTime(0.001, when + 0.024 + weight * 0.04)
  thump.connect(thumpGain).connect(context.destination)

  noise.start(when)
  noise.stop(when + 0.015 + weight * 0.012)
  thump.start(when)
  thump.stop(when + 0.026 + weight * 0.04)
}

/** The closing clunk: a low thud, a latch click and a short metallic ring. */
export function scheduleClunk(context: BaseAudioContext, when: number, random: () => number = Math.random) {
  const thud = context.createOscillator()
  thud.type = 'sine'
  thud.frequency.setValueAtTime(110, when)
  thud.frequency.exponentialRampToValueAtTime(38, when + 0.28)
  const thudGain = context.createGain()
  thudGain.gain.setValueAtTime(0.5, when)
  thudGain.gain.exponentialRampToValueAtTime(0.001, when + 0.45)
  thud.connect(thudGain).connect(context.destination)
  thud.start(when)
  thud.stop(when + 0.46)

  const length = Math.floor(context.sampleRate * 0.05)
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) samples[i] = (random() * 2 - 1) * Math.exp(-i / (length * 0.2))
  const click = context.createBufferSource()
  click.buffer = buffer
  const clickFilter = context.createBiquadFilter()
  clickFilter.type = 'bandpass'
  clickFilter.frequency.setValueAtTime(1100, when)
  clickFilter.Q.setValueAtTime(1.6, when)
  const clickGain = context.createGain()
  clickGain.gain.setValueAtTime(0.35, when)
  clickGain.gain.exponentialRampToValueAtTime(0.001, when + 0.06)
  click.connect(clickFilter).connect(clickGain).connect(context.destination)
  click.start(when)
  click.stop(when + 0.06)

  const ring = context.createOscillator()
  ring.type = 'triangle'
  ring.frequency.setValueAtTime(1960, when)
  const ringGain = context.createGain()
  ringGain.gain.setValueAtTime(0.05, when)
  ringGain.gain.exponentialRampToValueAtTime(0.001, when + 0.5)
  ring.connect(ringGain).connect(context.destination)
  ring.start(when)
  ring.stop(when + 0.5)
}

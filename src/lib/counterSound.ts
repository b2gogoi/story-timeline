import { type Plan, valueAt } from './timeline'

/**
 * Decides when the rolling counter makes a sound. The live counter and the video export both
 * feed it one frame at a time, so they always agree.
 *  - startup: one tick for every digit step completed while the counter rolls up from 0000
 *  - playback: one tick whenever the integer value changes
 *  - end: one clunk when the timeline settles on the final point
 */
export class CounterSoundTracker {
  private previousInteger: number | null = null
  private startupTicksThrough = 0
  private previousStartProgress = 1
  private finaleDone = false

  update(frame: { day: number; startProgress: number }, plan: Plan, values: number[], tick: () => void, clunk: () => void) {
    const { day, startProgress } = frame
    const startValue = Math.max(0, Math.min(9999, Math.floor(values[0] ?? 0)))
    const targetDigits = [0, 1, 2, 3].map(index => Math.floor(startValue / 10 ** (3 - index)) % 10)
    const totalStartupRotations = targetDigits.reduce((sum, digit) => sum + digit, 0)
    const value = Math.max(0, Math.min(9999, startProgress < 1 ? startValue : valueAt(day, plan.points, values)))
    const integer = Math.floor(value)

    if (startProgress < 1) {
      if (this.previousStartProgress >= 1) this.startupTicksThrough = 0
      const rotationsProgress = startProgress * totalStartupRotations
      const completedRotations = Math.min(totalStartupRotations, Math.floor(rotationsProgress + 1e-7))
      for (let n = this.startupTicksThrough + 1; n <= completedRotations; n++) tick()
      this.startupTicksThrough = completedRotations
      this.previousInteger = null
    } else {
      if (this.previousInteger !== null && integer !== this.previousInteger) tick()
      this.previousInteger = integer
      this.startupTicksThrough = totalStartupRotations
    }
    this.previousStartProgress = startProgress

    const end = plan.points[plan.points.length - 1]
    const atEnd = plan.points.length > 1 && Math.abs(day - end) < 1e-6
    if (atEnd && !this.finaleDone) clunk()
    this.finaleDone = atEnd
  }
}

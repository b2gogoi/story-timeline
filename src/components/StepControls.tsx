import { useClock, useStop } from '../lib/clock'
import { btn } from './ui'

const dis = 'disabled:pointer-events-none disabled:opacity-40'

export function StepControls({ count }: { count: number }) {
  const { next, prev } = useClock()
  const i = useStop()
  return (
    <div className="flex items-center gap-3">
      <button className={`${btn} ${dis}`} disabled={i <= 0} onClick={prev}>← Prev</button>
      <span className="w-24 text-center font-mono text-xs text-white/60">Stop {i + 1} / {count}</span>
      <button className={`${btn} ${dis}`} disabled={i >= count - 1} onClick={next}>Next →</button>
    </div>
  )
}
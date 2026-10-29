import { useRef } from 'react'
import { useFrame } from '../lib/clock'
import { type ViewProps, toDay } from '../lib/timeline'

export function CounterView({ cfg }: ViewProps) {
  const unitsRef = useRef<HTMLSpanElement>(null)
  const ageRef = useRef<HTMLSpanElement>(null)
  const dob = toDay(cfg.dob)

  useFrame(({ day, units }) => {
    if (unitsRef.current) unitsRef.current.textContent = `${Math.round(units)} / 1000`
    const age = (day - dob) / 365.25
    if (ageRef.current) {
      if (age < 0) ageRef.current.textContent = 'AGE —'
      else {
        const y = Math.floor(age)
        const m = Math.floor((age - y) * 12)
        ageRef.current.textContent = `AGE ${y} Y ${m} M`
      }
    }
  })

  return (
    <div className="absolute left-[40cqw] top-1/2 mt-[2.2cqw] flex flex-col gap-[0.8cqw] font-mono text-[2.2cqw] tracking-[0.15em] opacity-70">
      <span ref={unitsRef} />
      <span ref={ageRef} />
    </div>
  )
}
import { type ControlProps, type ViewProps } from '../lib/timeline'
import { Row, input } from './ui'

const PREFIX = 'W'       // from the reference strip: "W 1500M FREE FINAL"
const SUFFIX = 'FINAL'

export function RaceStripView({ cfg }: ViewProps) {
  return (
 
    <div
      className="pointer-events-none absolute inset-x-0 top-[15cqw] z-10 flex h-[9cqw] items-center justify-center bg-[#3c6064]/60 font-sans text-[3.9cqw] font-medium uppercase tracking-[0.06em] text-white"
      aria-label="Race strip"
    >
      <span className="whitespace-nowrap">
        {/* {PREFIX} {cfg.raceDistance}<span className="text-[0.8em]">M</span> {cfg.raceStroke} {SUFFIX} */}
        {cfg.raceDistance}<span className="text-[0.8em]">M</span> {cfg.raceStroke}
      </span>
    </div>
  )
}

   {/* <div
      className="pointer-events-none absolute inset-x-[5cqw] top-[18cqw] z-10 flex h-[7cqw] items-center justify-center rounded-[0.6cqw] bg-[#3c6064] font-sans text-[3.6cqw] font-medium uppercase tracking-[0.06em] text-white shadow-[0_0.6cqw_1.6cqw_rgba(0,0,0,0.35)]"
      aria-label="Race strip"
    > */}
export function RaceStripControls({ cfg, set }: ControlProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Row label="Distance (m)">
        <input
          type="number"
          min={1}
          max={99999}
          className={input}
          value={cfg.raceDistance}
          onChange={e => set({ raceDistance: Math.max(1, Math.round(+e.target.value) || 1) })}
        />
      </Row>
      <Row label="Stroke">
        <input
          list="race-strokes"
          className={`${input} uppercase`}
          value={cfg.raceStroke}
          onChange={e => set({ raceStroke: e.target.value })}
        />
        <datalist id="race-strokes">
          <option value="FREE" />
          <option value="BACK" />
          <option value="BREAST" />
          <option value="FLY" />
          <option value="IM" />
        </datalist>
      </Row>
    </div>
  )
}
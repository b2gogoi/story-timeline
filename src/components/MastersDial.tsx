import { useRef, type CSSProperties } from 'react'
import { useFrame } from '../lib/clock'
import { type ControlProps, type ViewProps, type Config, toDay } from '../lib/timeline'
// import { Row, input } from './ui'

/* export function DialControls({ cfg, set }: ControlProps) {
  return (
    <Row label="Date of birth">
      <input type="date" className={input} value={cfg.dob} onChange={e => e.target.value && set({ dob: e.target.value })} />
    </Row>
  )
} */

const START = 25          // first category: 25–29
const STEP = 5            // years per block
const COUNT = 8          // 25–29 … 100–104
const PHI = 38            // degrees of drum one block spans (curvature)
const VISIBLE = 2.2       // blocks visible across the dial
const TRANSITION = 0.45   // seconds for a block-to-block move
const TICKS = STEP * 4    // quarter ticks per block

const ease = (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2)

export function MastersDial({ cfg }: { cfg: Config }) {
  const root = useRef<HTMLDivElement>(null)
  const marker = useRef<HTMLSpanElement>(null)
  const dob = toDay(cfg.dob)
  const s = useRef({ v: 0, from: 0, to: 0, t0: 0, init: false, written: NaN })

  useFrame(({ day }) => {
    const age = (day - dob) / 365.25
    const blocks = Math.min(COUNT, Math.max(0, (age - START) / STEP)) // continuous
    const target = Math.min(COUNT - 1, Math.floor(blocks))            // current block
    const st = s.current
    const now = performance.now()

    if (!st.init) { st.v = st.from = st.to = target; st.init = true }
    else if (target !== st.to) {
      st.from = st.v; st.to = target; st.t0 = now
      if (Math.abs(target - st.v) > 1.5) st.v = st.from = target // loop/restart: snap
    }
    if (st.v !== st.to) {
      const p = Math.min(1, (now - st.t0) / (TRANSITION * 1000))
      st.v = st.from + (st.to - st.from) * ease(p)
    }

    if (st.v !== st.written) { root.current?.style.setProperty('--q', st.v.toFixed(4)); st.written = st.v }
    marker.current?.style.setProperty('--age', blocks.toFixed(4))
  })

  return ( 
  <div className="absolute inset-x-[5cqw] top-[5cqw] z-10 [container-type:inline-size]">
    {/* <div className="rounded-xl p-[1cqw]" style={{ background: 'linear-gradient(#f4f6f8, #9aa2ab)', boxShadow: '0 6px 16px rgb(0 0 0 / .45)' }}> */}
    <div
        ref={root}
        className="relative h-[12cqw] overflow-hidden rounded-lg ring-1 ring-white/15"
        style={{
          color:  '#1d2530', //cfg.fontColor,
        //   background: 'rgb(0 0 0 / 0.35)',
        background: `
        repeating-linear-gradient(90deg, rgb(255 255 255 / .07) 0 1px, rgb(0 0 0 / .05) 1px 2px),
        linear-gradient(#e6e9ed 0%, #c3c9d0 48%, #aab1b9 100%)`,
        boxShadow: `
        inset 0 1.5px 1px rgb(255 255 255 / .9),
        inset 0 -3px 5px rgb(0 0 0 / .4)
         0 6px 16px rgb(0 0 0 / .45)`,
        '--q': 0,
        //   backdropFilter: 'blur(6px)',
          // radius chosen so VISIBLE blocks span the dial width at the centre
          '--R': `calc(100cqw / (${2 * VISIBLE} * sin(${PHI / 2}deg)))`,
        } as CSSProperties}
      >
        {Array.from({ length: COUNT }, (_, i) => {
          const lo = START + i * STEP
          const last = i === COUNT - 1 ? TICKS : TICKS - 1
          return (
            <div
              key={i}
              className="absolute inset-y-0 left-1/2 w-0"
              style={{
                '--ang': `calc((${i} - var(--q)) * ${PHI}deg)`,
                opacity: 'clamp(0, calc(cos(var(--ang)) * 6), 1)', // hide the far side
              } as CSSProperties}
            >
                <div
            className="absolute inset-y-0"
            style={{
              left: `calc(var(--R) * sin(var(--ang) - ${PHI / 2}deg))`,
              width: `calc(var(--R) * (sin(var(--ang) + ${PHI / 2}deg) - sin(var(--ang) - ${PHI / 2}deg)))`,
              background: 'rgb(0 0 0 / calc((1 - cos(var(--ang))) * 0.9))',
            }}
          />
              {/* block label, centred on the block */}
              <div
                className="absolute top-0 flex h-full w-0 items-center justify-center"
                style={{ left: 'calc(var(--R) * sin(var(--ang)))' }}
              >
                <span
                //   className="whitespace-nowrap font-mono text-[6.5cqw] font-medium"
                  className="whitespace-nowrap font-mono text-[5.2cqw] font-medium"
                  style={{
                    transform: 'scaleX(cos(var(--ang)))',
                    opacity: `max(0.45, calc(1 - abs(${i} - var(--q))))`,
                    textShadow: '0 1px 0 rgb(255 255 255 / .8), 0 -1px 0 rgb(0 0 0 / .25)',
                  }}    
                >
                  {lo} – {lo + STEP - 1}
                </span>
              </div>

              {/* edge lines, year lines, quarter lines */}
              {Array.from({ length: last + 1 }, (_, j) => {
                const edge = j === 0 || j === TICKS
                const year = j % 4 === 0
                return (
                  <span
                    key={j}
                    className="absolute bg-current"
                    style={{
                        left: `calc(var(--R) * sin(var(--ang) + ${(j / TICKS - 0.5) * PHI}deg))`,
                        bottom: 0,
                        height: edge ? '100%' : year ? '24%' : '10%',
                        width: edge ? 2 : year ? 1.5 : 1,
                        opacity: edge ? 0.6 : year ? 0.75 : 0.4,
                        boxShadow: '1px 0 0 rgb(255 255 255 / .75)',
                      }}
                  />
                )
              })}
            </div>
          )
        })}

        {/* exact-age marker: moves with age, rides the drum during block changes */}
        <span
  ref={marker}
  className="absolute bottom-0 z-10 -translate-x-1/2 [filter:drop-shadow(0_1px_1.5px_rgb(0_0_0/.6))]"
  style={{
    width: '2.6cqw',
    height: '2.25cqw',   // 2.6 × 0.866
    left: `calc(50% + var(--R) * sin((var(--age) - 0.5 - var(--q)) * ${PHI}deg))`,
    '--age': 0,
  } as CSSProperties}
>
  <span
    className="block h-full w-full [clip-path:polygon(50%_0,0_100%,100%_100%)]"
    style={{ background: 'linear-gradient(#5c0a0a, #2e0303)' }}
  />
</span>

        {/* edge shading */}
        <div
  className="pointer-events-none absolute inset-0 z-20"
  style={{
    background: `
      linear-gradient(90deg, rgb(0 0 0 / .6) 0%, rgb(0 0 0 / .15) 14%, rgb(255 255 255 / .35) 34%, rgb(255 255 255 / 0) 50%, rgb(255 255 255 / .25) 66%, rgb(0 0 0 / .15) 86%, rgb(0 0 0 / .6) 100%),
      linear-gradient(rgb(255 255 255 / .4), rgb(255 255 255 / 0) 42%, rgb(0 0 0 / .1) 100%)`,
  }}
/>
      </div>
    </div>
    // </div>
    )
}
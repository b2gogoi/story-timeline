export type ComponentId = 'ruler' | 'counter' | 'dial'

export type ViewProps = { cfg: Config; plan: Plan }
export type ControlProps = { cfg: Config; set: (p: Partial<Config>) => void }

const DAY = 86400000
export const DAYS_PER_MONTH = 30.4375

export const toDay = (iso: string) => Math.floor(Date.parse(iso + 'T00:00:00Z') / DAY)

export const toISO = (n: number) => new Date(n * DAY).toISOString().slice(0, 10)
export { DAY }

export const labelOf = (n: number) => {
  const d = new Date(Math.round(n) * DAY)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']

export type Config = {
  bgFrom: string; bgTo: string; bgSplit: number; fontColor: string
  speed: number      // peak travel speed, months per second
  easePower: number  // higher = sharper brake, longer crawl into the stop
  dwell: number      // seconds held at each stop
  direction: 'up' | 'down'
  monthsVisible: number
  loop: boolean
  start: string; end: string; stops: string[]  // "YYYY-MM"
  dob: string // "YYYY-MM"
  show: Record<ComponentId, boolean>
  mode: 'auto' | 'manual'
}

type Seg = { from: number; to: number; move: number; hold: number }
export const easeOut = (p: number, n: number) => 1 - Math.pow(1 - p, n)
export const moveDuration = (dist: number, speed: number, power: number) =>
  Math.max(0.35, (dist * power) / (speed * DAYS_PER_MONTH))

export type Plan = {
  points: number[]; lead: number; segs: Seg[]; total: number
  loop: boolean; power: number; speed: number
  arrive: number[]   // plan time at which each stop is reached
}

/** Timeline: hold at first stop, then for each leg move (fast start, eased stop) and hold. */
export function buildPlan(points: number[], c: Pick<Config, 'speed' | 'easePower' | 'dwell' | 'loop'>): Plan {
  const segs: Seg[] = []
  const arrive = [0]
  let t = c.dwell
  for (let i = 0; i < points.length - 1; i++) {
    const dist = Math.abs(points[i + 1] - points[i])
    const move = moveDuration(dist, c.speed, c.easePower)
    segs.push({ from: points[i], to: points[i + 1], move, hold: c.dwell })
    t += move
    arrive.push(t)
    t += c.dwell
  }
  return { points, lead: c.dwell, segs, total: t, loop: c.loop, power: c.easePower, speed: c.speed, arrive }
}

export function positionAt(plan: Plan, time: number): number {
  let x = plan.loop ? time % Math.max(plan.total, 0.001) : Math.min(time, plan.total)
  if (x < plan.lead) return plan.points[0]
  x -= plan.lead
  for (const s of plan.segs) {
    if (x < s.move) return s.from + (s.to - s.from) * (1 - Math.pow(1 - x / s.move, plan.power))
    x -= s.move
    if (x < s.hold) return s.to
    x -= s.hold
  }
  return plan.points[plan.points.length - 1]
}

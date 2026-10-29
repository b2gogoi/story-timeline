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
}

// export const toIdx = (ym: string) => { const [y, m] = ym.split('-').map(Number); return y * 12 + (m - 1) }
// export const toYM = (i: number) => `${Math.floor(i / 12)}-${String((((i % 12) + 12) % 12) + 1).padStart(2, '0')}`
// export const labelOf = (i: number) => `${MONTHS[((i % 12) + 12) % 12]} ${Math.floor(i / 12)}`

type Seg = { from: number; to: number; move: number; hold: number }
export type Plan = { points: number[]; lead: number; segs: Seg[]; total: number; loop: boolean; power: number }

/** Timeline: hold at first stop, then for each leg move (fast start, eased stop) and hold. */
export function buildPlan(points: number[], c: Pick<Config, 'speed' | 'easePower' | 'dwell' | 'loop'>): Plan {
  const segs: Seg[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const dist = Math.abs(points[i + 1] - points[i])  // now in days
    // Speed slider is months/sec, so convert to days/sec before dividing.
    segs.push({ from: points[i], to: points[i + 1], move: Math.max(0.35, (dist * c.easePower) / (c.speed * DAYS_PER_MONTH)), hold: c.dwell })
  }
  const total = c.dwell + segs.reduce((s, g) => s + g.move + g.hold, 0)
  return { points, lead: c.dwell, segs, total, loop: c.loop, power: c.easePower }
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

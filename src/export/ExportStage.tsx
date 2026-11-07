import { useEffect, useMemo } from 'react'
import { Story } from '../components/Story'
import { START_PAUSE_SECONDS, TimelineClock, useClock } from '../lib/clock'
import { type Config, type Plan, buildPlan, toDay } from '../lib/timeline'
import { renderAudio, type RenderedAudio } from './audio'

export const EXPORT_WIDTH = 1080
export const EXPORT_HEIGHT = 1920

export type ExportApi = {
  ready: boolean
  width: number
  height: number
  duration: number            // seconds in one play loop: startup pause + the whole plan
  failedImages: string[]      // photo URLs the browser could not decode
  seek: (timeSeconds: number) => Promise<void>
  renderAudio: (sampleRate?: number) => Promise<RenderedAudio>
}

declare global {
  interface Window {
    __EXPORT_CONFIG__?: Partial<Config>
    __export?: ExportApi
  }
}

const nextPaint = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

function ExportBridge({ cfg, plan }: { cfg: Config; plan: Plan }) {
  const { seek } = useClock()

  useEffect(() => {
    const api: ExportApi = {
      ready: false,
      width: EXPORT_WIDTH,
      height: EXPORT_HEIGHT,
      duration: START_PAUSE_SECONDS + plan.total,
      failedImages: [],
      seek: async t => { seek(t); await nextPaint() },
      renderAudio: sampleRate => renderAudio(plan, cfg.rollingValues, START_PAUSE_SECONDS + plan.total, sampleRate),
    }
    window.__export = api

    let cancelled = false
    void (async () => {
      await document.fonts.ready
      const failed = await Promise.all(Array.from(document.images).map(img => img.decode().then(() => '', () => img.currentSrc || img.src)))
      api.failedImages = failed.filter(Boolean)
      seek(0)
      await nextPaint()
      if (!cancelled) api.ready = true
    })()
    return () => { cancelled = true }
  }, [])

  return null
}

/** A bare 1080 x 1920 story whose time is set from outside (see scripts/export-video.mjs). */
export function ExportStage({ base }: { base: Config }) {
  const cfg = useMemo<Config>(() => ({ ...base, ...window.__EXPORT_CONFIG__ }), [base])
  const plan = useMemo(
    () => buildPlan([cfg.start, ...cfg.stops, cfg.end].map(toDay), cfg, cfg.mapping === 'counter' ? cfg.rollingValues : undefined),
    [cfg],
  )

  return (
    <TimelineClock plan={plan} playing={false} mode="auto" external>
      <style>{`
        html, body { margin: 0; overflow: hidden; background: #000; }
        *, *::before, *::after { transition: none !important; animation: none !important; }
      `}</style>
      <div style={{ width: EXPORT_WIDTH, height: EXPORT_HEIGHT }}>
        <Story cfg={cfg} plan={plan} />
      </div>
      <ExportBridge cfg={cfg} plan={plan} />
    </TimelineClock>
  )
}

#!/usr/bin/env node
/**
 * Exports one play loop of the story as an Instagram-ready MP4.
 *
 *   npm run export:video -- --out reel.mp4
 *   npm run export:video -- --config export.config.json --fps 30 --crf 14
 *
 * How it works: it starts the Vite dev server, opens /?export=1 in headless Chromium at exactly
 * 1080 x 1920, sets the story clock to each frame time (1 / fps apart), screenshots every frame
 * and streams them into ffmpeg. The counter sounds are rendered offline in the same page and
 * muxed in as AAC. Nothing runs in real time, so no frames are dropped.
 *
 * Needs: ffmpeg on your PATH, and a browser (`npx playwright install chromium`, or --chrome to use
 * an installed Google Chrome, or --browser-path /path/to/chrome).
 */
import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// ---------- options ----------
const args = process.argv.slice(2)
const flag = name => args.includes(`--${name}`)
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback
}
const opts = {
  out: path.resolve(option('out', 'story-timeline.mp4')),
  fps: Number(option('fps', 30)),
  crf: Number(option('crf', 14)),
  preset: option('preset', 'slow'),
  maxrate: option('maxrate', '15M'),         // upper bound, in line with Instagram's recommended 10-15 Mbps
  bufsize: option('bufsize', '30M'),
  format: option('format', 'png'),            // png (lossless, slower) or jpeg (faster)
  config: option('config', ''),
  port: Number(option('port', 5199)),
  browserPath: option('browser-path', process.env.CHROME_PATH || ''),
  maxFrames: Number(option('max-frames', 0)), // for quick tests
  audio: !flag('no-audio'),
  keepAudio: flag('keep-audio'),
  chrome: flag('chrome'),
}

if (flag('help')) {
  console.log(`Usage: npm run export:video -- [options]
  --out FILE           output file (default story-timeline.mp4)
  --fps N              frame rate (default 30)
  --crf N              x264 quality, lower is better (default 14)
  --preset NAME        x264 preset (default slow)
  --maxrate RATE       peak video bitrate (default 15M)
  --format png|jpeg    frame capture format (default png)
  --config FILE        settings JSON (use "Copy config" in the app)
  --no-audio           video only
  --keep-audio         also save the rendered WAV next to the video
  --chrome             use an installed Google Chrome
  --browser-path PATH  use a specific Chromium or Chrome binary
  --max-frames N       render only the first N frames (test)`)
  process.exit(0)
}

const W = 1080
const H = 1920
const log = (...m) => console.log(...m)

// ---------- checks ----------
if (spawnSync('ffmpeg', ['-version']).status !== 0) {
  console.error('ffmpeg was not found on your PATH. Install it first (for example: brew install ffmpeg).')
  process.exit(1)
}
let chromium
try { ({ chromium } = await import('playwright')) } catch { ({ chromium } = await import('playwright-core')) }

const configJson = opts.config ? JSON.parse(fs.readFileSync(path.resolve(opts.config), 'utf8')) : undefined
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'story-export-'))
let server, browser

const cleanup = async () => {
  try { await browser?.close() } catch { /* ignore */ }
  try { await server?.close() } catch { /* ignore */ }
  fs.rmSync(workDir, { recursive: true, force: true })
}

try {
  // ---------- 1. serve the app and open the export page ----------
  server = await createServer({ root, server: { port: opts.port, host: '127.0.0.1' }, logLevel: 'error' })
  await server.listen()
  const url = `${server.resolvedUrls.local[0]}?export=1`

  browser = await chromium.launch({
    headless: true,
    ...(opts.browserPath ? { executablePath: opts.browserPath } : opts.chrome ? { channel: 'chrome' } : {}),
    args: ['--force-color-profile=srgb', '--hide-scrollbars', '--font-render-hinting=none', '--autoplay-policy=no-user-gesture-required'],
  })
  const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  if (configJson) await context.addInitScript(cfg => { window.__EXPORT_CONFIG__ = cfg }, configJson)
  const page = await context.newPage()
  page.on('pageerror', e => console.error('page error:', e.message))
  await page.goto(url)
  await page.waitForFunction(() => window.__export && window.__export.ready === true, undefined, { timeout: 120000 })
  const info = await page.evaluate(() => ({
    duration: window.__export.duration,
    failedImages: window.__export.failedImages,
  }))

  const totalFrames = Math.round(info.duration * opts.fps)
  const frames = opts.maxFrames > 0 ? Math.min(totalFrames, opts.maxFrames) : totalFrames
  log(`One play loop: ${info.duration.toFixed(2)} s, ${totalFrames} frames at ${opts.fps} fps, ${W}x${H}`)
  if (info.failedImages.length) {
    console.warn(`Warning: ${info.failedImages.length} photo(s) could not be decoded and will be blank (HEIF files are the usual cause):`)
    info.failedImages.forEach(u => console.warn('  ' + u))
  }

  // ---------- 2. render the audio offline, in the page ----------
  let audioPath = ''
  if (opts.audio) {
    const audio = await page.evaluate(() => window.__export.renderAudio(48000))
    audioPath = path.join(workDir, 'audio.wav')
    fs.writeFileSync(audioPath, Buffer.from(audio.wavBase64, 'base64'))
    log(`Audio: ${audio.ticks} ticks and ${audio.clunks} clunk, rendered at 48 kHz`)
    if (opts.keepAudio) fs.copyFileSync(audioPath, opts.out.replace(/\.\w+$/, '') + '.wav')
  }

  // ---------- 3. start ffmpeg, which reads frames from stdin ----------
  const ffArgs = [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(opts.fps), '-c:v', opts.format === 'jpeg' ? 'mjpeg' : 'png', '-i', 'pipe:0',
    ...(audioPath ? ['-i', audioPath] : []),
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p',
    '-c:v', 'libx264', '-preset', opts.preset, '-crf', String(opts.crf),
    '-maxrate', opts.maxrate, '-bufsize', opts.bufsize,
    '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-g', String(opts.fps * 2), '-bf', '2',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-r', String(opts.fps),
    ...(audioPath ? ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2'] : ['-an']),
    '-t', (frames / opts.fps).toFixed(3),
    '-movflags', '+faststart',
    opts.out,
  ]
  const ffmpeg = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'pipe'] })
  let ffmpegErrors = ''
  ffmpeg.stderr.on('data', d => { ffmpegErrors += d })
  ffmpeg.stdin.on('error', () => { /* reported through the exit code */ })
  const exited = new Promise(resolve => ffmpeg.on('close', resolve))

  // ---------- 4. step the clock, screenshot, stream ----------
  const started = Date.now()
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.__export.seek(t), i / opts.fps)
    const shot = await page.screenshot({
      type: opts.format === 'jpeg' ? 'jpeg' : 'png',
      ...(opts.format === 'jpeg' ? { quality: 100 } : {}),
      clip: { x: 0, y: 0, width: W, height: H },
      animations: 'disabled',
      caret: 'hide',
    })
    if (!ffmpeg.stdin.write(shot)) await once(ffmpeg.stdin, 'drain')
    if ((i + 1) % 30 === 0 || i + 1 === frames) {
      const elapsed = (Date.now() - started) / 1000
      const eta = (elapsed / (i + 1)) * (frames - i - 1)
      process.stdout.write(`\rFrame ${i + 1}/${frames}  (${((i + 1) / frames * 100).toFixed(0)}%, about ${Math.ceil(eta)} s left)   `)
    }
  }
  ffmpeg.stdin.end()
  const code = await exited
  process.stdout.write('\n')
  if (code !== 0) throw new Error(`ffmpeg failed (exit ${code}):\n${ffmpegErrors}`)

  const mb = fs.statSync(opts.out).size / 1e6
  log(`Done: ${opts.out} (${mb.toFixed(1)} MB, ${((Date.now() - started) / 1000).toFixed(0)} s)`)
} catch (error) {
  console.error('\nExport failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await cleanup()
}

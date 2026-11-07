import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App, { initial } from './App'
import { ExportStage } from './export/ExportStage'

// ?export=1 shows a bare 1080 x 1920 story for the video export script
const exporting = new URLSearchParams(window.location.search).has('export')

createRoot(document.getElementById('root')!).render(
  <StrictMode>{exporting ? <ExportStage base={initial} /> : <App />}</StrictMode>,
)

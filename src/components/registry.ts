import { type ComponentType } from 'react'
import { type ComponentId, type ControlProps, type ViewProps } from '../lib/timeline'
import { RulerView, RulerControls } from './Ruler'
import { CounterView } from './Counter'
import { MastersDial } from './MastersDial'

export type Entry = {
  id: ComponentId
  label: string
  View: ComponentType<ViewProps>
  Controls?: ComponentType<ControlProps>
}

// Order = stacking order (last is on top).
export const REGISTRY: Entry[] = [
  { id: 'ruler', label: 'Timeline ruler', View: RulerView, Controls: RulerControls },
  { id: 'counter', label: 'Units counter', View: CounterView },
  { id: 'dial', label: 'Masters dial', View: MastersDial },
]
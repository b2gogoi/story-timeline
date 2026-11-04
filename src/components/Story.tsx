import { type ViewProps, type ComponentId } from '../lib/timeline'
import { REGISTRY } from './registry'

export function Story({ cfg, plan, previewComponent, previewScale = 1 }: ViewProps & { previewComponent?: ComponentId; previewScale?: number }) {
  return (
    <div
      className="@container relative h-full aspect-[9/16] overflow-hidden"
      style={{ containerType: 'size', color: cfg.fontColor, background: `linear-gradient(90deg, ${cfg.bgFrom} ${cfg.bgSplit}%, ${cfg.bgTo} 100%)` }}
    >
      {REGISTRY.filter(e => cfg.show[e.id]).map(({ id, View }, index) => (
        <div key={id} className="absolute inset-0" style={{ zIndex: index, transform: id === previewComponent ? `scale(${previewScale})` : undefined, transformOrigin: 'center' }}>
          <View cfg={cfg} plan={plan} />
        </div>
      ))}
    </div>
  )
}
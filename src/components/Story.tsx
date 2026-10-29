import { type ViewProps } from '../lib/timeline'
import { REGISTRY } from './registry'

export function Story({ cfg, plan }: ViewProps) {
  return (
    <div
      className="@container relative h-full aspect-[9/16] overflow-hidden"
      style={{ containerType: 'size', color: cfg.fontColor, background: `linear-gradient(90deg, ${cfg.bgFrom} ${cfg.bgSplit}%, ${cfg.bgTo} 100%)` }}
    >
      {REGISTRY.filter(e => cfg.show[e.id]).map(({ id, View }) => (
        <View key={id} cfg={cfg} plan={plan} />
      ))}
    </div>
  )
}
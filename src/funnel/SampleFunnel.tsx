import { texts } from '../texts'
import './funnel.css'

// Fixed widths: the proportional drawing comes with the real funnel.
const widths = [100, 78, 58, 40]

export function SampleFunnel() {
  return (
    <ol className="funnel" aria-label={texts.funnel.sampleLabel}>
      {texts.funnel.sampleStages.map((stage, i) => (
        <li key={stage.name} className="funnel-step">
          {stage.conversion && (
            <div className="funnel-conversion">
              <span className="funnel-conversion-line" aria-hidden="true" />
              <span className="num">{stage.conversion}</span>
            </div>
          )}
          <div className="funnel-band" style={{ width: `${widths[i]}%` }}>
            <span className="funnel-band-name">{stage.name}</span>
            <span className="funnel-band-volume num">{stage.volume}</span>
            <span className="funnel-band-cost num">{stage.cost}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

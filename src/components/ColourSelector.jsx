import { COLOURS } from '../lib/constants'
import './ColourSelector.css'

export function ColourSelector({ value, onChange }) {
  return (
    <div className="selector-group">
      <label className="selector-label">Colour</label>
      <div className="colour-grid">
        {COLOURS.map(colour => (
          <button
            key={colour.id}
            className={`colour-chip ${value === colour.id ? 'selected' : ''}`}
            onClick={() => onChange(colour.id)}
          >
            <span className="colour-swatch" style={{ background: colour.swatch }} />
            <span className="colour-name">{colour.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

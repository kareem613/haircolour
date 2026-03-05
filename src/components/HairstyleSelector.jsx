import { HAIRSTYLES } from '../lib/constants'
import './StyleSelector.css'

export function HairstyleSelector({ value, onChange }) {
  return (
    <div className="selector-group">
      <label className="selector-label">Hairstyle</label>
      <div className="style-cards">
        {HAIRSTYLES.map(hs => (
          <button
            key={hs.id}
            className={`style-card ${value === hs.id ? 'selected' : ''}`}
            onClick={() => onChange(value === hs.id ? null : hs.id)}
          >
            <span className="style-card-name">{hs.label}</span>
            <span className="style-card-desc">{hs.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

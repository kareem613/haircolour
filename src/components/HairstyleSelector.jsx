import { HAIRSTYLES } from '../lib/constants'
import './StyleSelector.css'

export function HairstyleSelector({ value = [], onChange }) {
  function toggle(id) {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div className="selector-group">
      <label className="selector-label">Hairstyle {value.length > 0 && <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({value.length} selected)</span>}</label>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0 0 0.25rem' }}>Select all the styles you'd like to try — they'll generate side by side</p>
      <div className="style-cards">
        {HAIRSTYLES.map(hs => (
          <button
            key={hs.id}
            className={`style-card ${value.includes(hs.id) ? 'selected' : ''}`}
            onClick={() => toggle(hs.id)}
          >
            <span className="style-card-name">{value.includes(hs.id) ? '✓ ' : ''}{hs.label}</span>
            <span className="style-card-desc">{hs.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

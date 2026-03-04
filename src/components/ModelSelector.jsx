import { MODELS } from '../lib/constants'
import './ModelSelector.css'

export function ModelSelector({ value, onChange }) {
  return (
    <div className="selector-group">
      <label className="selector-label" htmlFor="model-select">Model</label>
      <select
        id="model-select"
        className="model-select"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {MODELS.map(m => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
    </div>
  )
}

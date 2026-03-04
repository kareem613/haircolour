import { HIGHLIGHT_STYLES, MONEY_PIECE } from '../lib/constants'
import './StyleSelector.css'

export function StyleSelector({ value, moneyPiece, onChange, onMoneyPieceChange }) {
  return (
    <div className="selector-group">
      <label className="selector-label">Highlight Style</label>
      <div className="style-cards">
        {HIGHLIGHT_STYLES.map(style => (
          <button
            key={style.id}
            className={`style-card ${value === style.id ? 'selected' : ''}`}
            onClick={() => onChange(style.id)}
          >
            <span className="style-card-name">{style.label}</span>
            <span className="style-card-desc">{style.description}</span>
          </button>
        ))}
      </div>
      <button
        className={`style-card money-piece-card ${moneyPiece ? 'selected' : ''}`}
        onClick={() => onMoneyPieceChange(!moneyPiece)}
      >
        <span className="style-card-name">{moneyPiece ? '✓ ' : '+ '}{MONEY_PIECE.label}</span>
        <span className="style-card-desc">{MONEY_PIECE.description}</span>
      </button>
    </div>
  )
}

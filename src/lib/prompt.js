import { HIGHLIGHT_STYLES, MONEY_PIECE, COLOURS } from './constants'

export function buildPrompt({ style, moneyPiece, colour }) {
  const styleInfo = HIGHLIGHT_STYLES.find(s => s.id === style)
  const colourInfo = COLOURS.find(c => c.id === colour)

  const styleName = styleInfo?.label || style
  const colourName = colourInfo?.label || colour

  let styleDescription = `${styleName} — ${styleInfo?.description || ''}`
  if (moneyPiece) {
    styleDescription += `\nAdditionally: ${MONEY_PIECE.label} — ${MONEY_PIECE.description}`
  }

  let instructions = `- Apply the ${styleName} highlighting technique with ${colourName} tones to the person's hair`
  if (moneyPiece) {
    instructions += `\n- Also add money piece (face-framing) highlights in ${colourName} tones around the face`
  }

  return `You are a professional hair colourist assistant. Edit this selfie photo to show how the person would look with the following hair highlighting treatment applied:

Style: ${styleDescription}
Colour: ${colourName}

Instructions:
${instructions}
- Keep the face, skin, clothing, and background completely unchanged
- The result should look natural and realistic, as if done by a professional salon colourist
- Maintain the original hair length, texture, and volume
- The highlights should be blended naturally with the existing hair colour
- Preserve the lighting and photo quality of the original image
- Output ONLY the edited photo with no text overlay or watermarks`
}

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

MANDATORY: Use inpainting only — DO NOT TOUCH FACE. The ONLY modification allowed is adding highlights to the hair. Everything else in the image MUST remain identical to the original.

Instructions:
${instructions}
- MANDATORY: Retain the original face exactly as-is — do not alter facial features, expression, skin tone, or any part of the face in any way
- Keep skin, clothing, background, and all non-hair elements completely unchanged
- The result should look natural and realistic, as if done by a professional salon colourist
- Do NOT change the hairstyle, cut, parting, length, texture, or volume — only add colour highlights
- The highlights should be blended naturally with the existing hair colour
- Preserve the lighting and photo quality of the original image
- Output ONLY the edited photo with no text overlay or watermarks`
}

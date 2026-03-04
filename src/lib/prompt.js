import { HIGHLIGHT_STYLES, COLOURS } from './constants'

export function buildPrompt({ style, colour }) {
  const styleInfo = HIGHLIGHT_STYLES.find(s => s.id === style)
  const colourInfo = COLOURS.find(c => c.id === colour)

  return `You are a professional hair colourist assistant. Edit this selfie photo to show how the person would look with the following hair highlighting treatment applied:

Style: ${styleInfo?.label || style} — ${styleInfo?.description || ''}
Colour: ${colourInfo?.label || colour}

Instructions:
- Apply the ${styleInfo?.label || style} highlighting technique with ${colourInfo?.label || colour} tones to the person's hair
- Keep the face, skin, clothing, and background completely unchanged
- The result should look natural and realistic, as if done by a professional salon colourist
- Maintain the original hair length, texture, and volume
- The highlights should be blended naturally with the existing hair colour
- Preserve the lighting and photo quality of the original image
- Output ONLY the edited photo with no text overlay or watermarks`
}

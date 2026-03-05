import { HIGHLIGHT_STYLES, MONEY_PIECE, COLOURS, HAIRSTYLES } from './constants'

export function buildRefinePrompt() {
  return `You are given two images:
1. The ORIGINAL selfie photo (first image)
2. An AI-generated version with new hair highlights (second image)

Your task: Produce a final image that uses the HAIR and BACKGROUND from the second image, but with the FACE from the first image perfectly preserved.

Requirements:
- The person's face, skin tone, expression, and all facial features must be IDENTICAL to the original first image
- The hair colour/highlights from the second image must be kept exactly as-is
- The transition between face and hair must be completely seamless and natural — no visible edges, colour shifts, or artifacts
- Clothing and background should match the second image
- The result should look like a single natural photograph
- Output ONLY the final photo with no text overlay or watermarks`
}

export function buildPrompt({ style, moneyPiece, colour, hairstyle }) {
  const styleInfo = HIGHLIGHT_STYLES.find(s => s.id === style)
  const colourInfo = COLOURS.find(c => c.id === colour)
  const hairstyleInfo = hairstyle ? HAIRSTYLES.find(h => h.id === hairstyle) : null

  const styleName = styleInfo?.label || style
  const colourName = colourInfo?.label || colour
  const hairstyleName = hairstyleInfo?.label || null

  let styleDescription = `${styleName} — ${styleInfo?.description || ''}`
  if (moneyPiece) {
    styleDescription += `\nAdditionally: ${MONEY_PIECE.label} — ${MONEY_PIECE.description}`
  }

  let instructions = `- Apply the ${styleName} highlighting technique with ${colourName} tones to the person's hair`
  if (moneyPiece) {
    instructions += `\n- Also add money piece (face-framing) highlights in ${colourName} tones around the face`
  }
  if (hairstyleName) {
    instructions += `\n- Change the hairstyle to a ${hairstyleName} style (${hairstyleInfo.description})`
  }

  const hairstyleSection = hairstyleName
    ? `\nHairstyle: ${hairstyleName} — ${hairstyleInfo.description}`
    : ''

  const hairstyleRule = hairstyleName
    ? `- Reshape the hair into a ${hairstyleName} style while applying the colour treatment`
    : '- Do NOT change the hairstyle, cut, parting, length, texture, or volume — only add colour highlights'

  const isShortStyle = hairstyleInfo?.short === true

  let negativePrompt = ''
  if (hairstyleName) {
    negativePrompt = `\n\nNEGATIVE PROMPT — The following are UNACCEPTABLE in the result:
- Any remnant of the original hairstyle length or shape showing through
- Mixed hair lengths — the ENTIRE head of hair must be the requested ${hairstyleName} style`
    if (isShortStyle) {
      negativePrompt += `
- ANY long hair remaining — if the original hair is long, ALL of it must be COMPLETELY removed and replaced with the ${hairstyleName} style
- Long strands, wisps, or sections hanging below the ${hairstyleName} cut line
- Hair appearing on shoulders or back that contradicts the short style
- A short style layered on top with long hair still visible underneath or behind
- CRITICAL: Remove ALL hair below the cut line. For a Bob, no hair below the chin. For a Pixie Cut, no hair below the ears. The cut must be clean with NO remnants of the original length visible from any angle`
    }
  }

  return `You are a professional hair stylist and colourist assistant. Edit this selfie photo to show how the person would look with the following hair treatment applied:

Style: ${styleDescription}
Colour: ${colourName}${hairstyleSection}

MANDATORY: Use inpainting only — DO NOT TOUCH FACE. The ONLY modifications allowed are to the hair (colour${hairstyleName ? ' and shape' : ''}). Everything else in the image MUST remain identical to the original.

Instructions:
${instructions}
- MANDATORY: Retain the original face exactly as-is — do not alter facial features, expression, skin tone, or any part of the face in any way
- Keep skin, clothing, background, and all non-hair elements completely unchanged
- The result should look natural and realistic, as if done by a professional salon
${hairstyleRule}
- The highlights should be blended naturally with the hair
- Preserve the lighting and photo quality of the original image
- Output ONLY the edited photo with no text overlay or watermarks${negativePrompt}`
}

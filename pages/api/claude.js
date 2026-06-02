import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export const config = {
  api: { bodyParser: {sizeLimit: '4mb' } }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { type, payload } = req.body

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured. Add it to your .env.local file.' })
  }

  try {
    if (type === 'analyze') {
      const { images, colors } = payload
      const content = []

      // Add each image for vision analysis
      for (const img of images) {
        if (img.startsWith('data:')) {
          const match = img.match(/^data:([^;]+);base64,(.+)$/)
          if (match) {
            content.push({
              type: 'image',
              source: { type: 'base64', media_type: match[1], data: match[2] }
            })
          }
        }
      }

      const colorNote = colors.length > 0
        ? `\nColor swatches on the board: ${colors.join(', ')}.`
        : ''

      content.push({
        type: 'text',
        text: `You are an expert interior designer and brand identity consultant with a highly trained visual eye. I am sharing images from a mood board with you.${colorNote}

Please analyze what you actually see and provide a structured synthesis:

**VISUAL IMPRESSION**
What is the immediate mood, atmosphere, and emotional quality of this board? What style vocabulary does it evoke?

**PALETTE ANALYSIS**
Describe the color story in detail. What are the dominant, supporting, and accent tones? Do they harmonize or create tension? Name the palette (e.g. "warm Nordic neutrals", "earthy Japandi").

**TEXTURE & MATERIAL STORY**
What surfaces, materials, and tactile qualities appear? How do they relate to each other?

**WHAT COHERES**
Name 2-3 specific visual relationships that work particularly well. Be specific about which elements and why.

**FRICTION POINTS**
Any visual tensions, clashes, or elements that feel out of place. Be honest — this is useful feedback.

**DESIGN SYNTHESIS**
In one confident paragraph: how would this board translate into a finished interior space or brand identity? What should the client do next?

Be direct and specific. Reference actual visual qualities you observe, not generalities.`
      })

      const response = await client.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 1200,
        messages: [{ role: 'user', content }]
      })

      return res.status(200).json({ result: response.content[0].text })
    }

    if (type === 'generate') {
      const { description } = payload
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `For a mood board (interior design or brand identity), describe the visual qualities of: "${description}". 
Write 2 evocative sentences about its texture, color, light, and mood. 
Then on a new line write exactly: COLOR: #XXXXXX (the single most representative hex color for this element).
Nothing else.`
        }]
      })
      return res.status(200).json({ result: response.content[0].text })
    }

    return res.status(400).json({ error: 'Unknown request type' })

  } catch (err) {
    console.error('Claude API error:', err)
    return res.status(500).json({ error: err.message || 'API call failed' })
  }
}

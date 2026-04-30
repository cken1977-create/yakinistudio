import { NextRequest, NextResponse } from 'next/server'

const PROMPTS = {
  menu: (input: string) => `You are an elite culinary consultant. 
Based on this description, create a complete restaurant menu.

Description: ${input}

Create a menu with:
- 3 appetizers with descriptions
- 2 soups or salads
- 4-5 main courses with descriptions
- 2 desserts

For each dish include:
- Name
- 1-2 sentence description
- Suggested price range

Format cleanly. Be specific, creative, and elevated.`,

  recipe: (input: string) => `You are a professional chef and food cost analyst.
Analyze this recipe and provide a complete cost breakdown.

Recipe details: ${input}

Provide:
1. Cost per ingredient (estimate if not given)
2. Total recipe cost
3. Cost per serving
4. Suggested menu price (using 28-32% food cost target)
5. Profit margin at suggested price
6. Notes on where to reduce costs if needed

Be specific with numbers. Format as a clean breakdown.`,

  pricing: (input: string) => `You are a culinary business strategist.
Analyze this service description and provide pricing strategy.

Service details: ${input}

Provide:
1. Recommended pricing tiers (3 options: entry, standard, premium)
2. What justifies each price point
3. How to position against competitors
4. Upsell opportunities
5. Annual revenue potential at each tier

Be specific. Use real market rates. Format cleanly.`,
}

export async function POST(req: NextRequest) {
  try {
    const { tool, input } = await req.json()

    if (!tool || !input) {
      return NextResponse.json(
        { error: 'Missing tool or input' },
        { status: 400 }
      )
    }

    const prompt = PROMPTS[tool as keyof typeof PROMPTS]
    if (!prompt) {
      return NextResponse.json(
        { error: 'Invalid tool' },
        { status: 400 }
      )
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt(input) }],
      }),
    })

    const data = await response.json()
    const result = data.content[0].text

    return NextResponse.json({ result }, { status: 200 })

  } catch (err) {
    console.error('AI API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

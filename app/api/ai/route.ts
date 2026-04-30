import { NextRequest, NextResponse } from 'next/server'

const PROMPTS: Record<string, (input: string) => string> = {
  menu: (input) => `You are an elite culinary consultant. Based on this description, create a complete restaurant menu.

Description: ${input}

Create a menu with appetizers, soups or salads, main courses, and desserts. For each dish include name, 1-2 sentence description, and suggested price. Format cleanly and professionally.`,

  recipe: (input) => `You are a professional chef and food cost analyst. Analyze this recipe and provide a complete cost breakdown.

Recipe: ${input}

Provide: ingredient cost breakdown, total recipe cost, cost per serving, suggested menu price at 28-32% food cost, profit margin, and cost reduction opportunities. Be specific with numbers.`,

  pricing: (input) => `You are a culinary business strategist. Analyze this service and provide a complete pricing strategy.

Service: ${input}

Provide: three pricing tiers with names and per-person rates, what justifies each price point, competitive positioning, upsell opportunities, and annual revenue potential. Use real market rates.`,

  operations: (input) => `You are a small business operations advisor. Analyze this business and provide operational guidance.

Business details: ${input}

Provide:
1. True cost breakdown including labor, overhead, and hidden costs
2. Quarterly estimated tax amount to set aside (self-employment tax + income tax)
3. Essential insurance coverage needed and rough cost ranges
4. Break-even analysis — minimum revenue needed per month
5. Key financial ratios to track
6. Top 3 operational improvements to make immediately

Be specific with numbers. Always note that this is educational guidance and they should consult a CPA and licensed insurance professional for their specific situation.`,

  industry: (input) => `You are a business intelligence analyst specializing in small business operations across multiple industries. Analyze this business situation and provide industry-specific operational intelligence.

Business details: ${input}

Provide specific, actionable intelligence for their industry including:
1. Industry-specific cost benchmarks
2. Key metrics to track for their vertical
3. Common profitability mistakes in this industry
4. Revenue optimization specific to their business type
5. Industry-specific tools, licenses, or requirements they may need

Be specific and practical. Focus on what actually moves the needle for a small operator in this space.`,
}

export async function POST(req: NextRequest) {
  try {
    const { tool, input } = await req.json()

    if (!tool || !input) {
      return NextResponse.json({ error: 'Missing tool or input' }, { status: 400 })
    }

    const promptFn = PROMPTS[tool]
    if (!promptFn) {
      return NextResponse.json({ error: 'Invalid tool' }, { status: 400 })
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
        messages: [{ role: 'user', content: promptFn(input) }],
      }),
    })

    const data = await response.json()
    const result = data.content[0].text

    return NextResponse.json({ result }, { status: 200 })

  } catch (err) {
    console.error('AI API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

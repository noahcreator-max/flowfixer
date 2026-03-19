import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const systemPrompt = `
You are an AI workflow diagnostics expert.

Your job is to analyze automation workflows and configurations.

Return your response in STRICT JSON format:

{
  "diagnosis": [
    {
      "issue": "Short description",
      "severity": "Critical | High | Medium | Low",
      "explanation": "Why this is a problem"
    }
  ],
  "fixes": [
    "Step 1 fix",
    "Step 2 fix",
    "Step 3 fix"
  ]
}

Rules:
- Use simple English
- Be concise but actionable
- Focus on technical misconfigurations
- Do NOT add extra text outside JSON
`

export async function POST(req: NextRequest) {
  try {
    const { workflow } = await req.json()
    if (!workflow || typeof workflow !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid workflow text.' },
        { status: 400 }
      )
    }

    const key = process.env.OPENAI_API_KEY
    if (!key) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Set OPENAI_API_KEY in your environment.' },
        { status: 500 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: workflow },
      ],
      temperature: 0.2,
    })

    const content = completion.choices[0].message.content

    if (!content) {
      return NextResponse.json(
        { error: 'No analysis returned from the model.' },
        { status: 500 }
      )
    }

    const parsed = JSON.parse(content)

    return NextResponse.json(parsed)
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Could not parse the analysis. Please try again.' },
        { status: 500 }
      )
    }
    const message = e instanceof Error ? e.message : 'Analysis failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

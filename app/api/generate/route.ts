import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { buildDemoDeck } from '@/lib/demo'
import type { Card, Deck } from '@/lib/types'

const systemPrompt = `
You turn study notes into a TikTok-style microlearning feed.

Return STRICT JSON only, matching exactly:

{
  "title": "Short catchy deck title (max 6 words)",
  "emoji": "one emoji for the topic",
  "cards": [
    {
      "type": "lesson",
      "hook": "punchy 3-6 word opener, like a TikTok caption",
      "title": "the key idea, max 10 words",
      "lines": ["2 to 4 short lines, each under 12 words"],
      "emoji": "one fitting emoji",
      "narration": "2-3 conversational spoken sentences explaining this card, like an enthusiastic teacher on TikTok"
    },
    {
      "type": "quiz",
      "question": "short question testing a previous card",
      "options": ["three options", "exactly three", "one correct"],
      "answerIndex": 0,
      "explanation": "one short sentence why",
      "emoji": "one emoji",
      "narration": "read the question aloud conversationally"
    }
  ]
}

Rules:
- 7 to 10 cards total. Start with a hook lesson card that sells why this topic matters.
- Insert a quiz card after every 2-3 lesson cards. End with a quiz.
- Only teach what is in the notes (you may clarify, but never invent facts beyond them).
- Punchy, friendly, Gen-Z-ish tone, but factually precise.
- "options" must have exactly 3 items; "answerIndex" is 0, 1, or 2.
- Do NOT output anything outside the JSON object.
`

export async function POST(req: NextRequest) {
  let notes: unknown
  try {
    ;({ notes } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (typeof notes !== 'string' || notes.trim().length < 20) {
    return NextResponse.json(
      { error: 'Paste at least a few sentences of notes to generate a feed.' },
      { status: 400 }
    )
  }

  const trimmed = notes.slice(0, 24000)
  const key = process.env.OPENAI_API_KEY

  // No key configured: heuristic demo deck so the app still works.
  if (!key) {
    return NextResponse.json(buildDemoDeck(trimmed))
  }

  try {
    const openai = new OpenAI({ apiKey: key })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here are my notes:\n\n${trimmed}` },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Empty model response')

    const deck = sanitizeDeck(JSON.parse(content))
    if (!deck) throw new Error('Model returned an unusable deck')

    return NextResponse.json(deck)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Generation failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Validate the model output so a malformed card can never crash the feed.
function sanitizeDeck(raw: unknown): Deck | null {
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Record<string, unknown>
  const rawCards = Array.isArray(d.cards) ? d.cards : []

  const cards: Card[] = []
  for (const item of rawCards) {
    if (!item || typeof item !== 'object') continue
    const c = item as Record<string, unknown>

    if (c.type === 'lesson') {
      const lines = Array.isArray(c.lines)
        ? c.lines.filter((l): l is string => typeof l === 'string' && l.trim() !== '')
        : []
      if (typeof c.title !== 'string' || lines.length === 0) continue
      cards.push({
        type: 'lesson',
        hook: typeof c.hook === 'string' ? c.hook : '',
        title: c.title,
        lines: lines.slice(0, 4),
        emoji: typeof c.emoji === 'string' ? c.emoji : '💡',
        narration: typeof c.narration === 'string' ? c.narration : lines.join(' '),
      })
    } else if (c.type === 'quiz') {
      const options = Array.isArray(c.options)
        ? c.options.filter((o): o is string => typeof o === 'string' && o.trim() !== '')
        : []
      const answerIndex = typeof c.answerIndex === 'number' ? c.answerIndex : -1
      if (
        typeof c.question !== 'string' ||
        options.length < 2 ||
        answerIndex < 0 ||
        answerIndex >= options.length
      )
        continue
      cards.push({
        type: 'quiz',
        question: c.question,
        options,
        answerIndex,
        explanation: typeof c.explanation === 'string' ? c.explanation : '',
        emoji: typeof c.emoji === 'string' ? c.emoji : '🤔',
        narration: typeof c.narration === 'string' ? c.narration : c.question,
      })
    }
  }

  if (cards.length === 0) return null
  return {
    title: typeof d.title === 'string' ? d.title : 'Your learning feed',
    emoji: typeof d.emoji === 'string' ? d.emoji : '🧠',
    cards,
  }
}

import type { Deck, LessonCard } from './types'

// No-API-key fallback: split the notes into readable chunks and build a
// simple deck so the feed is usable straight away.
export function buildDemoDeck(notes: string): Deck {
  const paragraphs = notes
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 0)

  // A short first paragraph is almost always a heading — use it as the deck
  // title instead of turning it into a near-empty card.
  let deckTitle = 'Your notes, feed-ified'
  if (paragraphs.length >= 2 && paragraphs[0].length <= 80) {
    deckTitle = truncate(paragraphs[0].replace(/[.:]$/, ''), 48)
    paragraphs.shift()
  }

  const chunks = paragraphs.length >= 2 ? paragraphs : splitSentences(paragraphs.join(' '))

  const emojis = ['📚', '💡', '🧠', '🔍', '⚡', '🎯', '🌱', '🚀']
  const cards: LessonCard[] = chunks.slice(0, 8).map((chunk, i) => {
    const sentences = splitSentences(chunk)
    const title = truncate(sentences[0] ?? chunk, 60)
    // Don't repeat the title as the first line when there's more content.
    const rest = sentences.length > 1 ? sentences.slice(1) : sentences
    const lines = rest.slice(0, 4).map((s) => truncate(s, 90))
    return {
      type: 'lesson',
      hook: i === 0 ? 'Let’s break it down' : `Part ${i + 1}`,
      title,
      lines: lines.length > 0 ? lines : [truncate(chunk, 90)],
      emoji: emojis[i % emojis.length],
      narration: truncate(chunk, 320),
    }
  })

  return {
    title: deckTitle,
    emoji: '📖',
    cards,
    demo: true,
  }
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+|(?<=\n)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  // Cut at a word boundary when one is reasonably close to the limit.
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

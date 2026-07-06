export type LessonCard = {
  type: 'lesson'
  hook: string
  title: string
  lines: string[]
  emoji: string
  narration: string
}

export type QuizCard = {
  type: 'quiz'
  question: string
  options: string[]
  answerIndex: number
  explanation: string
  emoji: string
  narration: string
}

export type Card = LessonCard | QuizCard

export type Deck = {
  title: string
  emoji: string
  cards: Card[]
  demo?: boolean
}

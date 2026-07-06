'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Card, Deck, LessonCard, QuizCard } from '@/lib/types'

const GRADIENTS = [
  ['#7c3aed', '#db2777'],
  ['#2563eb', '#06b6d4'],
  ['#059669', '#84cc16'],
  ['#ea580c', '#f59e0b'],
  ['#dc2626', '#e11d48'],
  ['#0891b2', '#6366f1'],
]

function speak(text: string, muted: boolean) {
  if (muted || typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 1.05
  u.pitch = 1.0
  window.speechSynthesis.speak(u)
}

function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export default function Feed({ deck, onExit }: { deck: Deck; onExit: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [muted, setMuted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  const totalSlides = deck.cards.length + 1 // + end card

  // Track which slide is on screen.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index)
            setActiveIndex(idx)
          }
        }
      },
      { root: containerRef.current, threshold: 0.6 }
    )
    slideRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [totalSlides])

  useEffect(() => stopSpeaking, [])

  const scrollTo = useCallback((idx: number) => {
    slideRefs.current[idx]?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Arrow-key navigation for desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') scrollTo(Math.min(activeIndex + 1, totalSlides - 1))
      if (e.key === 'ArrowUp') scrollTo(Math.max(activeIndex - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeIndex, totalSlides, scrollTo])

  const toggleMute = () => {
    setMuted((m) => {
      if (!m) stopSpeaking()
      return !m
    })
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-3">
        <button
          onClick={onExit}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/90 backdrop-blur transition hover:bg-black/60"
          aria-label="Back to notes"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
          {deck.emoji} {deck.title} · {Math.min(activeIndex + 1, deck.cards.length)}/{deck.cards.length}
        </div>
        <button
          onClick={toggleMute}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/90 backdrop-blur transition hover:bg-black/60"
          aria-label={muted ? 'Unmute narration' : 'Mute narration'}
        >
          {muted ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3L4.5 6H2v4h2.5L8 13V3zM11 6l4 4M15 6l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3L4.5 6H2v4h2.5L8 13V3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 6a3 3 0 010 4M12.5 4a5.5 5.5 0 010 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Snap-scrolling feed */}
      <div
        ref={containerRef}
        className="feed-scroll mx-auto h-full w-full max-w-md snap-y snap-mandatory overflow-y-scroll"
      >
        {deck.cards.map((card, i) => (
          <div
            key={i}
            data-index={i}
            ref={(el) => {
              slideRefs.current[i] = el
            }}
            className="h-full w-full snap-start snap-always"
          >
            {card.type === 'lesson' ? (
              <LessonSlide
                card={card}
                gradient={GRADIENTS[i % GRADIENTS.length]}
                isActive={activeIndex === i}
                muted={muted}
                isLast={i === deck.cards.length - 1}
              />
            ) : (
              <QuizSlide
                card={card}
                gradient={GRADIENTS[i % GRADIENTS.length]}
                isActive={activeIndex === i}
                muted={muted}
              />
            )}
          </div>
        ))}

        {/* End card */}
        <div
          data-index={deck.cards.length}
          ref={(el) => {
            slideRefs.current[deck.cards.length] = el
          }}
          className="h-full w-full snap-start snap-always"
        >
          <EndSlide deck={deck} onExit={onExit} onReplay={() => scrollTo(0)} />
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------- lesson --------------------------------- */

function LessonSlide({
  card,
  gradient,
  isActive,
  muted,
  isLast,
}: {
  card: LessonCard
  gradient: string[]
  isActive: boolean
  muted: boolean
  isLast: boolean
}) {
  const LINE_MS = 2600
  const [step, setStep] = useState(0) // lines revealed so far
  const [playing, setPlaying] = useState(true)
  const [liked, setLiked] = useState(false)
  const done = step >= card.lines.length

  // Reset + narrate whenever this card scrolls into view.
  useEffect(() => {
    if (isActive) {
      setStep(0)
      setPlaying(true)
      speak(card.narration, muted)
    } else {
      setStep(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  useEffect(() => {
    if (!isActive || !playing || done) return
    const t = setTimeout(() => setStep((s) => s + 1), LINE_MS)
    return () => clearTimeout(t)
  }, [isActive, playing, step, done])

  const togglePlay = () => {
    if (done) return
    setPlaying((p) => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (p) window.speechSynthesis.pause()
        else window.speechSynthesis.resume()
      }
      return !p
    })
  }

  return (
    <div
      className="relative flex h-full w-full cursor-pointer select-none flex-col justify-center px-7"
      style={{ background: `linear-gradient(160deg, ${gradient[0]}, ${gradient[1]})` }}
      onClick={togglePlay}
    >
      {/* Story-style progress segments */}
      <div className="absolute inset-x-4 top-14 z-10 flex gap-1.5">
        {card.lines.map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white"
              style={
                i < step
                  ? { width: '100%' }
                  : i === step && isActive
                    ? {
                        width: '0%',
                        animation: `fillbar ${LINE_MS}ms linear forwards`,
                        animationPlayState: playing ? 'running' : 'paused',
                      }
                    : { width: '0%' }
              }
            />
          </div>
        ))}
      </div>

      <div className="mb-4 text-6xl drop-shadow-lg" style={{ animation: 'popIn 0.5s ease both' }}>
        {card.emoji}
      </div>

      {card.hook && (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-white/70" style={{ animation: 'fadeUp 0.5s ease both' }}>
          {card.hook}
        </p>
      )}

      <h2
        className="mb-6 text-3xl font-extrabold leading-tight text-white drop-shadow-sm sm:text-4xl"
        style={{ animation: 'fadeUp 0.6s ease both' }}
      >
        {card.title}
      </h2>

      <div className="space-y-3">
        {card.lines.slice(0, step).map((line, i) => (
          <p
            key={i}
            className="rounded-xl bg-black/20 px-4 py-3 text-base font-medium leading-snug text-white backdrop-blur-sm"
            style={{ animation: 'fadeUp 0.45s ease both' }}
          >
            {line}
          </p>
        ))}
      </div>

      {/* Paused indicator */}
      {!playing && !done && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 backdrop-blur">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Action rail */}
      <div className="absolute bottom-24 right-4 flex flex-col items-center gap-5">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setLiked((l) => !l)
          }}
          className="flex flex-col items-center gap-1 text-white/90 transition-transform active:scale-125"
          aria-label="Like"
        >
          <span className={`text-3xl drop-shadow ${liked ? '' : 'grayscale opacity-70'}`}>❤️</span>
          <span className="text-[10px] font-semibold">{liked ? 'Liked' : 'Like'}</span>
        </button>
      </div>

      {/* Swipe hint */}
      {done && !isLast && (
        <div
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-white/90"
          style={{ animation: 'fadeUp 0.5s ease both' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: 'bounceUp 1.4s ease-in-out infinite' }}>
            <path d="M10 16V4M5 9l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs font-semibold">swipe for more</span>
        </div>
      )}
    </div>
  )
}

/* ----------------------------------- quiz ---------------------------------- */

function QuizSlide({
  card,
  gradient,
  isActive,
  muted,
}: {
  card: QuizCard
  gradient: string[]
  isActive: boolean
  muted: boolean
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const correct = picked === card.answerIndex

  useEffect(() => {
    if (isActive) {
      setPicked(null)
      speak(card.narration, muted)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  const pick = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    speak(i === card.answerIndex ? `Correct! ${card.explanation}` : `Not quite. ${card.explanation}`, muted)
  }

  return (
    <div
      className="relative flex h-full w-full select-none flex-col justify-center px-7"
      style={{ background: `linear-gradient(160deg, ${gradient[0]}cc, #111 90%)` }}
    >
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
        ⚡ Quick quiz
      </p>
      <div className="mb-3 text-5xl">{card.emoji}</div>
      <h2 className="mb-7 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
        {card.question}
      </h2>

      <div className="space-y-3">
        {card.options.map((opt, i) => {
          const isAnswer = i === card.answerIndex
          const isPicked = i === picked
          let style = 'bg-white/10 text-white hover:bg-white/20'
          if (picked !== null) {
            if (isAnswer) style = 'bg-green-500 text-white'
            else if (isPicked) style = 'bg-red-500/80 text-white'
            else style = 'bg-white/5 text-white/40'
          }
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={picked !== null}
              className={`w-full rounded-xl px-4 py-3.5 text-left text-base font-semibold backdrop-blur-sm transition-all ${style}`}
            >
              <span className="mr-2 opacity-60">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          )
        })}
      </div>

      {picked !== null && (
        <div
          className="mt-6 rounded-xl bg-black/40 px-4 py-3 backdrop-blur-sm"
          style={{ animation: 'fadeUp 0.4s ease both' }}
        >
          <p className="mb-1 text-sm font-bold text-white">
            {correct ? '🎉 Nailed it!' : '😅 Not quite'}
          </p>
          {card.explanation && (
            <p className="text-sm leading-snug text-white/80">{card.explanation}</p>
          )}
        </div>
      )}

      {picked !== null && (
        <div
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-white/90"
          style={{ animation: 'fadeUp 0.5s ease both' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: 'bounceUp 1.4s ease-in-out infinite' }}>
            <path d="M10 16V4M5 9l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs font-semibold">keep scrolling</span>
        </div>
      )}
    </div>
  )
}

/* ----------------------------------- end ----------------------------------- */

function EndSlide({ deck, onExit, onReplay }: { deck: Deck; onExit: () => void; onReplay: () => void }) {
  const lessons = deck.cards.filter((c: Card) => c.type === 'lesson').length
  const quizzes = deck.cards.filter((c: Card) => c.type === 'quiz').length

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#1a1a2e] to-black px-8 text-center">
      <div className="mb-5 text-7xl" style={{ animation: 'popIn 0.6s ease both' }}>
        🎓
      </div>
      <h2 className="mb-2 text-3xl font-extrabold text-white">You made it!</h2>
      <p className="mb-8 text-sm leading-relaxed text-white/60">
        {lessons} micro-lesson{lessons === 1 ? '' : 's'}
        {quizzes > 0 ? ` and ${quizzes} quiz${quizzes === 1 ? '' : 'zes'}` : ''} — learned by
        scrolling. That’s the good kind of screen time.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onReplay}
          className="rounded-full bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20"
        >
          ↺ Replay
        </button>
        <button
          onClick={onExit}
          className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-white/90"
        >
          New notes →
        </button>
      </div>
    </div>
  )
}

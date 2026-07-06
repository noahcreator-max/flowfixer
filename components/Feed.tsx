'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Card, Deck, LessonCard, QuizCard } from '@/lib/types'

const GRADIENTS = [
  ['#6d28d9', '#be185d'],
  ['#1d4ed8', '#0e7490'],
  ['#047857', '#4d7c0f'],
  ['#c2410c', '#b45309'],
  ['#be123c', '#7e22ce'],
  ['#0e7490', '#4338ca'],
]

function cardBackground(g: string[]) {
  return [
    'radial-gradient(120% 90% at 85% -10%, rgba(255,255,255,0.22), transparent 55%)',
    'radial-gradient(110% 90% at -15% 115%, rgba(0,0,0,0.45), transparent 60%)',
    `linear-gradient(165deg, ${g[0]}, ${g[1]})`,
  ].join(', ')
}

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
    <div className="fixed inset-0 flex items-center justify-center bg-[#08080e]">
      {/* Ambient desktop backdrop */}
      <div
        className="pointer-events-none absolute inset-0 hidden opacity-40 sm:block"
        style={{
          background:
            'radial-gradient(600px 400px at 20% 15%, rgba(109,40,217,0.35), transparent 65%), radial-gradient(600px 400px at 80% 85%, rgba(190,24,93,0.3), transparent 65%)',
        }}
      />

      {/* Phone frame (full-bleed on mobile) */}
      <div
        className="relative h-full w-full overflow-hidden sm:h-[min(94vh,860px)] sm:w-[420px] sm:rounded-[2.2rem] sm:border sm:border-white/10 sm:shadow-[0_0_80px_rgba(124,58,237,0.25),0_25px_60px_rgba(0,0,0,0.6)]"
        style={{ animation: 'fadeIn 0.5s ease both' }}
      >
        {/* Top bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pb-6 pt-4"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)' }}
        >
          <button
            onClick={onExit}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white/90 backdrop-blur-md transition hover:bg-black/60"
            aria-label="Back to notes"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md">
            <span>{deck.emoji}</span>
            <span className="max-w-[160px] truncate">{deck.title}</span>
            <span className="text-white/50">
              {Math.min(activeIndex + 1, deck.cards.length)}/{deck.cards.length}
            </span>
          </div>
          <button
            onClick={toggleMute}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white/90 backdrop-blur-md transition hover:bg-black/60"
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
          className="feed-scroll h-full w-full snap-y snap-mandatory overflow-y-scroll"
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
                  deckTitle={deck.title}
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
    </div>
  )
}

/* ------------------------------ shared pieces ------------------------------ */

function SpeakingBars({ muted }: { muted: boolean }) {
  if (muted) return <span className="text-[11px] text-white/60">🔇 narration off</span>
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/75">
      <span className="flex h-3 items-end gap-[2px]">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-white/80"
            style={{
              height: '100%',
              animation: `equalize 0.9s ease-in-out ${i * 0.15}s infinite`,
              transformOrigin: 'bottom',
            }}
          />
        ))}
      </span>
      AI voice narration
    </span>
  )
}

function SwipeHint({ label }: { label: string }) {
  return (
    <div
      className="absolute bottom-[5.5rem] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-white"
      style={{ animation: 'fadeUp 0.5s ease both' }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: 'bounceUp 1.4s ease-in-out infinite' }}>
        <path d="M10 16V4M5 9l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-xs font-bold tracking-wide drop-shadow">{label}</span>
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
  deckTitle,
}: {
  card: LessonCard
  gradient: string[]
  isActive: boolean
  muted: boolean
  isLast: boolean
  deckTitle: string
}) {
  const LINE_MS = 2600
  const [step, setStep] = useState(0) // lines revealed so far
  const [playing, setPlaying] = useState(true)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
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
      className="noise relative flex h-full w-full cursor-pointer select-none flex-col justify-center overflow-hidden px-6 pb-28 pt-24"
      style={{ background: cardBackground(gradient) }}
      onClick={togglePlay}
    >
      {/* Giant emoji watermark */}
      <div
        className="pointer-events-none absolute -right-10 -top-6 text-[170px] opacity-[0.13] blur-[1px]"
        style={{ animation: 'floaty 7s ease-in-out infinite' }}
      >
        {card.emoji}
      </div>

      {/* Story-style progress segments */}
      <div className="absolute inset-x-4 top-[3.75rem] z-10 flex gap-1.5">
        {card.lines.map((_, i) => (
          <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]"
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

      <div className="relative">
        <div className="mb-5 text-6xl drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]" style={{ animation: 'popIn 0.55s ease both' }}>
          {card.emoji}
        </div>

        {card.hook && (
          <span
            className="mb-3 inline-flex items-center gap-1.5 self-start rounded-full border border-white/25 bg-black/25 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm"
            style={{ animation: 'fadeUp 0.5s ease both' }}
          >
            ✦ {card.hook}
          </span>
        )}

        <h2
          className="mb-6 text-[2.1rem] font-black leading-[1.08] tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] sm:text-4xl"
          style={{ animation: 'fadeUp 0.6s ease 0.05s both' }}
        >
          {card.title}
        </h2>

        <div className="space-y-2.5">
          {card.lines.slice(0, step).map((line, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-2xl border border-white/15 bg-black/25 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md"
              style={{ animation: 'fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both' }}
            >
              <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              <p className="text-[15px] font-medium leading-snug text-white">{line}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Paused indicator */}
      {!playing && !done && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/35" style={{ animation: 'fadeIn 0.2s ease both' }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-black/50 backdrop-blur">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Bottom caption bar */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-end justify-between px-4 pb-5 pt-16"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }}
      >
        <div className="mr-3 min-w-0">
          <p className="truncate text-[13px] font-bold text-white">@scrolllearn · {deckTitle}</p>
          <div className="mt-1"><SpeakingBars muted={muted} /></div>
        </div>

        {/* Action rail */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setLiked((l) => !l)
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/30 backdrop-blur-md transition hover:bg-black/50"
            aria-label="Like"
          >
            <span
              className={`text-xl ${liked ? '' : 'opacity-60 grayscale'}`}
              style={liked ? { animation: 'heartPop 0.4s ease both' } : undefined}
            >
              ❤️
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSaved((s) => !s)
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/30 backdrop-blur-md transition hover:bg-black/50"
            aria-label="Save"
          >
            <span
              className={`text-xl ${saved ? '' : 'opacity-60 grayscale'}`}
              style={saved ? { animation: 'heartPop 0.4s ease both' } : undefined}
            >
              🔖
            </span>
          </button>
        </div>
      </div>

      {done && !isLast && <SwipeHint label="swipe for more" />}
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
      className="noise relative flex h-full w-full select-none flex-col justify-center overflow-hidden px-6 pb-24 pt-24"
      style={{
        background: [
          'radial-gradient(130% 80% at 80% -10%, rgba(255,255,255,0.14), transparent 55%)',
          `linear-gradient(165deg, ${gradient[0]}dd, #0c0c14 92%)`,
        ].join(', '),
      }}
    >
      <div
        className="pointer-events-none absolute -left-12 bottom-10 text-[150px] opacity-[0.1] blur-[1px]"
        style={{ animation: 'floaty 8s ease-in-out infinite' }}
      >
        {card.emoji}
      </div>

      <div className="relative">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200">
          ⚡ pop quiz
        </span>

        <h2 className="mb-8 text-[1.7rem] font-black leading-[1.15] tracking-tight text-white drop-shadow sm:text-3xl">
          {card.question}
        </h2>

        <div className="space-y-3">
          {card.options.map((opt, i) => {
            const isAnswer = i === card.answerIndex
            const isPicked = i === picked
            let cls = 'border-white/15 bg-white/[0.08] text-white hover:border-white/35 hover:bg-white/[0.14]'
            let badge = 'bg-white/15 text-white/80'
            if (picked !== null) {
              if (isAnswer) {
                cls = 'border-emerald-300/60 bg-emerald-500/85 text-white shadow-[0_0_24px_rgba(16,185,129,0.35)]'
                badge = 'bg-white/25 text-white'
              } else if (isPicked) {
                cls = 'border-red-400/60 bg-red-500/70 text-white'
                badge = 'bg-white/25 text-white'
              } else {
                cls = 'border-white/5 bg-white/[0.03] text-white/35'
                badge = 'bg-white/10 text-white/35'
              }
            }
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={picked !== null}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] font-semibold backdrop-blur-md transition-all active:scale-[0.98] ${cls}`}
              >
                <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-black ${badge}`}>
                  {picked !== null && isAnswer ? '✓' : picked !== null && isPicked ? '✕' : String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            )
          })}
        </div>

        {picked !== null && (
          <div
            className="mt-6 rounded-2xl border border-white/15 bg-black/40 px-4 py-3.5 backdrop-blur-md"
            style={{ animation: 'fadeUp 0.4s ease both' }}
          >
            <p className="mb-1 text-sm font-black text-white">
              {correct ? '🎉 Nailed it!' : '😅 Not quite'}
            </p>
            {card.explanation && (
              <p className="text-sm leading-snug text-white/80">{card.explanation}</p>
            )}
          </div>
        )}
      </div>

      {picked !== null && <SwipeHint label="keep scrolling" />}
    </div>
  )
}

/* ----------------------------------- end ----------------------------------- */

function EndSlide({ deck, onExit, onReplay }: { deck: Deck; onExit: () => void; onReplay: () => void }) {
  const lessons = deck.cards.filter((c: Card) => c.type === 'lesson').length
  const quizzes = deck.cards.filter((c: Card) => c.type === 'quiz').length

  return (
    <div
      className="noise relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-8 text-center"
      style={{
        background:
          'radial-gradient(90% 60% at 50% 0%, rgba(124,58,237,0.35), transparent 60%), linear-gradient(180deg, #16112b, #08080e)',
      }}
    >
      {/* Halo ring */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30"
        style={{
          background: 'conic-gradient(from 0deg, #7c3aed, #db2777, #f59e0b, #7c3aed)',
          filter: 'blur(60px)',
          animation: 'slowSpin 12s linear infinite',
        }}
      />

      <div className="relative">
        <div className="mb-5 text-7xl drop-shadow-[0_10px_30px_rgba(124,58,237,0.5)]" style={{ animation: 'popIn 0.6s ease both' }}>
          🎓
        </div>
        <h2 className="mb-2 text-4xl font-black tracking-tight text-white">You made it!</h2>
        <p className="mx-auto mb-7 max-w-xs text-sm leading-relaxed text-white/60">
          That&apos;s the good kind of screen time.
        </p>

        <div className="mb-9 flex justify-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 backdrop-blur">
            <p className="text-2xl font-black text-white">{lessons}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">lessons</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 backdrop-blur">
            <p className="text-2xl font-black text-white">{quizzes}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">quizzes</p>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={onReplay}
            className="rounded-full border border-white/15 bg-white/[0.08] px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/[0.16]"
          >
            ↺ Replay
          </button>
          <button
            onClick={onExit}
            className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white shadow-[0_8px_30px_rgba(139,92,246,0.4)] transition hover:brightness-110"
          >
            New notes →
          </button>
        </div>
      </div>
    </div>
  )
}

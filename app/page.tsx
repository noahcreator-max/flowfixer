'use client'

import { useEffect, useState } from 'react'
import Feed from '@/components/Feed'
import type { Deck } from '@/lib/types'

const EXAMPLE_NOTES = `Photosynthesis — Biology, Chapter 4

Photosynthesis is the process plants use to convert light energy into chemical energy stored in glucose. It takes place mainly in the leaves, inside organelles called chloroplasts, which contain the green pigment chlorophyll.

The overall equation: 6 CO2 + 6 H2O + light energy → C6H12O6 + 6 O2. Plants take in carbon dioxide through stomata and absorb water through their roots.

There are two stages. The light-dependent reactions happen in the thylakoid membranes: light splits water molecules, releasing oxygen and producing ATP and NADPH. The light-independent reactions (Calvin cycle) happen in the stroma: ATP and NADPH are used to fix carbon dioxide into glucose.

Factors that affect the rate of photosynthesis include light intensity, carbon dioxide concentration, and temperature. Each acts as a limiting factor — the rate is capped by whichever is in shortest supply.

Why it matters: photosynthesis produces nearly all the oxygen in Earth's atmosphere and is the entry point of energy into almost every food chain.`

const LOADING_MESSAGES = [
  'Reading your notes…',
  'Finding the key ideas…',
  'Writing hooks and captions…',
  'Cooking up quiz questions…',
  'Building your feed…',
]

const PREVIEW_CARDS = [
  {
    emoji: '🧬',
    hook: 'Mind = blown',
    title: 'Your DNA is 2 meters long',
    line: 'Stretched out, the DNA in one cell is taller than you.',
    gradient: ['#6d28d9', '#be185d'],
  },
  {
    emoji: '⚡',
    hook: 'Pop quiz',
    title: 'Where does photosynthesis happen?',
    line: 'A. Chloroplasts ✓',
    gradient: ['#1d4ed8', '#0e7490'],
  },
  {
    emoji: '🌍',
    hook: 'Big picture',
    title: 'Plants made your oxygen',
    line: 'Nearly all breathable O₂ comes from photosynthesis.',
    gradient: ['#047857', '#4d7c0f'],
  },
]

function PhonePreview() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % PREVIEW_CARDS.length), 3200)
    return () => clearInterval(t)
  }, [])

  const card = PREVIEW_CARDS[idx]

  return (
    <div className="relative h-[430px] w-[215px] overflow-hidden rounded-[2rem] border border-white/15 shadow-[0_0_60px_rgba(124,58,237,0.35),0_20px_50px_rgba(0,0,0,0.5)]">
      <div
        key={idx}
        className="noise relative flex h-full w-full flex-col justify-center px-5"
        style={{
          background: `radial-gradient(120% 90% at 85% -10%, rgba(255,255,255,0.22), transparent 55%), linear-gradient(165deg, ${card.gradient[0]}, ${card.gradient[1]})`,
          animation: 'fadeIn 0.5s ease both',
        }}
      >
        {/* progress dots */}
        <div className="absolute inset-x-3 top-3 flex gap-1">
          {PREVIEW_CARDS.map((_, i) => (
            <div key={i} className={`h-[3px] flex-1 rounded-full ${i <= idx ? 'bg-white' : 'bg-white/25'}`} />
          ))}
        </div>
        <div className="mb-3 text-4xl" style={{ animation: 'popIn 0.5s ease both' }}>
          {card.emoji}
        </div>
        <span className="mb-2 inline-block self-start rounded-full border border-white/25 bg-black/25 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-white/85">
          ✦ {card.hook}
        </span>
        <p className="mb-3 text-lg font-black leading-tight text-white" style={{ animation: 'fadeUp 0.5s ease both' }}>
          {card.title}
        </p>
        <div
          className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-[11px] font-medium leading-snug text-white backdrop-blur-sm"
          style={{ animation: 'fadeUp 0.5s ease 0.5s both' }}
        >
          {card.line}
        </div>
        <div className="absolute bottom-3 left-4 text-[9px] font-bold text-white/80">@scrolllearn</div>
      </div>
    </div>
  )
}

export default function Home() {
  const [notes, setNotes] = useState('')
  const [deck, setDeck] = useState<Deck | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(0)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!loading) return
    setLoadingMsg(0)
    const t = setInterval(
      () => setLoadingMsg((m) => Math.min(m + 1, LOADING_MESSAGES.length - 1)),
      1600
    )
    return () => clearInterval(t)
  }, [loading])

  const handleGenerate = async () => {
    if (!notes.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setDeck(data as Deck)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (deck) {
    return <Feed deck={deck} onExit={() => setDeck(null)} />
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08080e] text-white">
      {/* Ambient glows */}
      <div
        className="pointer-events-none absolute -top-48 left-1/4 h-[560px] w-[720px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, #6d28d9, transparent)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-64 right-0 h-[460px] w-[560px] rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, #be185d, transparent)' }}
      />
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black, transparent)',
        }}
      />

      <main
        className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-14"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(14px)',
          transition: 'all 0.6s ease',
        }}
      >
        {/* Brand */}
        <div className="mb-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg shadow-[0_4px_20px_rgba(139,92,246,0.5)]">
            🧠
          </div>
          <span className="text-lg font-extrabold tracking-tight">ScrollLearn</span>
          <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
            beta
          </span>
        </div>

        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start">
          {/* Left: copy + input */}
          <div className="w-full max-w-xl">
            <h1 className="mb-4 text-[2.6rem] font-black leading-[1.05] tracking-tight sm:text-6xl">
              Your notes,
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                but addictive.
              </span>
            </h1>
            <p className="mb-8 max-w-md text-[15px] leading-relaxed text-white/55">
              Paste your class notes or curriculum. AI turns them into a TikTok-style feed of
              bite-size lessons — narrated, animated, with quizzes as you scroll.
            </p>

            <div className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur transition-colors focus-within:border-violet-400/50">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
                <span className="flex items-center gap-2 text-xs font-semibold text-white/50">
                  <span className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  </span>
                  your-notes.txt
                </span>
                <button
                  onClick={() => setNotes(EXAMPLE_NOTES)}
                  className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20"
                >
                  ✨ try example notes
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={`Paste anything you're studying:\n\n•  lecture notes\n•  a textbook chapter\n•  flashcard dumps\n•  that doc your teacher shared`}
                className="min-h-[210px] w-full resize-none bg-transparent px-5 py-4 text-sm leading-relaxed text-white/85 outline-none placeholder:text-white/25"
              />
              <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3.5">
                <span className="text-xs font-medium text-white/30">
                  {notes.length.toLocaleString()} characters
                </span>
                <button
                  onClick={handleGenerate}
                  disabled={loading || notes.trim().length < 20}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2.5 text-sm font-bold text-white shadow-[0_8px_30px_rgba(139,92,246,0.35)] transition-all hover:brightness-110 active:scale-95 disabled:opacity-25 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {LOADING_MESSAGES[loadingMsg]}
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M3 1.5l7 4.5-7 4.5v-9z" />
                      </svg>
                      Make my feed
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-2">
              {[
                ['🎬', 'animated slides'],
                ['🔊', 'spoken narration'],
                ['⚡', 'quizzes as you scroll'],
                ['📱', 'swipe like TikTok'],
              ].map(([icon, label]) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/50"
                >
                  <span>{icon}</span> {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right: live phone preview */}
          <div className="hidden flex-shrink-0 lg:block" style={{ animation: 'fadeUp 0.7s ease 0.2s both' }}>
            <div className="relative">
              <PhonePreview />
              <p className="mt-4 text-center text-xs font-medium text-white/35">
                ↑ what your notes become
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

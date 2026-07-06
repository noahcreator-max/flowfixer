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
    <div className="relative min-h-screen overflow-hidden bg-[#0b0b14] text-white">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, #7c3aed, transparent)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-56 right-0 h-[400px] w-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, #db2777, transparent)' }}
      />

      <main
        className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-14"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(14px)',
          transition: 'all 0.6s ease',
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="text-lg font-extrabold tracking-tight">ScrollLearn</span>
          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/50">
            beta
          </span>
        </div>

        <h1 className="mb-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Your notes,
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            but addictive.
          </span>
        </h1>
        <p className="mb-8 max-w-md text-sm leading-relaxed text-white/60">
          Paste your class notes or curriculum. AI turns them into a TikTok-style feed of
          bite-size lessons with narration, animations, and quizzes. Learn by scrolling.
        </p>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <span className="text-xs text-white/50">📋 your notes</span>
            <button
              onClick={() => setNotes(EXAMPLE_NOTES)}
              className="text-xs text-violet-300 transition hover:text-violet-200"
            >
              try example notes →
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`Paste anything you're studying:\n\n• lecture notes\n• a textbook chapter\n• flashcard dumps\n• that doc your teacher shared`}
            className="min-h-[220px] w-full resize-none bg-transparent p-4 text-sm leading-relaxed text-white/85 outline-none placeholder:text-white/30"
          />
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
            <span className="text-xs text-white/35">{notes.length.toLocaleString()} chars</span>
            <button
              onClick={handleGenerate}
              disabled={loading || notes.trim().length < 20}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-30"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {LOADING_MESSAGES[loadingMsg]}
                </>
              ) : (
                <>▶ Make my feed</>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/35">
          <span>🎬 animated slides</span>
          <span>🔊 spoken narration</span>
          <span>⚡ quizzes as you scroll</span>
          <span>📱 swipe like TikTok</span>
        </div>
      </main>
    </div>
  )
}

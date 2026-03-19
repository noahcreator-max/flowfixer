'use client'

import { useEffect, useState, ChangeEvent } from 'react'

const exampleWorkflow = `Trigger: Webhook (POST /lead)

Steps:
1. Receive form submission from landing page
2. Send lead data to OpenAI for qualification
3. Store qualified lead in Airtable
4. Send Slack notification to sales team
5. Trigger follow-up email via Gmail API

Config:
- OpenAI API key: not set
- Airtable base ID: undefined
- Gmail OAuth: expired token
- Slack webhook: wrong channel ID`

const SEVERITY_CONFIG = {
  Critical: {
    dot: '#ef4444',
    badge: 'bg-red-500/10 text-red-400 border border-red-500/20',
  },
  High: {
    dot: '#f97316',
    badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  },
  Medium: {
    dot: '#eab308',
    badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  },
  Low: {
    dot: '#22c55e',
    badge: 'bg-green-500/10 text-green-400 border border-green-500/20',
  },
} as const

type DiagnosisItem = {
  issue: string
  severity: keyof typeof SEVERITY_CONFIG | string
  explanation: string
}

type ApiResult = {
  diagnosis?: DiagnosisItem[]
  fixes?: string[]
}

export default function Home() {
  const [workflow, setWorkflow] = useState('')
  const [result, setResult] = useState<ApiResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAnalyze = async () => {
    if (!workflow.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow }),
      })

      if (!res.ok) throw new Error('Analysis failed')
      const data: ApiResult = await res.json()
      setResult(data)
    } catch {
      setError('Something went wrong. Check your API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setWorkflow(e.target.value)
    setCharCount(e.target.value.length)
  }

  const criticalCount =
    result?.diagnosis?.filter((d) => d.severity === 'Critical').length ?? 0

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8]"
      style={{ fontFamily: "'DM Mono', 'Fira Code', monospace" }}
    >
      {/* Subtle grid background */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7h4m0 0V3m0 4v4m0-4h4"
                stroke="#0a0a0a"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">
            FlowFixer
          </span>
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/40">
            beta
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="hidden text-xs text-white/60 sm:block">
            Workflow debugger for AI builders
          </span>
          <button className="text-xs text-white/60 transition-colors hover:text-white">
            Docs
          </button>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-16">
        {/* Hero */}
        <div
          className="mb-14"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.5s ease',
          }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            <span className="text-xs text-white/65">AI-powered diagnostics</span>
          </div>

          <h1
            className="mb-4 text-5xl font-bold leading-none tracking-tight text-white sm:text-6xl"
            style={{ fontFamily: "'DM Mono', monospace", letterSpacing: '-0.03em' }}
          >
            Why doesn&apos;t
            <br />
            <span className="text-white/65">this work?</span>
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-white/70">
            Paste any workflow config — n8n, Zapier, LangChain, CrewAI. Get an
            instant diagnosis with exact fixes. No guessing.
          </p>
        </div>

        {/* Main panel */}
        <div
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.6s ease 0.1s',
          }}
        >
          {/* Input card */}
          <div
            className="flex flex-col overflow-hidden rounded-2xl border bg-white/[0.03]"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div
              className="flex items-center justify-between border-b px-4 py-3"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-white/10" />
                <span className="text-xs text-white/60">workflow.config</span>
              </div>
              <button
                onClick={() => {
                  setWorkflow(exampleWorkflow)
                  setCharCount(exampleWorkflow.length)
                }}
                className="text-xs text-white/45 transition-colors hover:text-white/65"
              >
                load example →
              </button>
            </div>

            <textarea
              value={workflow}
              onChange={handleTextChange}
              placeholder={`# Paste your workflow here

Supports:
- JSON / YAML configs
- n8n flows
- Zapier zaps
- LangChain agents
- Plain text descriptions`}
              className="min-h-[300px] flex-1 resize-none bg-transparent p-4 text-xs leading-relaxed text-white/80 outline-none placeholder-[color:rgba(255,255,255,0.35)]"
            />

            <div
              className="flex items-center justify-between border-t px-4 py-3"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <span className="text-xs text-white/40">{charCount} chars</span>
              <button
                onClick={handleAnalyze}
                disabled={loading || !workflow.trim()}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black transition-all hover:bg-white/90 disabled:opacity-30"
              >
                {loading ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border border-black/30 border-t-black" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6h8M6 2l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Run Diagnostics
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output card */}
          <div
            className="flex flex-col overflow-hidden rounded-2xl border bg-white/[0.03]"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div
              className="flex items-center justify-between border-b px-4 py-3"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    result ? (criticalCount > 0 ? 'bg-red-400' : 'bg-green-400') : 'bg-white/10'
                  }`}
                />
                <span className="text-xs text-white/60">
                  {result ? `${result.diagnosis?.length ?? 0} issues found` : 'diagnostics output'}
                </span>
              </div>
              {result && (
                <button
                  onClick={() => {
                    const text = result.fixes?.join('\n') ?? ''
                    if (text) {
                      void navigator.clipboard.writeText(text)
                    }
                  }}
                  className="text-xs text-white/45 transition-colors hover:text-white/65"
                >
                  copy fixes →
                </button>
              )}
            </div>

            <div className="min-h-[300px] flex-1 overflow-auto p-4">
              {/* Empty state */}
              {!result && !loading && !error && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M9 3v6l4 2"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="9"
                        cy="9"
                        r="7"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                  <p className="max-w-[180px] text-xs leading-relaxed text-white/40">
                    Paste your workflow on the left and run diagnostics
                  </p>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex h-full flex-col items-center justify-center gap-4">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-white/30"
                        style={{
                          animation: 'pulse 1.2s ease-in-out infinite',
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-white/40">Analyzing workflow...</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* Results */}
              {result && !loading && (
                <div className="space-y-5">
                  {/* Issues */}
                  {result.diagnosis && result.diagnosis.length > 0 && (
                    <div>
                      <p className="mb-3 text-xs uppercase tracking-widest text-white/45">
                        Issues
                      </p>
                      <div className="space-y-2">
                        {result.diagnosis.map((item, i) => {
                          const config =
                            SEVERITY_CONFIG[item.severity as keyof typeof SEVERITY_CONFIG] ??
                            SEVERITY_CONFIG.Low
                          return (
                            <div
                              key={i}
                              className="rounded-xl border bg-white/[0.03] p-3"
                              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                            >
                              <div className="mb-1.5 flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                    style={{ backgroundColor: config.dot }}
                                  />
                                  <p className="text-xs font-medium text-white/80">
                                    {item.issue}
                                  </p>
                                </div>
                                <span
                                  className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] ${config.badge}`}
                                >
                                  {item.severity}
                                </span>
                              </div>
                              <p className="pl-3.5 text-xs leading-relaxed text-white/65">
                                {item.explanation}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Fixes */}
                  {result.fixes && result.fixes.length > 0 && (
                    <div>
                      <p className="mb-3 text-xs uppercase tracking-widest text-white/45">
                        Step-by-step fixes
                      </p>
                      <div className="space-y-2">
                        {result.fixes.map((fix, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="mt-0.5 flex-shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <p className="text-xs leading-relaxed text-white/80">{fix}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer stat bar */}
        <div
          className="mt-8 flex items-center gap-6 text-xs text-white/40"
          style={{
            opacity: mounted ? 1 : 0,
            transition: 'all 0.7s ease 0.2s',
          }}
        >
          <span>n8n · Zapier · Make · LangChain · CrewAI · Custom</span>
          <span className="ml-auto">Powered by GPT-4o</span>
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}


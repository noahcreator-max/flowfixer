# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlowFixer is a single-page Next.js 14 (App Router) app that diagnoses automation workflow configs (n8n, Zapier, LangChain, etc.). The user pastes a workflow as text, and it is sent to the OpenAI API which returns a JSON diagnosis (issues with severities) plus step-by-step fixes.

## Commands

- `npm run dev` — start the dev server (localhost:3000)
- `npm run build` — production build (also the de facto type check; there is no separate typecheck script)
- `npm run lint` — ESLint via `eslint-config-next`
- `npm start` — serve the production build

There are no tests or test framework configured.

Requires `OPENAI_API_KEY` in the environment (see `.env.example`; copy to `.env.local` for local dev). The UI works without it, but analysis requests return a 500.

## Architecture

Three source files carry the entire app:

- `app/page.tsx` — client component (`'use client'`) containing the whole UI: input textarea, results panel, loading/error/empty states, and the fetch to the API route. Styling is Tailwind utility classes mixed with inline `style` props and a `<style jsx global>` block (fonts, scrollbar, keyframes).
- `app/api/analyze/route.ts` — the only API route. `POST /api/analyze` takes `{ workflow: string }`, calls OpenAI (`gpt-4o-mini`, low temperature) with a system prompt demanding strict JSON, parses the response with `JSON.parse`, and returns it directly. Errors are returned as `{ error: string }` with 400/500 status.
- `app/layout.tsx` — root layout with metadata; imports `app/globals.css`.

## Key Conventions

- The API contract between route and page is implicit: the route returns whatever JSON shape the model produced, and the page types it loosely as `ApiResult` (`diagnosis?: DiagnosisItem[]`, `fixes?: string[]`) with optional chaining everywhere. If you change the system prompt's JSON schema in `route.ts`, update `ApiResult` / `SEVERITY_CONFIG` rendering in `page.tsx` to match.
- Severity values are the string literals `Critical | High | Medium | Low`; unknown severities fall back to the `Low` styling via `SEVERITY_CONFIG`.
- TypeScript strict mode is on; path alias `@/*` maps to the repo root.
- No semicolons, single quotes (match existing style — there is no Prettier config, so don't reformat).
- Dark-theme-only UI built around a `#0a0a0a` background with white/opacity-based colors (`text-white/60` etc.); new UI should follow that palette.

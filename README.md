# 🧠 ScrollLearn

**TikTok, but for learning.** Paste your notes or curriculum and AI turns them into a
vertical, swipeable feed of bite-size lessons — with animated text, spoken narration,
and quizzes mixed in. Learn by scrolling.

## How it works

1. Paste any study material (lecture notes, a textbook chapter, a shared doc).
2. The AI (`gpt-4o-mini`) breaks it into 7–10 "cards": punchy micro-lessons and quick quizzes.
3. Each card plays like a short video — lines animate in on a timer with story-style
   progress bars, and the browser's speech synthesis narrates it out loud.
4. Swipe (or press ↓) for the next card. Quizzes are tappable with instant feedback.

## Running it

```bash
npm install
cp .env.example .env.local   # add your OpenAI API key
npm run dev
```

Then open http://localhost:3000.

**No API key?** The app still works — it falls back to a demo mode that splits your
notes into cards heuristically, so you can feel the scrolling experience before wiring
up AI generation.

## Roadmap ideas

- Real AI voices (e.g. OpenAI TTS) instead of browser speech synthesis
- Generated background visuals/images per card
- Spaced-repetition: resurface cards you got wrong in future feeds
- Save decks and share them with classmates
- True AI video generation once it's fast/cheap enough

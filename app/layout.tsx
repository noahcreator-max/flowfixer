import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ScrollLearn — your notes, but addictive',
  description:
    'Paste your notes or curriculum and AI turns them into a TikTok-style scrollable feed of narrated micro-lessons and quizzes.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen font-sans">
        {children}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlowFixer — Workflow analysis & fixes',
  description: 'Paste your workflow or config and get a clear diagnosis and step-by-step fixes.',
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

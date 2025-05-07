import type { Metadata } from 'next'
import '../src/modules/core/styles/globals.css'

export const metadata: Metadata = {
  title: 'PayBanana',
  description: 'Global payments simplified',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

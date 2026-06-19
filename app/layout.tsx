import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1A4731' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1917' },
  ],
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Garage League',
  description: 'Track your friend group\'s game results',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-bg min-h-screen`}>
        {children}
      </body>
    </html>
  )
}

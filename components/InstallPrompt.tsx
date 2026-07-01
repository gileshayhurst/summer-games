'use client'
import { useState, useEffect } from 'react'

type Platform = 'ios' | 'android' | null

export default function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('install-dismissed')) return

    const ua = navigator.userAgent
    const isIOS = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream
    const isAndroid = /android/i.test(ua)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true

    if (isStandalone) return
    if (isIOS) { setPlatform('ios'); setShow(true) }
    else if (isAndroid) { setPlatform('android'); setShow(true) }
  }, [])

  const dismiss = () => {
    localStorage.setItem('install-dismissed', '1')
    setShow(false)
  }

  if (!show || !platform) return null

  return (
    <div className="bg-amber-50 border border-warm rounded-xl p-4 mb-6 flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-black text-stone-900 mb-1">Add to Home Screen</p>
        {platform === 'ios' ? (
          <p className="text-xs text-muted">
            Tap the <span className="font-bold">Share</span> button{' '}
            <span className="not-italic">⎋</span> at the bottom of Safari, then{' '}
            <span className="font-bold">Add to Home Screen</span>.
          </p>
        ) : (
          <p className="text-xs text-muted">
            Tap <span className="font-bold">⋮</span> in your browser, then{' '}
            <span className="font-bold">Add to Home Screen</span>.
          </p>
        )}
      </div>
      <button
        onClick={dismiss}
        className="text-muted text-xl leading-none shrink-0 hover:text-stone-900"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

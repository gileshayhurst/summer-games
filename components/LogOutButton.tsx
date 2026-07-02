'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

export default function LogOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const logOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/signin')
  }

  return (
    <button
      onClick={logOut}
      disabled={loading}
      className="text-xs font-black px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-50 uppercase tracking-wide transition-colors shrink-0"
    >
      {loading ? 'Logging Out…' : 'Log Out (not recommended)'}
    </button>
  )
}

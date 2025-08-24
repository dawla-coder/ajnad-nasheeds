"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from './ui/button'
import { Input } from './ui/input'

export default function AuthPanel() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUserEmail(s?.user?.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signInWithEmail = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    setLoading(false)
    if (!error) alert('تم إرسال رابط تسجيل الدخول إلى بريدك')
  }

  if (userEmail) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="opacity-80">{userEmail}</span>
        <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>تسجيل الخروج</Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input placeholder="بريد إلكتروني" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-48" />
      <Button size="sm" onClick={signInWithEmail} disabled={loading}>تسجيل الدخول</Button>
      <Button size="sm" variant="ghost" onClick={()=>supabase.auth.signInWithOAuth({ provider: 'google' })}>Google</Button>
    </div>
  )
}

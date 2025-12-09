import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { baseUrl } from '@/lib/environment'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/speaker-list'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      console.log(`✅ Supabase auth successful`)
      // ✅ STAY ON SAME ORIGIN (test environment)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  console.error('❌ Auth failed')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
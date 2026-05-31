import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    if (session) {
      // Verificar si ya completó el onboarding
      const { data: perfil } = await supabase
        .from('profiles')
        .select('onboarding_completo, telefono, latitud')
        .eq('id', session.user.id)
        .single()

      // Si no tiene perfil completo → onboarding
      if (!perfil || !perfil.onboarding_completo || !perfil.telefono || !perfil.latitud) {
        return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
      }
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/album`)
}
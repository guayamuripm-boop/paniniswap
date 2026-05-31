'use client'
import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Check() {
  const router = useRouter()

  useEffect(() => {
    const verificar = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/')
        return
      }

      // Asegurar que el perfil exista
      const { data: perfil } = await supabase
        .from('profiles')
        .select('onboarding_completo, telefono, latitud')
        .eq('id', session.user.id)
        .single()

      if (!perfil) {
        // Crear perfil básico si no existe
        await supabase.from('profiles').insert({
          id: session.user.id,
          full_name: session.user.user_metadata?.full_name,
          avatar_url: session.user.user_metadata?.avatar_url,
          onboarding_completo: false,
        })
        router.push('/onboarding')
        return
      }

      // Si le falta teléfono o ubicación → onboarding
      if (!perfil.onboarding_completo || !perfil.telefono || !perfil.latitud) {
        router.push('/onboarding')
        return
      }

      router.push('/album')
    }

    verificar()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16
    }}>
      <span style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 28,
        fontWeight: 800
      }}>
        <span style={{
          background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>Meta</span>
        <span style={{ color: 'white' }}>Xport</span>
      </span>
      <div style={{ color: 'var(--text2)', fontSize: 13 }}>
        Cargando...
      </div>
    </div>
  )
}
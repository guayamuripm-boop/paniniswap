'use client'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { pedirPermiso, suscribirPush, notificarNuevoMensaje } from '../lib/notifications'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  useEffect(() => {
    const ch = supabase.channel('notifications-global')
    ch.on('broadcast', { event: 'push' }, (payload) => {
      if (payload?.data?.type === 'nuevo-mensaje') {
        notificarNuevoMensaje(payload.data.remitente, payload.data.contenido)
      }
    }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  return null
}

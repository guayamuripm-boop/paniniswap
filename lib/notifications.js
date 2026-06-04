import { supabase } from './supabase'

export async function pedirPermiso() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const result = await Notification.requestPermission()
  return result === 'granted' ? 'granted' : 'denied'
}

export function mostrarNotificacion(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible' && !options.force) return
  try {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
        ...options,
      })
    })
  } catch {
    new Notification(title, { icon: '/icon-192.png', ...options })
  }
}

export async function suscribirPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
  try {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (sub) return sub
    const res = await fetch('/api/push/vapid-public-key')
    const { key } = await res.json()
    if (!key) return null
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    })
    return sub
  } catch { return null }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = typeof window !== 'undefined' ? window.atob(base64) : atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

export async function guardarSubscripcion(sub) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  try {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    })
    return res.ok
  } catch { return false }
}

export async function eliminarSubscripcion() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  const sub = await navigator.serviceWorker.ready.then(r => r.pushManager.getSubscription())
  if (sub) await sub.unsubscribe()
  try {
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })
    return true
  } catch { return false }
}

export async function activarNotificaciones() {
  const permiso = await pedirPermiso()
  if (permiso !== 'granted') return permiso
  const sub = await suscribirPush()
  if (sub) await guardarSubscripcion(sub)
  return 'granted'
}

export async function desactivarNotificaciones() {
  await eliminarSubscripcion()
}

export function notificarNuevoMensaje(remitente, contenido) {
  mostrarNotificacion(`📩 ${remitente} te envió un mensaje`, {
    body: contenido.length > 100 ? contenido.slice(0, 100) + '…' : contenido,
    tag: 'nuevo-mensaje',
    data: { url: '/chat' },
  })
}

export function notificarNuevoMatch(nombre, score) {
  mostrarNotificacion(`🤝 Nuevo match con ${nombre}`, {
    body: `${score} figurita${score !== 1 ? 's' : ''} para intercambiar`,
    tag: 'nuevo-match',
    data: { url: '/intercambios' },
  })
}

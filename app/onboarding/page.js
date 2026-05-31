'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
  const [user, setUser] = useState(null)
  const [paso, setPaso] = useState(1)
  const [form, setForm] = useState({ full_name: '', telefono: '' })
  const [ubicacion, setUbicacion] = useState(null)
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorGeo, setErrorGeo] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      setForm(f => ({
        ...f,
        full_name: session.user.user_metadata?.full_name || ''
      }))
    })
  }, [])

  const pedirUbicacion = () => {
    setLoadingGeo(true)
    setErrorGeo(false)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        // Reverse geocoding con API gratuita
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        )
        const data = await res.json()
        const ciudad = data.address?.city || data.address?.town || data.address?.village || data.address?.county || ''
        const pais = data.address?.country || ''
        setUbicacion({ latitude, longitude, ciudad, pais })
        setLoadingGeo(false)
      },
      () => {
        setErrorGeo(true)
        setLoadingGeo(false)
      },
      { timeout: 10000 }
    )
  }

  const guardar = async () => {
    if (!form.full_name || !form.telefono || !ubicacion) return
    setGuardando(true)

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: form.full_name,
      telefono: form.telefono.replace(/\D/g, ''),
      ciudad: ubicacion.ciudad,
      pais: ubicacion.pais,
      latitud: ubicacion.latitude,
      longitud: ubicacion.longitude,
      avatar_url: user.user_metadata?.avatar_url,
      onboarding_completo: true,
    })

    if (!error) router.push('/album')
    else setGuardando(false)
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>

      {/* Orbs */}
      <div style={{ position: 'fixed', top: '-100px', left: '-100px', width: 400, height: 400, borderRadius: '50%', background: 'rgba(14,165,233,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-100px', right: '-100px', width: 350, height: 350, borderRadius: '50%', background: 'rgba(29,78,216,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 10 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800 }}>
            <span style={{ background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Meta</span>
            <span style={{ color: 'white' }}>Xport</span>
          </span>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '32px 28px' }}>

          {/* Pasos */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{
                flex: 1, height: 3, borderRadius: 99,
                background: n <= paso ? 'linear-gradient(90deg,#0EA5E9,#1D4ED8)' : 'rgba(255,255,255,0.08)',
                transition: 'all 0.3s'
              }} />
            ))}
          </div>

          {/* PASO 1 — Nombre */}
          {paso === 1 && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne', marginBottom: 8 }}>
                ¡Hola, {user?.user_metadata?.full_name?.split(' ')[0]}! 👋
              </div>
              <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Antes de entrar a tu álbum, necesitamos un par de datos para que puedas encontrar coleccionistas cerca de ti.
              </p>

              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
                ¿Cómo te llamamos?
              </label>
              <input
                className="input-field"
                placeholder="Tu nombre"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                style={{ marginBottom: 24 }}
              />

              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '13px', fontSize: 15 }}
                disabled={!form.full_name}
                onClick={() => setPaso(2)}>
                Continuar →
              </button>
            </div>
          )}

          {/* PASO 2 — Teléfono */}
          {paso === 2 && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne', marginBottom: 8 }}>
                Tu WhatsApp 📱
              </div>
              <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Lo usamos para que otros coleccionistas puedan contactarte directamente cuando haya un match. <strong style={{ color: 'var(--text)' }}>No lo compartimos con nadie más.</strong>
              </p>

              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
                Número con código de país
              </label>
              <input
                className="input-field"
                placeholder="584121234567"
                type="tel"
                value={form.telefono}
                onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                style={{ marginBottom: 8 }}
              />
              <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 24 }}>
                Ejemplo Venezuela: 584121234567 · Colombia: 573001234567 · México: 521234567890
              </p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ padding: '13px 20px' }} onClick={() => setPaso(1)}>
                  ← Atrás
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '13px', fontSize: 15 }}
                  disabled={form.telefono.replace(/\D/g, '').length < 10}
                  onClick={() => setPaso(3)}>
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* PASO 3 — Ubicación */}
          {paso === 3 && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne', marginBottom: 8 }}>
                ¿Dónde estás? 📍
              </div>
              <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Usamos tu ubicación para mostrarte primero los coleccionistas más cercanos a ti. <strong style={{ color: 'var(--text)' }}>Solo guardamos tu ciudad, no tu dirección exacta.</strong>
              </p>

              {!ubicacion ? (
                <>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: 15, marginBottom: 12 }}
                    onClick={pedirUbicacion}
                    disabled={loadingGeo}>
                    {loadingGeo ? '📡 Detectando...' : '📍 Detectar mi ubicación'}
                  </button>

                  {errorGeo && (
                    <div style={{
                      padding: '12px 16px', borderRadius: 12, marginBottom: 12,
                      background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
                      color: '#EF4444', fontSize: 13
                    }}>
                      No pudimos acceder a tu ubicación. Asegúrate de dar permiso cuando el navegador lo solicite.
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost" style={{ padding: '13px 20px' }} onClick={() => setPaso(2)}>
                      ← Atrás
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Confirmación de ubicación */}
                  <div style={{
                    padding: '16px', borderRadius: 16, marginBottom: 20,
                    background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>✅</span>
                      <div>
                        <div style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>
                          {ubicacion.ciudad}
                        </div>
                        <div style={{ color: 'var(--text2)', fontSize: 13 }}>
                          {ubicacion.pais}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: 15, marginBottom: 10 }}
                    onClick={guardar}
                    disabled={guardando}>
                    {guardando ? 'Entrando al álbum...' : '⚽ Entrar a MetaXport'}
                  </button>

                  <button
                    className="btn btn-ghost"
                    style={{ width: '100%', padding: '11px', fontSize: 13 }}
                    onClick={() => { setUbicacion(null); setErrorGeo(false) }}>
                    Detectar de nuevo
                  </button>
                </>
              )}
            </div>
          )}

        </div>

        {/* Skip — solo en desarrollo */}
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text3)' }}>
          Al continuar aceptas los términos de uso de MetaXport
        </p>

      </div>
    </main>
  )
}
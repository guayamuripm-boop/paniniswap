'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import Navbar from '../../components/Navbar'
import { Clock, User as UserIcon, Trophy } from 'lucide-react'

export default function Feed() {
  const [user, setUser] = useState(null)
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      await cargar(session.user.id)
      setLoading(false)
    })
  }, [])

  const cargar = async (uid) => {
    const [{ data: recientes }, { data: perfiles }, { data: stk }] = await Promise.all([
      supabase.from('user_stickers')
        .select('sticker_id,quantity,created_at,user_id')
        .order('created_at', { ascending: false }).limit(50),
      supabase.from('profiles').select('id,full_name,avatar_url'),
      supabase.from('stickers').select('id,jugador,seccion'),
    ])
    const perfilMap = {}
    if (perfiles) perfiles.forEach(p => perfilMap[p.id] = p)
    const stkMap = {}
    if (stk) stk.forEach(s => stkMap[s.id] = s)
    const evs = (recientes || [])
      .filter(e => e.user_id !== uid)
      .map(e => {
        const p = perfilMap[e.user_id]
        const s = stkMap[e.sticker_id]
        const label = e.quantity >= 2 ? 'marcó como repetida' : 'marcó como "Tengo"'
        return {
          ...e,
          nombre: p?.full_name || 'Alguien',
          avatar: p?.avatar_url,
          jugador: s?.jugador || 'Figurita',
          label,
          time: e.created_at,
        }
      })
      .slice(0, 30)
    setEventos(evs)
  }

  const formatTime = (t) => {
    const d = new Date(t)
    const diff = Date.now() - d
    if (diff < 60000) return 'Ahora'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <nav style={{ padding: '12px 16px' }}><div className="skel" style={{ width: 120, height: 24 }} /></nav>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
        <div className="skel" style={{ width: 120, height: 26, marginBottom: 20 }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="skel skel-avatar" />
            <div style={{ flex: 1 }}><div className="skel" style={{ height: 14, marginBottom: 6 }} /><div className="skel" style={{ width: '40%', height: 12 }} /></div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <Navbar />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          <span style={{ background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Actividad</span> reciente
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>Lo que otros coleccionistas están marcando</p>

        {eventos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
            <Clock size={40} strokeWidth={1.5} style={{ marginBottom: 12, display: 'inline-block' }} />
            <p style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>Sin actividad aún</p>
            <p style={{ fontSize: 14 }}>Cuando otros coleccionistas marquen figuritas, aparecerán aquí</p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 22, top: 0, bottom: 0, width: 2, background: 'rgba(14,165,233,0.15)', borderRadius: 99 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {eventos.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0' }}>
                  <div style={{ flexShrink: 0, position: 'relative', zIndex: 2 }}>
                    {e.avatar ? (
                      <img src={e.avatar} style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid rgba(14,165,233,0.3)' }} alt="" />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white' }}>
                        {e.nombre[0]}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
                      <strong style={{ fontWeight: 700 }}>{e.nombre}</strong>{' '}
                      <span style={{ color: 'var(--text2)' }}>{e.label}</span>{' '}
                      <strong style={{ color: '#0EA5E9' }}>{e.jugador}</strong>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{formatTime(e.time)}</div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0, paddingTop: 6 }}>{formatTime(e.time)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav active="/feed" />
    </main>
  )
}

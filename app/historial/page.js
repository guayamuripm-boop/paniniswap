'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import Navbar from '../../components/Navbar'
import { MessageCircle, ArrowLeftRight, CheckCircle, Clock, User } from 'lucide-react'

export default function Historial() {
  const [user, setUser] = useState(null)
  const [conversaciones, setConversaciones] = useState([])
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
    const [{ data: msgs }, { data: perfiles }] = await Promise.all([
      supabase.from('messages')
        .select('*')
        .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
        .order('created_at', { ascending: false }).limit(500),
      supabase.from('profiles').select('id,full_name,avatar_url'),
    ])
    const perfilMap = {}
    if (perfiles) perfiles.forEach(p => perfilMap[p.id] = p)

    const chats = {}
    if (msgs) msgs.forEach(m => {
      const otherId = m.sender_id === uid ? m.receiver_id : m.sender_id
      if (!chats[otherId]) chats[otherId] = { msgs: [], ultimo: null }
      chats[otherId].msgs.push(m)
      if (!chats[otherId].ultimo || new Date(m.created_at) > new Date(chats[otherId].ultimo.created_at)) {
        chats[otherId].ultimo = m
      }
    })

    const list = Object.entries(chats)
      .map(([id, ch]) => ({
        id,
        ...perfilMap[id],
        ultimoMensaje: ch.ultimo?.content || '',
        ultimaFecha: ch.ultimo?.created_at,
        total: ch.msgs.length,
        noLeidos: ch.msgs.filter(m => m.receiver_id === uid && !m.read).length,
      }))
      .filter(c => c.full_name)
      .sort((a, b) => new Date(b.ultimaFecha) - new Date(a.ultimaFecha))

    setConversaciones(list)
  }

  const formatTime = (t) => {
    if (!t) return ''
    const d = new Date(t)
    const diff = Date.now() - d
    if (diff < 86400000) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) {
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      return dias[d.getDay()]
    }
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <nav style={{ padding: '12px 16px' }}><div className="skel" style={{ width: 140, height: 24 }} /></nav>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div className="skel skel-avatar" />
            <div style={{ flex: 1 }}><div className="skel" style={{ height: 14, marginBottom: 6 }} /><div className="skel" style={{ width: '50%', height: 12 }} /></div>
            <div className="skel" style={{ width: 30, height: 12 }} />
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
          <span style={{ background: 'linear-gradient(135deg,#7B2FBE,#4361EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intercambios</span> realizados
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>Historial de conversaciones con otros coleccionistas</p>

        {conversaciones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
            <ArrowLeftRight size={40} strokeWidth={1.5} style={{ marginBottom: 12, display: 'inline-block' }} />
            <p style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>Sin intercambios aún</p>
            <p style={{ fontSize: 14 }}Las conversaciones con otros coleccionistas aparecerán aquí</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {conversaciones.map(c => (
              <div key={c.id}
                onClick={() => router.push(`/chat?id=${c.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 14,
                  background: c.noLeidos > 0 ? 'rgba(14,165,233,0.06)' : 'rgba(255,255,255,0.02)',
                  border: c.noLeidos > 0 ? '1px solid rgba(14,165,233,0.15)' : '1px solid transparent',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                {c.avatar_url ? (
                  <img src={c.avatar_url} style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} alt="" />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#7B2FBE,#4361EE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {(c.full_name || '?')[0]}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.full_name}</span>
                    {c.noLeidos > 0 && (
                      <span style={{ background: '#0EA5E9', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, lineHeight: 1 }}>{c.noLeidos}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.ultimoMensaje || 'Sin mensajes'}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0, textAlign: 'right' }}>
                  {formatTime(c.ultimaFecha)}
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{c.total} msgs</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav active="/historial" />
    </main>
  )
}

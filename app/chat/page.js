'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import Navbar from '../../components/Navbar'
import { MessageSquare, Send, ArrowLeft, User as UserIcon, Phone, MapPin, Mail } from 'lucide-react'

export default function Chat() {
  const [user, setUser] = useState(null)
  const [conversaciones, setConversaciones] = useState([])
  const [mensajes, setMensajes] = useState([])
  const [conversandoCon, setConversandoCon] = useState(null)
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const [perfiles, setPerfiles] = useState({})
  const [enviando, setEnviando] = useState(false)
  const router = useRouter()
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const userParam = params.get('user')
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      try {
        await cargarConversaciones(session.user.id)
        if (userParam && userParam !== session.user.id) {
          await abrirConversacion(userParam)
        }
      } catch (e) {
        console.error('Chat error:', e)
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (conversandoCon) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)
    }
  }, [mensajes, conversandoCon])

  useEffect(() => {
    if (!user || !conversandoCon) return
    const channel = supabase.channel(`chat-${user.id}-${conversandoCon}`)
    channel.on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages',
        filter: `sender_id=in.(${user.id},${conversandoCon})` },
      async (payload) => {
        const m = payload.new
        if ((m.sender_id === user.id && m.receiver_id === conversandoCon) ||
            (m.sender_id === conversandoCon && m.receiver_id === user.id)) {
          setMensajes(prev => {
            if (prev.some(p => p.id === m.id)) return prev
            return [...prev, m].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          })
          await markAsRead(conversandoCon, user.id)
        }
      }
    ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, conversandoCon])

  const cargarPerfil = async (uid) => {
    if (perfiles[uid]) return perfiles[uid]
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (data) { setPerfiles(p => ({ ...p, [uid]: data })); return data }
    return null
  }

  const cargarConversaciones = async (uid) => {
    try {
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
        .order('created_at', { ascending: false })
      if (error) { console.error('Error loading messages:', error); return }
      if (!msgs) return
      const vistos = new Set()
      const convs = []
      for (const m of msgs) {
        const otroId = m.sender_id === uid ? m.receiver_id : m.sender_id
        if (vistos.has(otroId)) continue
        vistos.add(otroId)
        const p = await cargarPerfil(otroId)
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('sender_id', otroId).eq('receiver_id', uid).eq('read', false)
        convs.push({ usuarioId: otroId, ultimo: m, perfil: p, noLeidos: count || 0 })
      }
      setConversaciones(convs)
    } catch (e) { console.error('Error in cargarConversaciones:', e) }
  }

  const abrirConversacion = async (otroId) => {
    setConversandoCon(otroId)
    await cargarMensajes(otroId)
    await markAsRead(otroId, user.id)
    await cargarConversaciones(user.id)
    setTimeout(() => inputRef.current?.focus(), 300)
  }

  const cargarMensajes = async (otroId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otroId}),and(sender_id.eq.${otroId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    setMensajes(data || [])
  }

  const markAsRead = async (de, para) => {
    await supabase.from('messages')
      .update({ read: true })
      .eq('sender_id', de).eq('receiver_id', para).eq('read', false)
  }

  const enviar = async () => {
    if (!texto.trim() || enviando) return
    setEnviando(true)
    const content = texto.trim()
    setTexto('')
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id, receiver_id: conversandoCon, content
    })
    if (!error) {
      setMensajes(prev => [...prev, {
        id: Math.random().toString(), sender_id: user.id, receiver_id: conversandoCon,
        content, created_at: new Date().toISOString(), read: false
      }])
      await cargarConversaciones(user.id)
    }
    setEnviando(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  const volver = () => {
    setConversandoCon(null)
    setMensajes([])
  }

  const formatTime = (t) => {
    const d = new Date(t)
    const hoy = new Date()
    const diff = hoy - d
    if (diff < 86400000) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    if (diff < 172800000) return 'Ayer'
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text2)', fontSize: 14 }}>Cargando mensajes...</div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <Navbar />

      {conversandoCon ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={volver}
              style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <ArrowLeft size={20} />
            </button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {perfiles[conversandoCon]?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{perfiles[conversandoCon]?.full_name || 'Usuario'}</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mensajes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)', fontSize: 13 }}>
                No hay mensajes aún. ¡Envía el primero!
              </div>
            )}
            {mensajes.map(m => {
              const propio = m.sender_id === user.id
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: propio ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '10px 14px', borderRadius: 16,
                    background: propio ? 'linear-gradient(135deg,#0EA5E9,#1D4ED8)' : 'rgba(255,255,255,0.06)',
                    color: propio ? 'white' : 'var(--text1)',
                    fontSize: 14, lineHeight: 1.4, wordBreak: 'break-word',
                    borderBottomRightRadius: propio ? 4 : 16,
                    borderBottomLeftRadius: propio ? 16 : 4,
                  }}>
                    <div>{m.content}</div>
                    <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>
                      {formatTime(m.created_at)}
                      {propio && (m.read ? ' ✓✓' : ' ✓')}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, background: 'var(--bg)' }}>
            <input ref={inputRef} value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={handleKey}
              placeholder="Escribe un mensaje..."
              style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: 14, outline: 'none' }} />
            <button onClick={enviar} disabled={!texto.trim() || enviando}
              style={{ width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', background: texto.trim() ? 'linear-gradient(135deg,#0EA5E9,#1D4ED8)' : 'rgba(255,255,255,0.06)', color: texto.trim() ? 'white' : 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
              <span style={{ background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Mensajes</span>
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 13 }}>Chateá con otros coleccionistas</p>
          </div>

          {conversaciones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <MessageSquare size={48} strokeWidth={1.5} color="var(--text3)" style={{ marginBottom: 16, display: 'inline-block' }} />
              <p style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>Sin conversaciones</p>
              <p style={{ color: 'var(--text3)', fontSize: 14 }}>Cuando intercambiés con alguien, podés escribirle desde acá</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {conversaciones.map(c => {
                const p = c.perfil
                return (
                  <button key={c.usuarioId} onClick={() => abrirConversacion(c.usuarioId)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {p?.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{p?.full_name || 'Usuario'}</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{c.ultimo ? formatTime(c.ultimo.created_at) : ''}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                          {c.ultimo?.sender_id === user.id ? 'Tú: ' : ''}{c.ultimo?.content || ''}
                        </span>
                        {c.noLeidos > 0 && (
                          <span style={{ background: '#0EA5E9', color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, minWidth: 18, textAlign: 'center' }}>
                            {c.noLeidos}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <div style={{ marginTop: 24, padding: 20, borderRadius: 16, background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.15)', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#0EA5E9', fontWeight: 600, marginBottom: 12 }}>
              Para chatear con alguien, andá a Intercambios y contactá a un coleccionista
            </p>
            <button onClick={() => router.push('/intercambios')}
              style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid rgba(14,165,233,0.2)', background: 'transparent', color: '#0EA5E9', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Ir a Intercambios
            </button>
          </div>
        </div>
      )}

      <BottomNav active="/chat" />
    </main>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import Navbar from '../../components/Navbar'
import { Trophy, Medal, Award, ArrowUp, ArrowDown, Minus, Hash } from 'lucide-react'

const MEDALS = [
  { color: '#FFD700', bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.3)', label: 'Oro' },
  { color: '#C0C0C0', bg: 'rgba(192,192,192,0.12)', border: 'rgba(192,192,192,0.3)', label: 'Plata' },
  { color: '#CD7F32', bg: 'rgba(205,127,50,0.12)', border: 'rgba(205,127,50,0.3)', label: 'Bronce' },
]

export default function Ranking() {
  const [user, setUser] = useState(null)
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('tengo')
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
    const [{ data: stickers }, { data: perfiles }] = await Promise.all([
      supabase.from('user_stickers').select('user_id,sticker_id,quantity'),
      supabase.from('profiles').select('id,full_name,avatar_url'),
    ])
    const perfilMap = {}
    if (perfiles) perfiles.forEach(p => perfilMap[p.id] = p)

    const stats = {}
    if (stickers) stickers.forEach(s => {
      if (!stats[s.user_id]) stats[s.user_id] = { tengo: 0, repito: 0, total: 0 }
      stats[s.user_id].total = (stats[s.user_id].total || 0) + 1
      if (s.quantity >= 2) stats[s.user_id].repito = (stats[s.user_id].repito || 0) + s.quantity
      stats[s.user_id].tengo = (stats[s.user_id].tengo || 0) + 1
    })

    const ranked = Object.entries(stats).map(([id, s]) => ({
      id,
      ...perfilMap[id],
      ...s,
      completado: s.tengo >= 993 ? 100 : Math.round((s.tengo / 993) * 100),
    })).filter(u => u.full_name).sort((a, b) => (b[tab] || 0) - (a[tab] || 0))

    const withPos = ranked.map((u, i) => ({ ...u, pos: i + 1 }))
    setRanking(withPos)
  }

  const getPosIcon = (pos) => {
    if (pos === 1) return <Trophy size={18} color="#FFD700" fill="#FFD700" />
    if (pos === 2) return <Medal size={18} color="#C0C0C0" fill="#C0C0C0" />
    if (pos === 3) return <Award size={18} color="#CD7F32" fill="#CD7F32" />
    return <span style={{ minWidth: 20, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text3)' }}>{pos}</span>
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <nav style={{ padding: '12px 16px' }}><div className="skel" style={{ width: 120, height: 24 }} /></nav>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            <div className="skel" style={{ width: 24, height: 18 }} />
            <div className="skel skel-avatar" />
            <div style={{ flex: 1 }}><div className="skel" style={{ height: 14, width: '50%', marginBottom: 6 }} /><div className="skel" style={{ height: 10, width: '30%' }} /></div>
            <div className="skel" style={{ width: 40, height: 18 }} />
          </div>
        ))}
      </div>
    </div>
  )

  const tabs = [
    { key: 'tengo', label: 'Colección' },
    { key: 'repito', label: 'Repetidas' },
    { key: 'completado', label: '% Álbum' },
  ]

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <Navbar />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          <span style={{ background: 'linear-gradient(135deg,#F5C518,#F47B20)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Ranking</span> de coleccionistas
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>Los mejores completando el álbum</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflow: 'auto', paddingBottom: 4 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`btn ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {ranking.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
            <Trophy size={40} strokeWidth={1.5} style={{ marginBottom: 12, display: 'inline-block' }} />
            <p style={{ color: 'var(--text2)', fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Sin datos</p>
            <p style={{ fontSize: 14 }}Cuando otros coleccionistas se registren y marquen figuritas, aparecerán aquí</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ranking.map((u) => {
              const isMe = user && u.id === user.id
              const medal = u.pos <= 3 ? MEDALS[u.pos - 1] : null
              return (
                <div key={u.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: isMe ? 'rgba(14,165,233,0.06)' : 'rgba(255,255,255,0.02)',
                    border: isMe ? '1px solid rgba(14,165,233,0.15)' : '1px solid transparent',
                    transition: 'all 0.2s',
                  }}>
                  <div style={{ width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                    {getPosIcon(u.pos)}
                  </div>
                  {u.avatar_url ? (
                    <img src={u.avatar_url} style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} alt="" />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {(u.full_name || '?')[0]}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.full_name}
                      {isMe && <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, marginLeft: 6 }}>(tú)</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      <Hash size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
                      {u.tengo} únicas · {u.repito} repetidas · {u.completado}%
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: medal?.color || 'var(--text2)', textAlign: 'right', minWidth: 50 }}>
                    {tab === 'completado' ? `${u.completado}%` : u[tab] || 0}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav active="/ranking" />
    </main>
  )
}

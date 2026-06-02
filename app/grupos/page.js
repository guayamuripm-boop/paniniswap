'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import Navbar from '../../components/Navbar'
import { Users, Plus, LogIn, Copy, Check, ExternalLink, UserPlus } from 'lucide-react'

export default function Grupos() {
  const [user, setUser] = useState(null)
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [creando, setCreando] = useState(false)
  const [unirse, setUnirse] = useState(false)
  const [nombre, setNombre] = useState('')
  const [desc, setDesc] = useState('')
  const [codigo, setCodigo] = useState('')
  const [msg, setMsg] = useState('')
  const [copiado, setCopiado] = useState(null)
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
    const { data: mids } = await supabase
      .from('group_members').select('group_id').eq('user_id', uid)
    if (!mids || mids.length === 0) { setGrupos([]); return }
    const ids = mids.map(m => m.group_id)
    const { data: gs } = await supabase
      .from('groups').select('*').in('id', ids).order('created_at', { ascending: false })
    const { data: counts } = await supabase
      .from('group_members').select('group_id').in('group_id', ids)
    const countMap = {}
    if (counts) counts.forEach(c => { countMap[c.group_id] = (countMap[c.group_id] || 0) + 1 })
    setGrupos((gs || []).map(g => ({ ...g, miembros: countMap[g.id] || 1 })))
  }

  const crear = async () => {
    if (!nombre.trim()) return
    setMsg('')
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { error } = await supabase.from('groups').insert({
      name: nombre.trim(), description: desc.trim(), created_by: user.id, code
    })
    if (error) { setMsg('Error al crear grupo'); return }
    const { data: g } = await supabase.from('groups').select('id').eq('code', code).single()
    if (g) {
      await supabase.from('group_members').insert({ group_id: g.id, user_id: user.id, role: 'admin' })
    }
    setNombre(''); setDesc(''); setCreando(false)
    await cargar(user.id)
  }

  const unir = async () => {
    if (!codigo.trim()) return
    setMsg('')
    const c = codigo.trim().toUpperCase()
    const { data: g } = await supabase.from('groups').select('id').eq('code', c).single()
    if (!g) { setMsg('Código inválido'); return }
    const { error } = await supabase.from('group_members').insert({ group_id: g.id, user_id: user.id })
    if (error?.message?.includes('already')) { setMsg('Ya estás en este grupo'); return }
    if (error) { setMsg('Error al unirse'); return }
    setCodigo(''); setUnirse(false)
    await cargar(user.id)
  }

  const copiar = (code) => {
    navigator.clipboard.writeText(code)
    setCopiado(code)
    setTimeout(() => setCopiado(null), 2000)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text2)', fontSize: 14 }}>Cargando grupos...</div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <Navbar />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
              Mis <span style={{ background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Grupos</span>
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 13 }}>Intercambios privados con amigos y familia</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setUnirse(!unirse); setCreando(false) }}
              style={{ padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <LogIn size={16} /> <span style={{ fontSize: 12, fontWeight: 600 }}>Unirse</span>
            </button>
            <button onClick={() => { setCreando(!creando); setUnirse(false) }}
              style={{ padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={16} /> <span style={{ fontSize: 12, fontWeight: 700 }}>Crear</span>
            </button>
          </div>
        </div>

        {msg && (
          <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 16, background: msg.includes('Error') || msg.includes('inválido') ? 'rgba(232,54,61,0.1)' : 'rgba(59,178,115,0.1)', border: `1px solid ${msg.includes('Error') || msg.includes('inválido') ? 'rgba(232,54,61,0.25)' : 'rgba(59,178,115,0.25)'}`, color: msg.includes('Error') || msg.includes('inválido') ? '#E8363D' : '#3BB273' }}>
            {msg}
          </div>
        )}

        {creando && (
          <div style={{ marginBottom: 16, padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Crear grupo</h3>
            <input className="input-field" placeholder="Nombre del grupo" value={nombre} onChange={e => setNombre(e.target.value)} style={{ marginBottom: 10 }} />
            <input className="input-field" placeholder="Descripción (opcional)" value={desc} onChange={e => setDesc(e.target.value)} style={{ marginBottom: 12 }} />
            <button onClick={crear} disabled={!nombre.trim()}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', color: 'white', fontWeight: 700, fontSize: 14, opacity: nombre.trim() ? 1 : 0.5 }}>
              Crear grupo →
            </button>
          </div>
        )}

        {unirse && (
          <div style={{ marginBottom: 16, padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Unirse a un grupo</h3>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>Pide el código a quien creó el grupo</p>
            <input className="input-field" placeholder="Ej: AB12CD" value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} style={{ marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
            <button onClick={unir} disabled={!codigo.trim()}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#3BB273,#2D8A59)', color: 'white', fontWeight: 700, fontSize: 14, opacity: codigo.trim() ? 1 : 0.5 }}>
              Unirse →
            </button>
          </div>
        )}

        {grupos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Users size={48} strokeWidth={1.5} color="var(--text3)" style={{ marginBottom: 16, display: 'inline-block' }} />
            <p style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>Sin grupos todavía</p>
            <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 24 }}>Crea un grupo con tu colegio, trabajo o familia para intercambiar solo entre ustedes</p>
            <button onClick={() => setCreando(true)}
              style={{ padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', color: 'white', fontWeight: 700, fontSize: 14 }}>
              Crear primer grupo
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {grupos.map(g => (
              <div key={g.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>{g.name}</div>
                    {g.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{g.description}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text3)', fontSize: 12, flexShrink: 0 }}>
                    <Users size={14} /> {g.miembros}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.15em', flex: 1 }}>{g.code}</span>
                  <button onClick={() => copiar(g.code)}
                    style={{ background: 'none', border: 'none', color: copiado === g.code ? '#3BB273' : 'var(--text3)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    {copiado === g.code ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
                  </button>
                </div>
                <button onClick={() => router.push(`/intercambios?grupo=${g.id}`)}
                  style={{ width: '100%', marginTop: 10, padding: '10px', borderRadius: 10, border: '1px solid rgba(14,165,233,0.2)', background: 'rgba(14,165,233,0.05)', color: '#0EA5E9', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <ExternalLink size={14} /> Ver matches del grupo
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="/grupos" />
    </main>
  )
}

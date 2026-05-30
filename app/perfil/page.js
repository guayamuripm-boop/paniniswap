'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Perfil() {
  const [user, setUser]       = useState(null)
  const [perfil, setPerfil]   = useState({ full_name: '', ciudad: '', telefono: '' })
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [stats, setStats]     = useState({ tengo: 0, repito: 0, mefaltan: 0 })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      await cargarPerfil(session.user)
      await cargarStats(session.user.id)
      setLoading(false)
    })
  }, [])

  const cargarPerfil = async (user) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
        setPerfil({
            full_name: data.full_name || user.user_metadata?.full_name || '',
            ciudad: data.ciudad || '',
            telefono: data.telefono || ''
          })
    }
  }

  const cargarStats = async (userId) => {
    const { data: todos } = await supabase.from('stickers').select('id')
    const { data: mios }  = await supabase
      .from('user_stickers').select('quantity').eq('user_id', userId)

    const tengo  = mios?.filter(s => s.quantity >= 1).length || 0
    const repito = mios?.filter(s => s.quantity >= 2).length || 0
    setStats({ tengo, repito, mefaltan: (todos?.length || 0) - tengo })
  }

  const guardarPerfil = async () => {
    setGuardando(true)
    setMensaje('')
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: perfil.full_name, ciudad: perfil.ciudad, telefono: perfil.telefono })
      .eq('id', user.id)

    if (error) {
      setMensaje('Error al guardar. Intenta de nuevo.')
    } else {
      setMensaje('¡Perfil guardado!')
      setTimeout(() => setMensaje(''), 3000)
    }
    setGuardando(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center">
      <p className="text-white text-2xl animate-pulse">Cargando perfil...</p>
    </div>
  )

  return (
    <main className="min-h-screen" style={{background:'var(--dark)'}}>
      <nav className="navbar sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <span className="font-display text-xl font-black tracking-wider" style={{color:'var(--gold)'}}>
          META<span style={{color:'var(--text)'}}>XPORT</span>
        </span>
        <div className="flex gap-2">
          <button onClick={() => router.push('/album')} className="btn-ghost px-3 py-2 text-xs">📒 Mi Álbum</button>
          <button onClick={() => router.push('/intercambios')} className="btn-ghost px-3 py-2 text-xs">🔄 Intercambios</button>
          <button onClick={handleLogout} className="btn-ghost px-3 py-2 text-xs">Salir</button>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-10">

        <div className="text-center mb-8">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url}
              className="w-24 h-24 rounded-full mx-auto mb-4 ring-2"
              style={{ringColor:'var(--gold)'}} alt="" />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center font-display text-4xl font-black"
              style={{background:'var(--dark-3)', color:'var(--gold)', border:'2px solid rgba(245,197,24,0.3)'}}>
              {perfil.full_name?.[0] || '?'}
            </div>
          )}
          <h1 className="font-display text-2xl font-black" style={{color:'var(--text)'}}>{perfil.full_name}</h1>
          <p className="text-sm" style={{color:'var(--text-dim)'}}>{user?.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {n: stats.tengo, label:'Tengo', color:'var(--cyan)'},
            {n: stats.mefaltan, label:'Faltan', color:'var(--red)'},
            {n: stats.repito, label:'Repito', color:'var(--green)'},
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <div className="font-display text-2xl font-black" style={{color:s.color}}>{s.n}</div>
              <div className="text-xs uppercase tracking-wider mt-1" style={{color:'var(--text-dim)'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Formulario */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-black tracking-wide mb-5" style={{color:'var(--text)'}}>
            EDITAR PERFIL
          </h2>

          {[
            {key:'full_name', label:'Nombre', placeholder:'Tu nombre', type:'text'},
            {key:'ciudad', label:'Ciudad 📍', placeholder:'Ej: Caracas, Bogotá...', type:'text'},
            {key:'telefono', label:'WhatsApp 📱', placeholder:'584121234567 (sin + ni espacios)', type:'tel'},
          ].map(field => (
            <div key={field.key} className="mb-4">
              <label className="text-xs font-bold uppercase tracking-widest block mb-2"
                style={{color:'var(--text-dim)'}}>
                {field.label}
              </label>
              <input type={field.type}
                value={perfil[field.key]}
                onChange={e => setPerfil(p => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  background:'var(--dark-2)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  color:'var(--text)',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(245,197,24,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
          ))}

          {mensaje && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm font-bold text-center"
              style={{
                background: mensaje.includes('Error') ? 'rgba(255,59,92,0.1)' : 'rgba(0,255,136,0.1)',
                border: `1px solid ${mensaje.includes('Error') ? 'rgba(255,59,92,0.3)' : 'rgba(0,255,136,0.3)'}`,
                color: mensaje.includes('Error') ? 'var(--red)' : 'var(--green)',
              }}>
              {mensaje}
            </div>
          )}

          <button onClick={guardarPerfil} disabled={guardando}
            className="btn-primary w-full py-3 text-sm">
            {guardando ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        </div>
      </div>
    </main>
  )
}
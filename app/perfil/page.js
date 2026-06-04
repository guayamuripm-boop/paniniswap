'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import Navbar from '../../components/Navbar'
import { User, MapPin, Phone, Save, Award, Star, Sparkles, Repeat2, Map, CheckCircle, Zap, Shield, Bell, BellOff } from 'lucide-react'
import { activarNotificaciones, desactivarNotificaciones } from '../../lib/notifications'

export default function Perfil() {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState({ full_name: '', ciudad: '', telefono: '' })
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [stats, setStats] = useState({ tengo: 0, repito: 0, mefaltan: 0 })
  const [insignias, setInsignias] = useState([])
  const [loading, setLoading] = useState(true)
  const [notificacionesActivas, setNotificacionesActivas] = useState(false)
  const [cambiandoNotif, setCambiandoNotif] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      const [{ data: p }, { data: todos }, { data: mios }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('stickers').select('id'),
        supabase.from('user_stickers').select('quantity').eq('user_id', session.user.id)
      ])
      if (p) setPerfil({ full_name: p.full_name || '', ciudad: p.ciudad || '', telefono: p.telefono || '' })
      const tengo = mios?.filter(s => s.quantity >= 1).length || 0
      const repito = mios?.filter(s => s.quantity >= 2).length || 0
      setStats({ tengo, repito, mefaltan: (todos?.length || 0) - tengo })
      const badges = []
      const add = (id, label, icon, unlocked, desc) => badges.push({ id, label, icon, unlocked, desc })
      add('primer', 'Primer sticker', '🎯', tengo >= 1, 'Marcaste tu primera figurita')
      add('coleccionista', 'Coleccionista', '📦', tengo >= 50, '50 figuritas marcadas')
      add('dedicacion', 'Dedicación', '💪', tengo >= 100, '100 figuritas marcadas')
      add('completista', 'Completista', '🏆', tengo >= 200, '200 figuritas marcadas')
      add('repetidor', 'Repetidor', '🔄', repito >= 5, '5+ figuritas repetidas')
      add('swapper', 'Swapper', '🤝', repito >= 1, 'Listo para intercambiar')
      add('ubicado', 'Ubicado', '📍', !!p?.ciudad, 'Ciudad registrada')
      add('completo', 'Perfil completo', '✅', !!(p?.ciudad && p?.telefono && p?.full_name), 'Todos tus datos listos')
      if (p?.created_at) {
        const dias = Math.floor((Date.now() - new Date(p.created_at)) / 86400000)
        add('veterano', 'Veterano', '⚡', dias >= 30, `Llevas ${dias} días en MetaXport`)
      }
      setInsignias(badges)
      setNotificacionesActivas(Notification.permission === 'granted')
      setLoading(false)
    })
  }, [])

  const guardar = async () => {
    if (!user) return
    setGuardando(true)
    setMensaje('')
    const { error } = await supabase.from('profiles')
      .update({ full_name: perfil.full_name, ciudad: perfil.ciudad, telefono: perfil.telefono })
      .eq('id', user.id)
    if (error) { setMensaje('Error al guardar.') }
    else { setMensaje('¡Perfil guardado!'); setTimeout(() => setMensaje(''), 3000) }
    setGuardando(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <nav style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="skel" style={{ width: 120, height: 24 }} />
        <div className="skel" style={{ width: 76, height: 38, borderRadius: 10 }} />
      </nav>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="skel" style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 12px' }} />
          <div className="skel" style={{ width: '40%', height: 20, margin: '0 auto 8px' }} />
          <div className="skel" style={{ width: '50%', height: 14, margin: '0 auto' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skel" style={{ height: 64, borderRadius: 14 }} />
          ))}
        </div>
        <div className="skel" style={{ width: '40%', height: 18, marginBottom: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 8, marginBottom: 24 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skel skel-badge" />
          ))}
        </div>
        <div className="skel" style={{ width: '30%', height: 18, marginBottom: 20 }} />
        <div className="skel" style={{ height: 250, borderRadius: 20 }} />
      </div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <Navbar />

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>

        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url}
              style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 12px', display: 'block', border: '2px solid rgba(255,255,255,0.1)' }} alt="" />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 12px',
              background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: 'white'
            }}>{perfil.full_name?.[0] || '?'}</div>
          )}
          <h1 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800 }}>{perfil.full_name}</h1>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{user?.email}</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { n: stats.tengo, label: 'Tengo', color: '#0EA5E9' },
            { n: stats.mefaltan, label: 'Faltan', color: '#E8363D' },
            { n: stats.repito, label: 'Repito', color: '#3BB273' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 8px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: s.color }}>{s.n}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Insignias */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 800, marginBottom: 12, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} color="#F5C518" /> Insignias ({insignias.filter(i => i.unlocked).length}/{insignias.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 8 }}>
            {insignias.map(i => (
              <div key={i.id} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 6px', borderRadius: 12,
                background: i.unlocked ? 'rgba(245,197,36,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${i.unlocked ? 'rgba(245,197,36,0.2)' : 'rgba(255,255,255,0.04)'}`,
                opacity: i.unlocked ? 1 : 0.4, cursor: 'default', transition: 'all 0.2s'
              }} title={i.unlocked ? i.desc : '🔒 Bloqueada'}>
                <span style={{ fontSize: 22 }}>{i.unlocked ? i.icon : '🔒'}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: i.unlocked ? '#F5C518' : 'var(--text3)', textAlign: 'center', lineHeight: 1.2 }}>{i.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 800, marginBottom: 20, color: 'white' }}>Editar perfil</h2>

          {[
            { key: 'full_name', label: 'Nombre', placeholder: 'Tu nombre', type: 'text', icon: User },
            { key: 'ciudad', label: 'Ciudad', placeholder: 'Ej: Caracas, Bogotá...', type: 'text', icon: MapPin },
            { key: 'telefono', label: 'WhatsApp', placeholder: '584121234567', type: 'tel', icon: Phone },
          ].map(({ key, label, placeholder, type, icon: Icon }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Icon size={12} /> {label}
              </label>
              <input type={type} className="input-field"
                value={perfil[key] || ''}
                onChange={e => setPerfil(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder} />
            </div>
          ))}

          {/* Notificaciones */}
          <div style={{ marginBottom: 20, padding: '16px', borderRadius: 14, background: notificacionesActivas ? 'rgba(59,178,115,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${notificacionesActivas ? 'rgba(59,178,115,0.15)' : 'rgba(255,255,255,0.06)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {notificacionesActivas ? <Bell size={18} color="#3BB273" /> : <BellOff size={18} color="var(--text3)" />}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: notificacionesActivas ? '#3BB273' : 'var(--text2)' }}>
                    Notificaciones {notificacionesActivas ? 'activadas' : 'desactivadas'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    {notificacionesActivas ? 'Recibirás alertas de nuevos mensajes y matches' : 'Activalas para no perderte ningún match'}
                  </div>
                </div>
              </div>
              <button onClick={async () => {
                setCambiandoNotif(true)
                if (notificacionesActivas) {
                  await desactivarNotificaciones()
                  setNotificacionesActivas(false)
                } else {
                  const r = await activarNotificaciones()
                  setNotificacionesActivas(r === 'granted')
                }
                setCambiandoNotif(false)
              }} disabled={cambiandoNotif}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap',
                  background: notificacionesActivas ? 'rgba(232,54,61,0.1)' : 'rgba(14,165,233,0.15)',
                  color: notificacionesActivas ? '#E8363D' : '#0EA5E9',
                  border: `1px solid ${notificacionesActivas ? 'rgba(232,54,61,0.2)' : 'rgba(14,165,233,0.25)'}`,
                  opacity: cambiandoNotif ? 0.6 : 1,
                }}>
                {cambiandoNotif ? '...' : notificacionesActivas ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>

          {mensaje && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              textAlign: 'center', marginBottom: 16,
              background: mensaje.includes('Error') ? 'rgba(232,54,61,0.1)' : 'rgba(59,178,115,0.1)',
              border: `1px solid ${mensaje.includes('Error') ? 'rgba(232,54,61,0.25)' : 'rgba(59,178,115,0.25)'}`,
              color: mensaje.includes('Error') ? '#E8363D' : '#3BB273'
            }}>{mensaje}</div>
          )}

          <button onClick={guardar} disabled={guardando}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', color: 'white',
              fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, opacity: guardando ? 0.7 : 1
            }}>
            <Save size={16} />
            {guardando ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </div>
      </div>

      <BottomNav active="/perfil" />
    </main>
  )
}
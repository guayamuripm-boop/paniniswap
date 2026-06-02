'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import Navbar from '../../components/Navbar'
import { MessageCircle, PhoneOff, MapPin } from 'lucide-react'
import { distancia } from '../../lib/distance'

export default function Intercambios() {
  const [user, setUser] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [radio, setRadio] = useState(50)
  const [miUbicacion, setMiUbicacion] = useState(null)
  const [errorGeo, setErrorGeo] = useState(false)
  const [perfilesData, setPerfilesData] = useState([])
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      const { data: perfil } = await supabase.from('profiles')
        .select('latitud,longitud').eq('id', session.user.id).single()
      if (perfil?.latitud && perfil?.longitud) {
        setMiUbicacion({ lat: perfil.latitud, lng: perfil.longitud })
      }
      await calcular(session.user.id)
      setLoading(false)
    })
  }, [])

  const recalcularDistancias = (lat, lng) => {
    setMatches(prev => prev.map(m => {
      const p = perfilesData.find(x => x.id === m.userId)
      let dist = null
      if (p?.latitud && p?.longitud) {
        dist = Math.round(distancia(lat, lng, p.latitud, p.longitud))
      }
      return { ...m, distancia: dist }
    }))
  }

  const pedirUbicacion = () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setMiUbicacion({ lat: latitude, lng: longitude })
        recalcularDistancias(latitude, longitude)
        await supabase.from('profiles')
          .update({ latitud: latitude, longitud: longitude })
          .eq('id', user.id)
        setErrorGeo(false)
      },
      () => setErrorGeo(true),
      { timeout: 10000 }
    )
  }

  const calcular = async (uid) => {
    const [{ data: mis }, { data: todos }, { data: otros }] = await Promise.all([
      supabase.from('user_stickers').select('sticker_id,quantity').eq('user_id', uid),
      supabase.from('stickers').select('id'),
      supabase.from('user_stickers').select('user_id,sticker_id,quantity').neq('user_id', uid)
    ])
    if (!mis || mis.length === 0) return
    const tengo = mis.filter(s => s.quantity >= 1).map(s => s.sticker_id)
    const repito = mis.filter(s => s.quantity >= 2).map(s => s.sticker_id)
    const todosIds = (todos || []).map(s => s.id)
    const faltan = todosIds.filter(id => !tengo.includes(id))
    if (!otros || otros.length === 0) return
    const porUser = {}
    otros.forEach(s => { if (!porUser[s.user_id]) porUser[s.user_id] = []; porUser[s.user_id].push(s) })
    const candidatos = []
    for (const [oId, sus] of Object.entries(porUser)) {
      const elTiene = sus.filter(s => s.quantity >= 1).map(s => s.sticker_id)
      const elRep = sus.filter(s => s.quantity >= 2).map(s => s.sticker_id)
      const elFal = todosIds.filter(id => !elTiene.includes(id))
      const dame = elRep.filter(id => faltan.includes(id))
      const doy = repito.filter(id => elFal.includes(id))
      const score = dame.length + doy.length
      if (score > 0) candidatos.push({ oId, dame, doy, score })
    }
    candidatos.sort((a, b) => b.score - a.score)
    const userIds = candidatos.map(c => c.oId)
    const stickerIds = [...new Set([
      ...candidatos.flatMap(c => c.dame.slice(0, 6)),
      ...candidatos.flatMap(c => c.doy.slice(0, 6))
    ])]
    const [{ data: perfiles }, { data: stkData }] = await Promise.all([
      supabase.from('profiles').select('id,full_name,avatar_url,ciudad,telefono,latitud,longitud').in('id', userIds),
      supabase.from('stickers').select('id,jugador').in('id', stickerIds)
    ])
    const perfilMap = {}
    if (perfiles) { perfiles.forEach(p => { perfilMap[p.id] = p }); setPerfilesData(perfiles) }
    const stkMap = {}
    if (stkData) stkData.forEach(s => { stkMap[s.id] = s })
    const armarMatches = (cands) => cands.map(({ oId, dame, doy, score }) => {
      const p = perfilMap[oId] || {}
      let dist = null
      if (miUbicacion && p.latitud && p.longitud) {
        dist = Math.round(distancia(miUbicacion.lat, miUbicacion.lng, p.latitud, p.longitud))
      }
      return {
        userId: oId, nombre: p.full_name || 'Usuario', avatar: p.avatar_url,
        ciudad: p.ciudad, telefono: p.telefono, score, distancia: dist,
        dame: dame.slice(0, 6).map(id => stkMap[id]).filter(Boolean),
        doy: doy.slice(0, 6).map(id => stkMap[id]).filter(Boolean),
        totalDame: dame.length, totalDoy: doy.length,
      }
    })
    setMatches(armarMatches(candidatos))
  }

  const filtrados = useMemo(() => {
    let lista = matches
    if (miUbicacion) {
      lista = lista.filter(m => m.distancia === null || m.distancia <= radio)
      lista = [...lista].sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score
        if (a.distancia !== null && b.distancia !== null) return a.distancia - b.distancia
        if (a.distancia === null) return 1
        if (b.distancia === null) return -1
        return 0
      })
    }
    return lista
  }, [matches, radio, miUbicacion])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MetaXport</div>
        <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 8 }}>Buscando matches...</div>
      </div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <Navbar />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
            Mis <span style={{ background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intercambios</span>
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>
            {filtrados.length} match{filtrados.length !== 1 ? 'es' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Geolocalización / Radio */}
        {miUbicacion ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <MapPin size={16} color="#0EA5E9" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', flex: 1 }}>
                Mostrando matches a menos de <strong style={{ color: 'white' }}>{radio} km</strong>
              </span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{radio} km</span>
            </div>
            <input type="range" min={5} max={200} step={5} value={radio}
              onChange={e => setRadio(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0EA5E9', height: 4, borderRadius: 2, cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
              <span>5 km</span>
              <span>200 km</span>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 12, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>
              Activa tu ubicación para ver matches cerca de ti
            </p>
            <button onClick={pedirUbicacion} disabled={errorGeo}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', color: 'white',
                fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
              }}>
              <MapPin size={16} />
              {errorGeo ? 'Permiso denegado - Configura desde tu navegador' : '📍 Detectar mi ubicación'}
            </button>
          </div>
        )}

        {filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ marginBottom: 16, color: 'var(--text3)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <p style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>Sin matches aún</p>
            <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 24 }}>Marca más figuritas y agrega algunas como repetidas</p>
            <button style={{
              padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', color: 'white',
              fontWeight: 700, fontSize: 14
            }} onClick={() => router.push('/album')}>
              Ir a mi Álbum
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtrados.map((m) => (
              <div key={m.userId} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, overflow: 'hidden'
              }}>
                {/* Header */}
                <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  {m.avatar ? (
                    <img src={m.avatar} style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0 }} alt="" />
                  ) : (
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'white'
                    }}>{m.nombre[0]}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                      {m.distancia !== null ? `📍 ${m.distancia} km` : m.ciudad || 'Ubicación desconocida'}
                    </div>
                  </div>
                  <div style={{
                    flexShrink: 0, padding: '8px 14px', borderRadius: 12, textAlign: 'center',
                    background: 'linear-gradient(135deg,rgba(14,165,233,0.2),rgba(29,78,216,0.2))',
                    border: '1px solid rgba(14,165,233,0.3)'
                  }}>
                    <div style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, color: '#0EA5E9', lineHeight: 1 }}>{m.score}</div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>swaps</div>
                  </div>
                </div>

                {/* Figuritas */}
                <div style={{ padding: '0 16px 12px' }}>
                  {m.dame.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#3BB273', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                        Te puede dar ({m.totalDame})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {m.dame.map((s, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600, background: 'rgba(59,178,115,0.1)', border: '1px solid rgba(59,178,115,0.25)', color: '#3BB273' }}>{s.jugador}</span>
                        ))}
                        {m.totalDame > 6 && <span style={{ fontSize: 11, color: 'var(--text3)', padding: '3px 4px' }}>+{m.totalDame - 6} más</span>}
                      </div>
                    </div>
                  )}
                  {m.doy.length > 0 && (
                    <div style={{ marginBottom: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                        Tú le das ({m.totalDoy})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {m.doy.map((s, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600, background: 'rgba(0,180,216,0.1)', border: '1px solid rgba(0,180,216,0.25)', color: '#0EA5E9' }}>{s.jugador}</span>
                        ))}
                        {m.totalDoy > 6 && <span style={{ fontSize: 11, color: 'var(--text3)', padding: '3px 4px' }}>+{m.totalDoy - 6} más</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Botón WhatsApp */}
                {m.telefono ? (
                  <a href={`https://wa.me/${m.telefono}?text=Hola%20${encodeURIComponent(m.nombre.split(' ')[0])}!%20Te%20escribo%20desde%20MetaXport.%20Podemos%20intercambiar%20${m.score}%20figuritas%20del%20Mundial%202026!%20%F0%9F%8F%86`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      padding: '16px', background: 'linear-gradient(135deg,#25D366,#128C7E)',
                      color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none',
                      borderTop: '1px solid rgba(255,255,255,0.06)'
                    }}>
                    <MessageCircle size={20} strokeWidth={2} />
                    Contactar · {m.nombre.split(' ')[0]}
                  </a>
                ) : (
                  <div style={{
                    padding: '14px', textAlign: 'center', fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.02)', color: 'var(--text3)',
                    borderTop: '1px solid rgba(255,255,255,0.04)'
                  }}>
                    <PhoneOff size={15} /> Sin WhatsApp registrado
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav active="/intercambios" />
    </main>
  )
}
'use client'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import Navbar from '../../components/Navbar'
import { MessageCircle, PhoneOff, MapPin } from 'lucide-react'
import { distancia } from '../../lib/distance'
import { cacheFetch, cacheGet, cacheSet } from '../../lib/cache'
import { notificarNuevoMatch } from '../../lib/notifications'

const STK_CACHE = 'metaxport_stickers'

function SkeletonCard() {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="skel skel-avatar" />
        <div style={{ flex: 1 }}>
          <div className="skel" style={{ width: '50%', height: 16, marginBottom: 6 }} />
          <div className="skel" style={{ width: '30%', height: 12 }} />
        </div>
        <div className="skel" style={{ width: 60, height: 52, borderRadius: 12 }} />
      </div>
      <div style={{ padding: '0 16px 12px' }}>
        <div className="skel" style={{ height: 12, marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skel" style={{ width: 60, height: 22, borderRadius: 6 }} />
          ))}
        </div>
      </div>
      <div style={{ height: 48, background: 'rgba(255,255,255,0.02)' }} />
    </div>
  )
}

export default function Intercambios() {
  const [user, setUser] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [radio, setRadio] = useState(50)
  const [miUbicacion, setMiUbicacion] = useState(null)
  const [errorGeo, setErrorGeo] = useState(false)
  const [perfilesData, setPerfilesData] = useState([])
  const [perfilIncompleto, setPerfilIncompleto] = useState(null)
  const [modoAsync, setModoAsync] = useState(false)
  const [cargandoMatches, setCargandoMatches] = useState(false)
  const cancelRef = useRef(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      const [{ data: perfil }, { data: todos }] = await Promise.all([
        supabase.from('profiles')
          .select('latitud,longitud,telefono').eq('id', session.user.id).single(),
        cacheFetch(STK_CACHE, () =>
          supabase.from('stickers').select('id')
            .then(r => { cacheSet(STK_CACHE, r.data || []); return r })
            .then(r => r.data || []),
          10 * 60 * 1000
        )
      ])
      if (perfil?.latitud && perfil?.longitud) {
        setMiUbicacion({ lat: perfil.latitud, lng: perfil.longitud })
      }
      if (!perfil?.telefono || !perfil?.latitud) {
        setPerfilIncompleto('Faltan datos de tu perfil')
      }
      setLoading(false)
      calcular(session.user.id, todos)
    })
  }, [])

  const recalcularDistancias = useCallback((lat, lng) => {
    setMatches(prev => prev.map(m => {
      const p = perfilesData.find(x => x.id === m.userId)
      let dist = null
      if (p?.latitud && p?.longitud) {
        dist = Math.round(distancia(lat, lng, p.latitud, p.longitud))
      }
      return { ...m, distancia: dist }
    }))
  }, [perfilesData])

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

  const calcular = async (uid, todos) => {
    setCargandoMatches(true)
    cancelRef.current = false
    const { data: mis } = await supabase.from('user_stickers')
      .select('sticker_id,quantity').eq('user_id', uid)
    if (!mis || mis.length === 0 || cancelRef.current) { setCargandoMatches(false); return }
    const tengo = mis.filter(s => s.quantity >= 1).map(s => s.sticker_id)
    const repito = mis.filter(s => s.quantity >= 2).map(s => s.sticker_id)
    const todosIds = (todos || []).map(s => s.id)
    const faltan = todosIds.filter(id => !tengo.includes(id))
    const { data: otros } = await supabase.from('user_stickers')
      .select('user_id,sticker_id,quantity').neq('user_id', uid)
    if (!otros || otros.length === 0 || cancelRef.current) { setCargandoMatches(false); return }
    const porUser = {}
    otros.forEach(s => { if (!porUser[s.user_id]) porUser[s.user_id] = []; porUser[s.user_id].push(s) })
    const candidatos = []
    for (const [oId, sus] of Object.entries(porUser)) {
      if (cancelRef.current) break
      const elTiene = sus.filter(s => s.quantity >= 1).map(s => s.sticker_id)
      const elRep = sus.filter(s => s.quantity >= 2).map(s => s.sticker_id)
      const elFal = todosIds.filter(id => !elTiene.includes(id))
      const dame = elRep.filter(id => faltan.includes(id))
      const doy = repito.filter(id => elFal.includes(id))
      const score = dame.length + doy.length
      if (score > 0) {
        candidatos.push({ oId, dame, doy, score, esSimetrico: doy.length > 0 })
      } else if (dame.length > 0) {
        candidatos.push({ oId, dame, doy: [], score: dame.length, esSimetrico: false })
      }
    }
    if (cancelRef.current) { setCargandoMatches(false); return }
    candidatos.sort((a, b) => b.score - a.score || (a.esSimetrico === b.esSimetrico ? 0 : a.esSimetrico ? -1 : 1))
    const userIds = candidatos.map(c => c.oId)
    const stickerIds = [...new Set([
      ...candidatos.flatMap(c => c.dame.slice(0, 6)),
      ...candidatos.flatMap(c => c.doy.slice(0, 6))
    ])]
    const [{ data: perfiles }, { data: stkData }] = await Promise.all([
      supabase.from('profiles').select('id,full_name,avatar_url,ciudad,telefono,latitud,longitud').in('id', userIds),
      supabase.from('stickers').select('id,jugador').in('id', stickerIds)
    ])
    if (cancelRef.current) { setCargandoMatches(false); return }
    const perfilMap = {}
    if (perfiles) { perfiles.forEach(p => { perfilMap[p.id] = p }); setPerfilesData(perfiles) }
    const stkMap = {}
    if (stkData) stkData.forEach(s => { stkMap[s.id] = s })
    const miLoc = miUbicacion
    const armarMatches = (cands) => cands.map(({ oId, dame, doy, score, esSimetrico }) => {
      const p = perfilMap[oId] || {}
      let dist = null
      if (miLoc && p.latitud && p.longitud) {
        dist = Math.round(distancia(miLoc.lat, miLoc.lng, p.latitud, p.longitud))
      }
      return {
        userId: oId, nombre: p.full_name || 'Usuario', avatar: p.avatar_url,
        ciudad: p.ciudad, telefono: p.telefono, score, distancia: dist, esSimetrico,
        dame: dame.slice(0, 6).map(id => stkMap[id]).filter(Boolean),
        doy: doy.slice(0, 6).map(id => stkMap[id]).filter(Boolean),
        totalDame: dame.length, totalDoy: doy.length,
      }
    })
    const nuevos = armarMatches(candidatos)
    setMatches(nuevos)
    setCargandoMatches(false)
    const top = nuevos[0]
    if (top && top.score > 0 && top.nombre) {
      notificarNuevoMatch(top.nombre, top.score)
    }
  }

  const filtrados = useMemo(() => {
    let lista = matches
    if (!modoAsync) {
      lista = lista.filter(m => m.esSimetrico)
    }
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
  }, [matches, radio, miUbicacion, modoAsync])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <nav style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="skel" style={{ width: 120, height: 24 }} />
        <div className="skel" style={{ width: 76, height: 38, borderRadius: 10 }} />
      </nav>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
        <div className="skel" style={{ width: 200, height: 26, marginBottom: 8 }} />
        <div className="skel" style={{ width: 120, height: 14, marginBottom: 20 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <Navbar />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
              Mis <span style={{ background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intercambios</span>
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 13 }}>
              {filtrados.length} match{filtrados.length !== 1 ? 'es' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => router.push('/mapa')} className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12, flexShrink: 0 }}>
            <MapPin size={14} /> Mapa
          </button>
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

        {/* Perfil incompleto */}
        {perfilIncompleto && (
          <div style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 12, background: 'rgba(245,197,24,0.06)', border: '1px solid rgba(245,197,24,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#F5C518', marginBottom: 2 }}>Tu perfil está incompleto</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Agrega tu teléfono para que puedan contactarte</div>
              </div>
              <button onClick={() => router.push('/perfil')}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#F5C518', color: '#000', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
                Completar
              </button>
              <button onClick={() => setPerfilIncompleto(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, padding: 4 }}>
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Toggle asíncrono */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setModoAsync(!modoAsync)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: modoAsync ? 'rgba(59,178,115,0.15)' : 'rgba(255,255,255,0.05)',
              color: modoAsync ? '#3BB273' : 'var(--text2)',
              border: `1px solid ${modoAsync ? 'rgba(59,178,115,0.3)' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', gap: 6
            }}>
            {modoAsync ? '✓' : '○'} Modo asíncrono
          </button>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            {modoAsync ? 'Mostrando también usuarios que solo te pueden dar a ti' : 'Solo matches donde ambos intercambian'}
          </span>
        </div>

        {filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ marginBottom: 16, color: 'var(--text3)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <p style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>
              {modoAsync ? 'Sin resultados' : 'Sin matches aún'}
            </p>
            <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 24 }}>
              {modoAsync
                ? 'Nadie en tu radio tiene figuritas que te falten. Intenta ampliar el radio o marca más figuritas.'
                : 'Marca más figuritas como repetidas para encontrar matches. También puedes activar el modo asíncrono arriba.'}
            </p>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                        {m.distancia !== null ? `📍 ${m.distancia} km` : m.ciudad || 'Ubicación desconocida'}
                      </div>
                      {!m.esSimetrico && (
                        <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, fontWeight: 700, background: 'rgba(59,178,115,0.1)', border: '1px solid rgba(59,178,115,0.2)', color: '#3BB273', textTransform: 'uppercase' }}>
                          te da
                        </span>
                      )}
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

                {/* Botones de acción */}
                <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={() => router.push(`/chat?user=${m.userId}`)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '14px', background: 'rgba(14,165,233,0.08)', color: '#0EA5E9',
                      border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14
                    }}>
                    <MessageCircle size={18} strokeWidth={1.8} />
                    Mensaje
                  </button>
                  {m.telefono ? (
                    <a href={`https://wa.me/${m.telefono}?text=Hola%20${encodeURIComponent(m.nombre.split(' ')[0])}!%20Te%20escribo%20desde%20MetaXport.%20Podemos%20intercambiar%20${m.score}%20figuritas%20del%20Mundial%202026!`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '14px', background: 'linear-gradient(135deg,#25D366,#128C7E)',
                        color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none'
                      }}>
                      WhatsApp
                    </a>
                  ) : (
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '14px', background: 'rgba(255,255,255,0.02)', color: 'var(--text3)',
                      fontSize: 13
                    }}>
                      <PhoneOff size={15} /> Sin teléfono
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav active="/intercambios" />
    </main>
  )
}
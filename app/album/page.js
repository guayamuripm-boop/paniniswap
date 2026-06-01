'use client'
import BottomNav from '../../components/BottomNav'
import Navbar from '../../components/Navbar'
import { Circle } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const GRUPOS = {
  A:['MEX','RSA','KOR','CZE'], B:['CAN','BIH','QAT','SUI'],
  C:['BRA','MAR','HAI','SCO'], D:['USA','PAR','AUS','TUR'],
  E:['GER','CUW','CIV','ECU'], F:['NED','JPN','SWE','TUN'],
  G:['BEL','EGY','IRN','NZL'], H:['ESP','CPV','KSA','URU'],
  I:['FRA','SEN','IRQ','NOR'], J:['ARG','ALG','AUT','JOR'],
  K:['POR','COD','UZB','COL'], L:['ENG','CRO','GHA','PAN'],
}

const PAISES = {
  MEX:'🇲🇽 México', RSA:'🇿🇦 Sudáfrica', KOR:'🇰🇷 Corea del Sur', CZE:'🇨🇿 Rep. Checa',
  CAN:'🇨🇦 Canadá', BIH:'🇧🇦 Bosnia', QAT:'🇶🇦 Qatar', SUI:'🇨🇭 Suiza',
  BRA:'🇧🇷 Brasil', MAR:'🇲🇦 Marruecos', HAI:'🇭🇹 Haití', SCO:'🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia',
  USA:'🇺🇸 USA', PAR:'🇵🇾 Paraguay', AUS:'🇦🇺 Australia', TUR:'🇹🇷 Turquía',
  GER:'🇩🇪 Alemania', CUW:'🇨🇼 Curazao', CIV:'🇨🇮 Costa de Marfil', ECU:'🇪🇨 Ecuador',
  NED:'🇳🇱 Holanda', JPN:'🇯🇵 Japón', SWE:'🇸🇪 Suecia', TUN:'🇹🇳 Túnez',
  BEL:'🇧🇪 Bélgica', EGY:'🇪🇬 Egipto', IRN:'🇮🇷 Irán', NZL:'🇳🇿 Nueva Zelanda',
  ESP:'🇪🇸 España', CPV:'🇨🇻 Cabo Verde', KSA:'🇸🇦 Arabia Saudita', URU:'🇺🇾 Uruguay',
  FRA:'🇫🇷 Francia', SEN:'🇸🇳 Senegal', IRQ:'🇮🇶 Irak', NOR:'🇳🇴 Noruega',
  ARG:'🇦🇷 Argentina', ALG:'🇩🇿 Argelia', AUT:'🇦🇹 Austria', JOR:'🇯🇴 Jordania',
  POR:'🇵🇹 Portugal', COD:'🇨🇩 Congo DR', UZB:'🇺🇿 Uzbekistán', COL:'🇨🇴 Colombia',
  ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', CRO:'🇭🇷 Croacia', GHA:'🇬🇭 Ghana', PAN:'🇵🇦 Panamá',
  FWC:'🏆 FIFA WC', CC:'🥤 Coca-Cola',
}

const NOMBRES_BUSQUEDA = {
  MEX:'Mexico', RSA:'Sudafrica', KOR:'Corea del Sur Korea', CZE:'Republica Checa Czech',
  CAN:'Canada', BIH:'Bosnia', QAT:'Qatar', SUI:'Suiza Switzerland',
  BRA:'Brasil Brazil', MAR:'Marruecos Morocco', HAI:'Haiti', SCO:'Escocia Scotland',
  USA:'Estados Unidos USA', PAR:'Paraguay', AUS:'Australia', TUR:'Turquia Turkey',
  GER:'Alemania Germany', CUW:'Curacao', CIV:'Costa de Marfil Ivory Coast', ECU:'Ecuador',
  NED:'Holanda Netherlands Holland', JPN:'Japon Japan', SWE:'Suecia Sweden', TUN:'Tunez Tunisia',
  BEL:'Belgica Belgium', EGY:'Egipto Egypt', IRN:'Iran', NZL:'Nueva Zelanda New Zealand',
  ESP:'Espana Spain', CPV:'Cabo Verde', KSA:'Arabia Saudita Saudi', URU:'Uruguay',
  FRA:'Francia France', SEN:'Senegal', IRQ:'Irak Iraq', NOR:'Noruega Norway',
  ARG:'Argentina', ALG:'Argelia Algeria', AUT:'Austria', JOR:'Jordania Jordan',
  POR:'Portugal', COD:'Congo', UZB:'Uzbekistan', COL:'Colombia',
  ENG:'Inglaterra England', CRO:'Croacia Croatia', GHA:'Ghana', PAN:'Panama',
  FWC:'FIFA World Cup Copa', CC:'Coca Cola',
}

const COLORES = {
  A:'#E8363D', B:'#F47B20', C:'#3BB273', D:'#00B4D8',
  E:'#7B2FBE', F:'#F5C518', G:'#4361EE', H:'#EC407A',
  I:'#00897B', J:'#FF7043', K:'#5C6BC0', L:'#26A69A',
  FWC:'#F5C518', CC:'#E8363D',
}

function getGrupoDeSeccion(sec) {
  for (const [g, secs] of Object.entries(GRUPOS)) {
    if (secs.includes(sec)) return g
  }
  return null
}

export default function Album() {
  const [user, setUser] = useState(null)
  const [stickers, setStickers] = useState([])
  const [mis, setMis] = useState({})
  const [grupo, setGrupo] = useState('A')
  const [seccion, setSeccion] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [modoBusqueda, setModoBusqueda] = useState(false)
  const [loading, setLoading] = useState(true)
  const [navAbierto, setNavAbierto] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      await asegurarPerfil(session.user)
      await cargar(session.user.id)
      setLoading(false)
    })
  }, [])

  const asegurarPerfil = async (u) => {
    const { data } = await supabase.from('profiles').select('id').eq('id', u.id).single()
    if (!data) await supabase.from('profiles').insert({
      id: u.id, full_name: u.user_metadata?.full_name, avatar_url: u.user_metadata?.avatar_url
    })
  }

  const cargar = async (uid) => {
    // Correr ambas queries en paralelo en vez de secuencial
    const [{ data: todos }, { data: mios }] = await Promise.all([
      supabase.from('stickers').select('id, numero, jugador, seccion').order('numero'),
      supabase.from('user_stickers').select('id, sticker_id, quantity').eq('user_id', uid)
    ])
    const m = {}
    if (mios) mios.forEach(s => { m[s.sticker_id] = s })
    setStickers(todos || [])
    setMis(m)
  }

  const toggle = async (s) => {
    const uid = user.id
    const act = mis[s.id]
    if (!act) {
      const { data } = await supabase.from('user_stickers')
        .insert({ user_id: uid, sticker_id: s.id, quantity: 1, wanted: false })
        .select().single()
      setMis(p => ({ ...p, [s.id]: data }))
    } else if (act.quantity === 1) {
      const { data } = await supabase.from('user_stickers')
        .update({ quantity: 2 }).eq('id', act.id).select().single()
      setMis(p => ({ ...p, [s.id]: data }))
    } else {
      await supabase.from('user_stickers').delete().eq('id', act.id)
      setMis(p => { const n = { ...p }; delete n[s.id]; return n })
    }
  }

  // Búsqueda
  const seccionesBusqueda = useMemo(() => {
    if (!busqueda || busqueda.length < 2) return []
    const q = busqueda.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return Object.entries(NOMBRES_BUSQUEDA)
      .filter(([, nombre]) => nombre.toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').includes(q))
      .map(([code]) => code)
  }, [busqueda])

  const secciones = GRUPOS[grupo] || []
  const secActiva = seccion || secciones[0] || grupo
  const color = COLORES[grupo] || '#00B4D8'

  const filtradosBusqueda = useMemo(() => {
    if (!modoBusqueda || seccionesBusqueda.length === 0) return []
    return stickers.filter(s => seccionesBusqueda.includes(s.seccion))
  }, [modoBusqueda, seccionesBusqueda, stickers])

  const filtradosGrupo = stickers.filter(s => s.seccion === secActiva)
  const mostrar = modoBusqueda ? filtradosBusqueda : filtradosGrupo

  const tengo = Object.values(mis).filter(s => s.quantity >= 1).length
  const repito = Object.values(mis).filter(s => s.quantity >= 2).length
  const faltan = stickers.length - tengo
  const pct = stickers.length > 0 ? Math.round(tengo / stickers.length * 100) : 0

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MetaXport</div>
        <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 8 }}>Cargando tu álbum...</div>
      </div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>

      {/* Navbar mobile */}
      <nav
        showSearch={true}
        onSearch={() => { setModoBusqueda(!modoBusqueda); setBusqueda('') }}
        searchActive={modoBusqueda}
      >
        {!modoBusqueda && (
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 14 }}>
            {[
              { color: 'rgba(255,255,255,0.15)', label: 'Vacía' },
              { color: '#00B4D8', label: 'Tengo' },
              { color: '#3BB273', label: 'Repetida' },
            ].map(({ color: c, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)' }}>
                <Circle size={7} fill={c} color={c} />
                {label}
              </div>
            ))}
          </div>
        )}
        <span style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800 }}>
          <span style={{ background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Meta</span>
          <span style={{ color: 'white' }}>Xport</span>
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Búsqueda toggle */}
          <button
            onClick={() => { setModoBusqueda(!modoBusqueda); setBusqueda('') }}
            style={{
              padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: modoBusqueda ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.06)',
              color: modoBusqueda ? '#0EA5E9' : 'var(--text2)', fontSize: 16
            }}>
            🔍
          </button>
          {/* Menu hamburguesa en mobile */}
          <button
            onClick={() => setNavAbierto(!navAbierto)}
            style={{ padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: 'var(--text2)', fontSize: 16 }}>
            ☰
          </button>
        </div>
      </nav>

      {/* Drawer menu mobile */}
      {navAbierto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setNavAbierto(false)}>
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 260,
            background: 'var(--bg3)', borderLeft: '1px solid rgba(255,255,255,0.08)',
            padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              <span style={{ background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Meta</span>
              <span style={{ color: 'white' }}>Xport</span>
            </div>
            {[
              { label: '🔄 Intercambios', path: '/intercambios' },
              { label: '📊 Análisis', path: '/analisis' },
              { label: '👤 Perfil', path: '/perfil' },
            ].map(item => (
              <button key={item.path}
                onClick={() => { router.push(item.path); setNavAbierto(false) }}
                style={{
                  padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)', color: 'var(--text)', fontSize: 14,
                  fontWeight: 600, textAlign: 'left', cursor: 'pointer'
                }}>
                {item.label}
              </button>
            ))}
            <div style={{ marginTop: 'auto' }}>
              <button onClick={handleLogout}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12,
                  border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.08)',
                  color: '#EF4444', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                }}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px' }}>

        {/* Stats hero */}
        <div style={{
          background: `linear-gradient(135deg, ${color}18, ${color}08)`,
          border: `1px solid ${color}25`, borderRadius: 20, padding: '16px 20px', marginBottom: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, color: 'white' }}>{pct}% completado</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                {tengo} tengo · {faltan} faltan · {repito} repito
              </div>
            </div>
            <div style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, color }}>
              {tengo}<span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 400 }}>/{stickers.length}</span>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
          </div>
        </div>

        {/* Buscador */}
        {modoBusqueda && (
          <div style={{ marginBottom: 16 }}>
            <input
              className="input-field"
              placeholder="Buscar selección... (ej: Argentina, Francia, España)"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              autoFocus
              style={{ fontSize: 15 }}
            />
            {busqueda.length >= 2 && seccionesBusqueda.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {seccionesBusqueda.map(sec => {
                  const stkSec = stickers.filter(s => s.seccion === sec)
                  const tieneSec = stkSec.filter(s => mis[s.id]?.quantity >= 1).length
                  const g = getGrupoDeSeccion(sec)
                  const c = g ? COLORES[g] : '#94A3B8'
                  return (
                    <button key={sec}
                      onClick={() => {
                        if (g) { setGrupo(g); setSeccion(sec) }
                        setModoBusqueda(false); setBusqueda('')
                      }}
                      style={{
                        padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                        background: `${c}15`, border: `1px solid ${c}40`,
                        color: 'white', fontSize: 13, fontWeight: 600
                      }}>
                      {PAISES[sec] || sec}
                      <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text3)' }}>
                        {tieneSec}/{stkSec.length}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
            {busqueda.length >= 2 && seccionesBusqueda.length === 0 && (
              <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 10, textAlign: 'center' }}>
                No encontramos esa selección
              </p>
            )}
          </div>
        )}

        {/* Instrucción */}
        {!modoBusqueda && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 14 }}>
            {[['rgba(255,255,255,0.15)', '· Vacía'], ['#00B4D8', 'Tengo'], ['#3BB273', 'Repetida']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block' }} />
                {l}
              </div>
            ))}
          </div>
        )}

        {/* Grupos scroll */}
        {!modoBusqueda && (
          <>
            <div style={{ overflowX: 'auto', paddingBottom: 6, marginBottom: 10, WebkitOverflowScrolling: 'touch' }}>
              <div style={{ display: 'flex', gap: 6, width: 'max-content', paddingBottom: 2 }}>
                {Object.keys(GRUPOS).map(g => (
                  <button key={g}
                    onClick={() => { setGrupo(g); setSeccion(null) }}
                    style={{
                      padding: '7px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                      background: grupo === g ? COLORES[g] : 'transparent',
                      border: `1px solid ${grupo === g ? COLORES[g] : 'rgba(255,255,255,0.12)'}`,
                      color: grupo === g ? 'white' : 'var(--text2)',
                    }}>
                    Grupo {g}
                  </button>
                ))}
                {['FWC', 'CC'].map(g => (
                  <button key={g}
                    onClick={() => { setGrupo(g); setSeccion(g) }}
                    style={{
                      padding: '7px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      background: grupo === g ? COLORES[g] : 'transparent',
                      border: `1px solid ${grupo === g ? COLORES[g] : 'rgba(255,255,255,0.12)'}`,
                      color: grupo === g ? (g === 'FWC' ? '#000' : 'white') : 'var(--text2)',
                    }}>
                    {g === 'FWC' ? '🏆 FIFA' : '🥤 Coca'}
                  </button>
                ))}
              </div>
            </div>

            {/* Selecciones del grupo — tarjetas grandes en mobile */}
            {GRUPOS[grupo] && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
                {GRUPOS[grupo].map(sec => {
                  const stkSec = stickers.filter(s => s.seccion === sec)
                  const tieneSec = stkSec.filter(s => mis[s.id]?.quantity >= 1).length
                  const pctSec = stkSec.length > 0 ? Math.round(tieneSec / stkSec.length * 100) : 0
                  const isAct = secActiva === sec
                  return (
                    <button key={sec}
                      onClick={() => setSeccion(sec)}
                      style={{
                        padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                        background: isAct ? `${color}15` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isAct ? `${color}50` : 'rgba(255,255,255,0.08)'}`,
                        textAlign: 'left', transition: 'all 0.2s'
                      }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isAct ? 'white' : 'var(--text2)', marginBottom: 6 }}>
                        {PAISES[sec] || sec}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{ width: `${pctSec}%`, height: '100%', background: pctSec === 100 ? '#3BB273' : color, borderRadius: 99, transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: pctSec === 100 ? '#3BB273' : 'var(--text3)', minWidth: 28, textAlign: 'right' }}>
                          {pctSec}%
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Título sección */}
        {!modoBusqueda && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {PAISES[secActiva] || secActiva} · {filtradosGrupo.length} figuritas
            </span>
          </div>
        )}

        {/* Grid figuritas — más grande en mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
          gap: 8
        }}>
          {mostrar.map(s => {
            const m = mis[s.id]
            const q = m?.quantity || 0
            const bg = q === 0 ? 'rgba(255,255,255,0.03)' : q >= 2 ? 'rgba(59,178,115,0.12)' : 'rgba(0,180,216,0.12)'
            const borderC = q === 0 ? 'rgba(255,255,255,0.06)' : q >= 2 ? 'rgba(59,178,115,0.4)' : 'rgba(0,180,216,0.35)'
            const textC = q === 0 ? 'rgba(255,255,255,0.2)' : q >= 2 ? '#3BB273' : '#00B4D8'

            return (
              <button key={s.id}
                onClick={() => toggle(s)}
                title={s.jugador}
                style={{
                  borderRadius: 12, padding: '10px 6px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.15s', background: bg,
                  border: `1px solid ${borderC}`,
                  minHeight: 56,
                  position: 'relative',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: textC, lineHeight: 1.3 }}>
                  {s.jugador}
                </div>
                {q >= 2 && (
                  <div style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#3BB273', color: 'var(--bg)',
                    fontSize: 8, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>R</div>
                )}
              </button>
            )
          })}
        </div>

      </div>

      {/* Bottom nav mobile */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(6,8,16,0.92)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 0 max(10px, env(safe-area-inset-bottom))',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center'
      }}>
        {[
          { icon: '📒', label: 'Álbum', path: '/album', active: true },
          { icon: '🔄', label: 'Swaps', path: '/intercambios', active: false },
          { icon: '📊', label: 'Análisis', path: '/analisis', active: false },
          { icon: '👤', label: 'Perfil', path: '/perfil', active: false },
        ].map(item => (
          <button key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 16px',
              color: item.active ? '#0EA5E9' : 'var(--text3)',
            }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
      </div>
      <BottomNav active="/album" />
    </main>
    
  )
}
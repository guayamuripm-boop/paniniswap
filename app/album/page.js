'use client'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import Navbar from '../../components/Navbar'
import { Circle } from 'lucide-react'
import { cacheGet, cacheFetch, cacheSet } from '../../lib/cache'

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

const CACHE_KEY = 'metaxport_stickers'

export default function Album() {
  const [user, setUser] = useState(null)
  const [stickers, setStickers] = useState([])
  const [mis, setMis] = useState({})
  const [grupo, setGrupo] = useState('A')
  const [seccion, setSeccion] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [modoBusqueda, setModoBusqueda] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const pendingRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      const cached = cacheGet(CACHE_KEY)
      if (cached) setStickers(cached)
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
    const [{ data: todos }, { data: mios }] = await Promise.all([
      cacheFetch(CACHE_KEY, () =>
        supabase.from('stickers').select('id,numero,jugador,seccion').order('numero')
          .then(r => { cacheSet(CACHE_KEY, r.data || []); return r })
          .then(r => r.data || []),
        10 * 60 * 1000
      ),
      supabase.from('user_stickers').select('id,sticker_id,quantity').eq('user_id', uid)
    ])
    const m = {}
    if (mios) mios.forEach(s => { m[s.sticker_id] = s })
    if (todos) setStickers(todos)
    setMis(m)
  }

  const toggle = useCallback(async (s) => {
    const uid = user.id
    const act = mis[s.id]
    const prev = mis

    // Optimistic update
    if (!act) {
      const mock = { id: '__optimistic__', sticker_id: s.id, quantity: 1 }
      setMis(p => ({ ...p, [s.id]: mock }))
      setToast('✅ Marcada como "Tengo"')
    } else if (act.quantity === 1) {
      setMis(p => ({ ...p, [s.id]: { ...p[s.id], quantity: 2 } }))
      setToast('🔄 Marcada como repetida')
    } else {
      setMis(p => { const n = { ...p }; delete n[s.id]; return n })
      setToast('✖️ Figurita desmarcada')
    }
    setTimeout(() => setToast(null), 1500)

    try {
      if (!act) {
        const { data } = await supabase.from('user_stickers')
          .insert({ user_id: uid, sticker_id: s.id, quantity: 1, wanted: false })
          .select().single()
        if (data) setMis(p => ({ ...p, [s.id]: data }))
      } else if (act.quantity === 1) {
        const { data } = await supabase.from('user_stickers')
          .update({ quantity: 2 }).eq('id', act.id).select().single()
        if (data) setMis(p => ({ ...p, [s.id]: data }))
      } else {
        await supabase.from('user_stickers').delete().eq('id', act.id)
      }
    } catch {
      setMis(prev)
      setToast('❌ Error al guardar')
    }
  }, [user, mis])

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

  const filtradosGrupo = useMemo(() => {
    return stickers.filter(s => s.seccion === secActiva)
  }, [stickers, secActiva])

  const mostrar = modoBusqueda ? filtradosBusqueda : filtradosGrupo

  const tengo = useMemo(() => Object.values(mis).filter(s => s.quantity >= 1).length, [mis])
  const repito = useMemo(() => Object.values(mis).filter(s => s.quantity >= 2).length, [mis])
  const faltan = stickers.length - tengo
  const pct = stickers.length > 0 ? Math.round(tengo / stickers.length * 100) : 0

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <nav style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="skel" style={{ width: 120, height: 24 }} />
        <div className="skel" style={{ width: 76, height: 38, borderRadius: 10 }} />
      </nav>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px' }}>
        <div className="skel" style={{ height: 90, borderRadius: 20, marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="skel" style={{ width: 68, height: 30, borderRadius: 50, flexShrink: 0 }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skel" style={{ height: 68, borderRadius: 14 }} />
          ))}
        </div>
        <div className="skel" style={{ width: 140, height: 16, marginBottom: 14 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 8 }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="skel" style={{ height: 56, borderRadius: 12 }} />
          ))}
        </div>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '8px 0', display: 'flex', justifyContent: 'space-around', background: 'var(--bg)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skel" style={{ width: 40, height: 40, borderRadius: 8 }} />
        ))}
      </div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>

      {/* Navbar con búsqueda */}
      <Navbar
        showSearch={true}
        onSearch={() => { setModoBusqueda(!modoBusqueda); setBusqueda('') }}
        searchActive={modoBusqueda}
      />

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
            <input className="input-field"
              placeholder="Buscar selección... (ej: Argentina, Francia, España)"
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              autoFocus style={{ fontSize: 15 }} />
            {busqueda.length >= 2 && seccionesBusqueda.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {seccionesBusqueda.map(sec => {
                  const stkSec = stickers.filter(s => s.seccion === sec)
                  const tieneSec = stkSec.filter(s => mis[s.id]?.quantity >= 1).length
                  const g = getGrupoDeSeccion(sec)
                  const c = g ? COLORES[g] : '#94A3B8'
                  return (
                    <button key={sec}
                      onClick={() => { if (g) { setGrupo(g); setSeccion(sec) }; setModoBusqueda(false); setBusqueda('') }}
                      style={{ padding: '8px 14px', borderRadius: 10, cursor: 'pointer', background: `${c}15`, border: `1px solid ${c}40`, color: 'white', fontSize: 13, fontWeight: 600 }}>
                      {PAISES[sec] || sec}
                      <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text3)' }}>{tieneSec}/{stkSec.length}</span>
                    </button>
                  )
                })}
              </div>
            )}
            {busqueda.length >= 2 && seccionesBusqueda.length === 0 && (
              <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 10, textAlign: 'center' }}>No encontramos esa selección</p>
            )}
          </div>
        )}

        {/* Leyenda */}
        {!modoBusqueda && (
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 14 }}>
            {[{ c: 'rgba(255,255,255,0.15)', l: 'Vacía' }, { c: '#00B4D8', l: 'Tengo' }, { c: '#3BB273', l: 'Repetida' }].map(({ c, l }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)' }}>
                <Circle size={7} fill={c} color={c} />
                {l}
              </div>
            ))}
          </div>
        )}

        {/* Scroll de grupos */}
        {!modoBusqueda && (
          <>
            <div style={{ overflowX: 'auto', paddingBottom: 6, marginBottom: 10, WebkitOverflowScrolling: 'touch' }}>
              <div style={{ display: 'flex', gap: 6, width: 'max-content', paddingBottom: 2 }}>
                {Object.keys(GRUPOS).map(g => (
                  <button key={g} onClick={() => { setGrupo(g); setSeccion(null) }}
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
                  <button key={g} onClick={() => { setGrupo(g); setSeccion(g) }}
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

            {/* Tarjetas de selecciones */}
            {GRUPOS[grupo] && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
                {GRUPOS[grupo].map(sec => {
                  const stkSec = stickers.filter(s => s.seccion === sec)
                  const tieneSec = stkSec.filter(s => mis[s.id]?.quantity >= 1).length
                  const pctSec = stkSec.length > 0 ? Math.round(tieneSec / stkSec.length * 100) : 0
                  const isAct = secActiva === sec
                  return (
                    <button key={sec} onClick={() => setSeccion(sec)}
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

        {/* Título sección activa */}
        {!modoBusqueda && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {PAISES[secActiva] || secActiva} · {filtradosGrupo.length} figuritas
            </span>
          </div>
        )}

        {/* Grid de figuritas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 8 }}>
          {mostrar.map(s => {
            const m = mis[s.id]
            const q = m?.quantity || 0
            const bg = q === 0 ? 'rgba(255,255,255,0.03)' : q >= 2 ? 'rgba(59,178,115,0.12)' : 'rgba(0,180,216,0.12)'
            const borderC = q === 0 ? 'rgba(255,255,255,0.06)' : q >= 2 ? 'rgba(59,178,115,0.4)' : 'rgba(0,180,216,0.35)'
            const textC = q === 0 ? 'rgba(255,255,255,0.2)' : q >= 2 ? '#3BB273' : '#00B4D8'
            return (
              <button key={s.id} onClick={() => toggle(s)} title={s.jugador}
                style={{
                  borderRadius: 12, padding: '10px 6px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.15s', background: bg,
                  border: `1px solid ${borderC}`, minHeight: 56, position: 'relative',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: textC, lineHeight: 1.3 }}>
                  {s.jugador}
                </div>
                {q >= 2 && (
                  <div style={{
                    position: 'absolute', top: -4, right: -4, width: 16, height: 16,
                    borderRadius: '50%', background: '#3BB273', color: 'var(--bg)',
                    fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>R</div>
                )}
              </button>
            )
          })}
        </div>

      </div>

      {toast && <div className="toast toast-success">{toast}</div>}

      {/* Bottom nav */}
      <BottomNav active="/album" />

    </main>
  )
}
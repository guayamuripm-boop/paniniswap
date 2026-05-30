'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const GRUPOS = {
  'A': ['MEX','RSA','KOR','CZE'],
  'B': ['CAN','BIH','QAT','SUI'],
  'C': ['BRA','MAR','HAI','SCO'],
  'D': ['USA','PAR','AUS','TUR'],
  'E': ['GER','CUW','CIV','ECU'],
  'F': ['NED','JPN','SWE','TUN'],
  'G': ['BEL','EGY','IRN','NZL'],
  'H': ['ESP','CPV','KSA','URU'],
  'I': ['FRA','SEN','IRQ','NOR'],
  'J': ['ARG','ALG','AUT','JOR'],
  'K': ['POR','COD','UZB','COL'],
  'L': ['ENG','CRO','GHA','PAN'],
}

const PAISES = {
  MEX:'México', RSA:'Sudáfrica', KOR:'Corea del Sur', CZE:'Rep. Checa',
  CAN:'Canadá', BIH:'Bosnia', QAT:'Qatar', SUI:'Suiza',
  BRA:'Brasil', MAR:'Marruecos', HAI:'Haití', SCO:'Escocia',
  USA:'USA', PAR:'Paraguay', AUS:'Australia', TUR:'Turquía',
  GER:'Alemania', CUW:'Curazao', CIV:'Costa de Marfil', ECU:'Ecuador',
  NED:'Holanda', JPN:'Japón', SWE:'Suecia', TUN:'Túnez',
  BEL:'Bélgica', EGY:'Egipto', IRN:'Irán', NZL:'Nueva Zelanda',
  ESP:'España', CPV:'Cabo Verde', KSA:'Arabia Saudita', URU:'Uruguay',
  FRA:'Francia', SEN:'Senegal', IRQ:'Irak', NOR:'Noruega',
  ARG:'Argentina', ALG:'Argelia', AUT:'Austria', JOR:'Jordania',
  POR:'Portugal', COD:'Congo DR', UZB:'Uzbekistán', COL:'Colombia',
  ENG:'Inglaterra', CRO:'Croacia', GHA:'Ghana', PAN:'Panamá',
  FWC:'FIFA WC', CC:'Coca-Cola',
}

const COLORES_GRUPO = {
  A:'#F5C518', B:'#00D4FF', C:'#00FF88', D:'#FF3B5C',
  E:'#A855F7', F:'#FB923C', G:'#06B6D4', H:'#EC4899',
  I:'#84CC16', J:'#F97316', K:'#6366F1', L:'#14B8A6',
}

function getGrupoDeSeccion(seccion) {
  for (const [grupo, secciones] of Object.entries(GRUPOS)) {
    if (secciones.includes(seccion)) return grupo
  }
  return null
}

export default function Album() {
  const [user, setUser] = useState(null)
  const [stickers, setStickers] = useState([])
  const [misStickers, setMisStickers] = useState({})
  const [grupoActivo, setGrupoActivo] = useState('A')
  const [seccionActiva, setSeccionActiva] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      await asegurarPerfil(session.user)
      await cargarStickers(session.user.id)
      setLoading(false)
    })
  }, [])

  const asegurarPerfil = async (user) => {
    const { data } = await supabase.from('profiles').select('id').eq('id', user.id).single()
    if (!data) {
      await supabase.from('profiles').insert({
        id: user.id,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
      })
    }
  }

  const cargarStickers = async (userId) => {
    const { data: todos } = await supabase.from('stickers').select('*').order('numero')
    const { data: mios } = await supabase.from('user_stickers').select('*').eq('user_id', userId)
    const mapa = {}
    if (mios) mios.forEach(s => { mapa[s.sticker_id] = s })
    setStickers(todos || [])
    setMisStickers(mapa)
  }

  const toggleSticker = async (sticker) => {
    const userId = user.id
    const actual = misStickers[sticker.id]
    if (!actual) {
      const { data } = await supabase.from('user_stickers')
        .insert({ user_id: userId, sticker_id: sticker.id, quantity: 1, wanted: false })
        .select().single()
      setMisStickers(prev => ({ ...prev, [sticker.id]: data }))
    } else if (actual.quantity === 1) {
      const { data } = await supabase.from('user_stickers')
        .update({ quantity: 2 }).eq('id', actual.id).select().single()
      setMisStickers(prev => ({ ...prev, [sticker.id]: data }))
    } else {
      await supabase.from('user_stickers').delete().eq('id', actual.id)
      setMisStickers(prev => { const n = { ...prev }; delete n[sticker.id]; return n })
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Stickers del grupo activo
  const seccionesDelGrupo = GRUPOS[grupoActivo] || []
  const seccionFinal = seccionActiva || seccionesDelGrupo[0]
  const stickersFiltrados = stickers.filter(s => s.seccion === seccionFinal)

  const tengo = Object.values(misStickers).filter(s => s.quantity >= 1).length
  const repito = Object.values(misStickers).filter(s => s.quantity >= 2).length
  const mefaltan = stickers.length - tengo
  const pct = stickers.length > 0 ? Math.round((tengo / stickers.length) * 100) : 0

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--dark)'}}>
      <div className="text-center">
        <div className="font-display text-4xl font-black mb-2" style={{color:'var(--gold)'}}>METAXPORT</div>
        <div className="text-sm animate-pulse" style={{color:'var(--text-dim)'}}>Cargando tu álbum...</div>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen" style={{background:'var(--dark)'}}>

      {/* Navbar */}
      <nav className="navbar sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl font-black tracking-wider" style={{color:'var(--gold)'}}>
            META<span style={{color:'var(--text)'}}>XPORT</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/intercambios')}
            className="btn-ghost px-3 py-2 text-xs">
            🔄 Intercambios
          </button>
          <button onClick={() => router.push('/perfil')}
            className="btn-ghost px-3 py-2 text-xs">
            👤 Perfil
          </button>
          <button onClick={handleLogout}
            className="btn-ghost px-3 py-2 text-xs">
            Salir
          </button>
        </div>
      </nav>

      {/* Stats bar */}
      <div className="px-4 py-4 border-b" style={{borderColor:'rgba(255,255,255,0.06)', background:'var(--dark-2)'}}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-6">
              <div className="text-center">
                <div className="font-display text-2xl font-black" style={{color:'var(--cyan)'}}>{tengo}</div>
                <div className="text-xs uppercase tracking-wider" style={{color:'var(--text-dim)'}}>Tengo</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl font-black" style={{color:'var(--red)'}}>{mefaltan}</div>
                <div className="text-xs uppercase tracking-wider" style={{color:'var(--text-dim)'}}>Faltan</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl font-black" style={{color:'var(--green)'}}>{repito}</div>
                <div className="text-xs uppercase tracking-wider" style={{color:'var(--text-dim)'}}>Repito</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-black" style={{color:'var(--gold)'}}>{pct}%</div>
              <div className="text-xs uppercase tracking-wider" style={{color:'var(--text-dim)'}}>Completado</div>
            </div>
          </div>
          {/* Barra de progreso */}
          <div className="h-1 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.08)'}}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{width:`${pct}%`, background:`linear-gradient(90deg, var(--cyan), var(--gold))`}} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Instrucción */}
        <p className="text-center text-xs mb-6 tracking-wider uppercase" style={{color:'var(--text-dim)'}}>
          1 toque = tienes · 2 toques = repetida · 3 toques = quitar
        </p>

        {/* Selector de grupos */}
        <div className="mb-4">
          <div className="text-xs uppercase tracking-widest mb-3 font-display" style={{color:'var(--text-dim)'}}>
            Grupos del Mundial
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(GRUPOS).map(g => (
              <button key={g}
                onClick={() => { setGrupoActivo(g); setSeccionActiva(null) }}
                className="grupo-pill"
                style={grupoActivo === g ? {
                  background: COLORES_GRUPO[g],
                  borderColor: COLORES_GRUPO[g],
                  color: '#080C14',
                } : {
                  background: 'transparent',
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: 'var(--text-dim)',
                }}>
                Grupo {g}
              </button>
            ))}
            <button
              onClick={() => { setGrupoActivo('FWC'); setSeccionActiva('FWC') }}
              className="grupo-pill"
              style={grupoActivo === 'FWC' ? {
                background:'var(--gold)', borderColor:'var(--gold)', color:'#080C14'
              } : {
                background:'transparent', borderColor:'rgba(255,255,255,0.15)', color:'var(--text-dim)'
              }}>
              🏆 FIFA WC
            </button>
            <button
              onClick={() => { setGrupoActivo('CC'); setSeccionActiva('CC') }}
              className="grupo-pill"
              style={grupoActivo === 'CC' ? {
                background:'var(--red)', borderColor:'var(--red)', color:'white'
              } : {
                background:'transparent', borderColor:'rgba(255,255,255,0.15)', color:'var(--text-dim)'
              }}>
              🥤 Coca-Cola
            </button>
          </div>
        </div>

        {/* Selector de selección dentro del grupo */}
        {GRUPOS[grupoActivo] && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {GRUPOS[grupoActivo].map(sec => {
              const isActive = seccionFinal === sec
              const color = COLORES_GRUPO[grupoActivo]
              const stickersSec = stickers.filter(s => s.seccion === sec)
              const tieneSec = stickersSec.filter(s => misStickers[s.id]?.quantity >= 1).length
              const pctSec = stickersSec.length > 0 ? Math.round((tieneSec / stickersSec.length) * 100) : 0
              return (
                <button key={sec}
                  onClick={() => setSeccionActiva(sec)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-bold tracking-wide transition-all"
                  style={isActive ? {
                    background: `${color}22`,
                    border: `1px solid ${color}`,
                    color: color,
                  } : {
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-dim)',
                  }}>
                  <span>{PAISES[sec] || sec}</span>
                  <span className="text-xs opacity-60">{pctSec}%</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Grid de figuritas */}
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {stickersFiltrados.map(sticker => {
            const mio = misStickers[sticker.id]
            const quantity = mio?.quantity || 0
            const color = COLORES_GRUPO[grupoActivo] || 'var(--gold)'

            return (
              <button key={sticker.id}
                onClick={() => toggleSticker(sticker)}
                title={`${sticker.jugador}`}
                className={`relative rounded-lg p-2 text-center transition-all hover:scale-105 active:scale-95 ${
                  quantity === 0 ? 'sticker-empty' :
                  quantity >= 2 ? 'sticker-repeat animate-pulse-glow' : 'sticker-have'
                }`}>
                <div className="font-display text-xs font-black"
                  style={{color: quantity === 0 ? 'var(--text-dim)' : quantity >= 2 ? 'var(--green)' : 'var(--cyan)'}}>
                  {sticker.jugador}
                </div>
                {quantity >= 2 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-black"
                    style={{background:'var(--green)', color:'var(--dark)', fontSize:'8px'}}>
                    R
                  </span>
                )}
              </button>
            )
          })}
        </div>

      </div>
    </main>
  )
}
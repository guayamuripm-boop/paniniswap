'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Intercambios() {
  const [user, setUser] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroCiudad, setFiltroCiudad] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      await calcularMatches(session.user.id)
      setLoading(false)
    })
  }, [])

  const calcularMatches = async (userId) => {
    const { data: misStickers } = await supabase
      .from('user_stickers').select('sticker_id, quantity').eq('user_id', userId)
    if (!misStickers || misStickers.length === 0) return

    const tengo = misStickers.filter(s => s.quantity >= 1).map(s => s.sticker_id)
    const repito = misStickers.filter(s => s.quantity >= 2).map(s => s.sticker_id)

    const { data: todosStickers } = await supabase.from('stickers').select('id')
    const todosIds = todosStickers.map(s => s.id)
    const faltanIds = todosIds.filter(id => !tengo.includes(id))

    if (repito.length === 0 && faltanIds.length === 0) return

    const { data: otrosUsers } = await supabase
      .from('user_stickers').select('user_id, sticker_id, quantity').neq('user_id', userId)
    if (!otrosUsers || otrosUsers.length === 0) return

    const porUsuario = {}
    otrosUsers.forEach(s => {
      if (!porUsuario[s.user_id]) porUsuario[s.user_id] = []
      porUsuario[s.user_id].push(s)
    })

    const resultados = []
    for (const [otroUserId, susStickers] of Object.entries(porUsuario)) {
      const elTiene = susStickers.filter(s => s.quantity >= 1).map(s => s.sticker_id)
      const elRepite = susStickers.filter(s => s.quantity >= 2).map(s => s.sticker_id)
      const elFaltan = todosIds.filter(id => !elTiene.includes(id))

      const elMeDa = elRepite.filter(id => faltanIds.includes(id))
      const yoLeDoy = repito.filter(id => elFaltan.includes(id))
      const score = elMeDa.length + yoLeDoy.length

      if (score > 0) {
        const { data: perfil } = await supabase
          .from('profiles').select('full_name, avatar_url, ciudad, telefono')
          .eq('id', otroUserId).single()

        const { data: stickersDame } = await supabase
          .from('stickers').select('numero, jugador, pais')
          .in('id', elMeDa.slice(0, 6))

        const { data: stickersDoy } = await supabase
          .from('stickers').select('numero, jugador, pais')
          .in('id', yoLeDoy.slice(0, 6))

        resultados.push({
          userId: otroUserId,
          nombre: perfil?.full_name || 'Usuario',
          avatar: perfil?.avatar_url,
          ciudad: perfil?.ciudad,
          telefono: perfil?.telefono,
          score,
          elMeDa: stickersDame || [],
          yoLeDoy: stickersDoy || [],
          totalElMeDa: elMeDa.length,
          totalYoLeDoy: yoLeDoy.length,
        })
      }
    }

    resultados.sort((a, b) => b.score - a.score)
    setMatches(resultados)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const matchesFiltrados = matches.filter(m =>
    !filtroCiudad || m.ciudad?.toLowerCase().includes(filtroCiudad.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--dark)'}}>
      <div className="text-center">
        <div className="font-display text-4xl font-black mb-2" style={{color:'var(--gold)'}}>METAXPORT</div>
        <div className="text-sm animate-pulse" style={{color:'var(--text-dim)'}}>Buscando tus matches...</div>
      </div>
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
          <button onClick={() => router.push('/perfil')} className="btn-ghost px-3 py-2 text-xs">👤 Perfil</button>
          <button onClick={handleLogout} className="btn-ghost px-3 py-2 text-xs">Salir</button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-black tracking-tight mb-1" style={{color:'var(--text)'}}>
            MIS <span style={{color:'var(--gold)'}}>INTERCAMBIOS</span>
          </h1>
          <p style={{color:'var(--text-dim)'}}>
            {matches.length > 0 ? `${matches.length} match${matches.length > 1 ? 'es' : ''} encontrado${matches.length > 1 ? 's' : ''}` : 'Marca figuritas para encontrar matches'}
          </p>
        </div>

        {/* Filtro */}
        <div className="mb-6 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color:'var(--text-dim)'}}>🔍</span>
          <input type="text" value={filtroCiudad}
            onChange={e => setFiltroCiudad(e.target.value)}
            placeholder="Filtrar por ciudad..."
            className="w-full pl-9 pr-4 py-3 rounded-lg text-sm outline-none"
            style={{
              background:'var(--dark-3)',
              border:'1px solid rgba(255,255,255,0.08)',
              color:'var(--text)',
            }} />
        </div>

        {matchesFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-display text-xl" style={{color:'var(--text-dim)'}}>No hay matches aún</p>
            <p className="text-sm mt-2 mb-6" style={{color:'var(--text-dim)'}}>Marca más figuritas y asegúrate de tener repetidas</p>
            <button onClick={() => router.push('/album')} className="btn-primary px-6 py-3">
              Ir a mi Álbum
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {matchesFiltrados.map((match) => (
              <div key={match.userId} className="card p-5 animate-fade-up">

                {/* Header del match */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {match.avatar ? (
                      <img src={match.avatar} className="w-11 h-11 rounded-full ring-2"
                        style={{ringColor:'var(--gold)'}} alt="" />
                    ) : (
                      <div className="w-11 h-11 rounded-full flex items-center justify-center font-display font-black text-lg"
                        style={{background:'var(--dark-4)', color:'var(--gold)', border:'1px solid rgba(245,197,24,0.3)'}}>
                        {match.nombre[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-display font-bold tracking-wide" style={{color:'var(--text)'}}>{match.nombre}</p>
                      {match.ciudad && (
                        <p className="text-xs" style={{color:'var(--text-dim)'}}>📍 {match.ciudad}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-center px-4 py-2 rounded-lg"
                    style={{background:'rgba(245,197,24,0.1)', border:'1px solid rgba(245,197,24,0.3)'}}>
                    <div className="font-display text-2xl font-black" style={{color:'var(--gold)'}}>{match.score}</div>
                    <div className="text-xs" style={{color:'var(--text-dim)'}}>figuritas</div>
                  </div>
                </div>

                {/* Lo que te da */}
                {match.elMeDa.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{color:'var(--green)'}}>
                      ✅ Te puede dar ({match.totalElMeDa})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {match.elMeDa.map(s => (
                        <span key={s.jugador} className="text-xs px-2 py-1 rounded"
                          style={{background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.2)', color:'var(--green)'}}>
                          {s.jugador}
                        </span>
                      ))}
                      {match.totalElMeDa > 6 && (
                        <span className="text-xs px-2 py-1" style={{color:'var(--text-dim)'}}>+{match.totalElMeDa - 6} más</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Lo que le das */}
                {match.yoLeDoy.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{color:'var(--cyan)'}}>
                      🔄 Tú le das ({match.totalYoLeDoy})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {match.yoLeDoy.map(s => (
                        <span key={s.jugador} className="text-xs px-2 py-1 rounded"
                          style={{background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.2)', color:'var(--cyan)'}}>
                          {s.jugador}
                        </span>
                      ))}
                      {match.totalYoLeDoy > 6 && (
                        <span className="text-xs px-2 py-1" style={{color:'var(--text-dim)'}}>+{match.totalYoLeDoy - 6} más</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Botón WhatsApp */}
                {match.telefono ? (
                  <a href={`https://wa.me/${match.telefono}?text=Hola%20${encodeURIComponent(match.nombre.split(' ')[0])}!%20Te%20escribo%20desde%20MetaXport.%20Podemos%20intercambiar%20${match.score}%20figuritas%20del%20Mundial%202026!%20%F0%9F%8F%86`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full py-3 rounded-lg text-center font-display font-bold tracking-wide text-sm block transition-all hover:opacity-90"
                    style={{background:'linear-gradient(135deg, #25D366, #128C7E)', color:'white'}}>
                    💬 Contactar por WhatsApp
                  </a>
                ) : (
                  <div className="w-full py-3 rounded-lg text-center text-sm"
                    style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--text-dim)'}}>
                    📵 Sin WhatsApp registrado
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
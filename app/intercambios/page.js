'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Intercambios() {
  const [user, setUser]       = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
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
    // 1. Mis barajitas que tengo (quantity >= 1)
    const { data: misStickers } = await supabase
      .from('user_stickers')
      .select('sticker_id, quantity')
      .eq('user_id', userId)

    if (!misStickers || misStickers.length === 0) return

    const tengo    = misStickers.filter(s => s.quantity >= 1).map(s => s.sticker_id)
    const repito   = misStickers.filter(s => s.quantity >= 2).map(s => s.sticker_id)
    const mefaltan = [] // las que no tengo

    // 2. Todos los stickers existentes para saber cuáles me faltan
    const { data: todosStickers } = await supabase
      .from('stickers')
      .select('id')

    const todosIds = todosStickers.map(s => s.id)
    const faltanIds = todosIds.filter(id => !tengo.includes(id))

    if (repito.length === 0 && faltanIds.length === 0) return

    // 3. Todos los demás usuarios
    const { data: otrosUsers } = await supabase
      .from('user_stickers')
      .select('user_id, sticker_id, quantity')
      .neq('user_id', userId)

    if (!otrosUsers || otrosUsers.length === 0) return

    // 4. Agrupar por usuario
    const porUsuario = {}
    otrosUsers.forEach(s => {
      if (!porUsuario[s.user_id]) porUsuario[s.user_id] = []
      porUsuario[s.user_id].push(s)
    })

    // 5. Calcular match para cada usuario
    const resultados = []
    for (const [otroUserId, susStickers] of Object.entries(porUsuario)) {
      const elTiene  = susStickers.filter(s => s.quantity >= 1).map(s => s.sticker_id)
      const elRepite = susStickers.filter(s => s.quantity >= 2).map(s => s.sticker_id)
      const elFaltan = todosIds.filter(id => !elTiene.includes(id))

      // Lo que él me puede dar (él repite y yo necesito)
      const elMeDa = elRepite.filter(id => faltanIds.includes(id))
      // Lo que yo le puedo dar (yo repito y él necesita)
      const yoLeDoy = repito.filter(id => elFaltan.includes(id))

      const score = elMeDa.length + yoLeDoy.length

      if (score > 0) {
        // Buscar perfil del otro usuario
        const { data: perfil } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, ciudad')
          .eq('id', otroUserId)
          .single()

        // Buscar nombres de las barajitas
        const { data: stickersDame } = await supabase
          .from('stickers')
          .select('numero, jugador, pais')
          .in('id', elMeDa.slice(0, 5))

        const { data: stickersDoy } = await supabase
          .from('stickers')
          .select('numero, jugador, pais')
          .in('id', yoLeDoy.slice(0, 5))

        resultados.push({
          userId: otroUserId,
          nombre: perfil?.full_name || 'Usuario',
          avatar: perfil?.avatar_url,
          ciudad: perfil?.ciudad,
          score,
          elMeDa: stickersDame || [],
          yoLeDoy: stickersDoy || [],
          totalElMeDa: elMeDa.length,
          totalYoLeDoy: yoLeDoy.length,
        })
      }
    }

    // 6. Ordenar por score descendente
    resultados.sort((a, b) => b.score - a.score)
    setMatches(resultados)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center">
      <p className="text-white text-2xl animate-pulse">Buscando tus matches...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚽</span>
          <span className="text-lg font-black">PaniniSwap</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/album')}
            className="bg-blue-700 hover:bg-blue-600 px-3 py-1.5 rounded-lg text-sm transition-colors">
            Mi Album
          </button>
          <button onClick={handleLogout}
            className="bg-blue-700 hover:bg-blue-600 px-3 py-1.5 rounded-lg text-sm transition-colors">
            Salir
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-blue-900 mb-2">Mis Intercambios</h1>
        <p className="text-gray-500 mb-8">
          Personas con las que puedes intercambiar barajitas ahora mismo
        </p>

        {matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">No hay matches todavía.</p>
            <p className="text-gray-400 text-sm mt-2">
              Marca más barajitas en tu album y asegúrate de tener repetidas.
            </p>
            <button onClick={() => router.push('/album')}
              className="mt-6 bg-blue-900 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-800 transition-colors">
              Ir a mi Album
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {matches.map((match, i) => (
              <div key={match.userId}
                className="bg-white rounded-2xl shadow p-6 border border-gray-100">

                {/* Header del match */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {match.avatar ? (
                      <img src={match.avatar} className="w-12 h-12 rounded-full" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-black text-lg">
                        {match.nombre[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-black text-gray-800">{match.nombre}</p>
                      {match.ciudad && (
                        <p className="text-gray-400 text-sm">📍 {match.ciudad}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-center bg-blue-900 text-white rounded-xl px-4 py-2">
                    <div className="text-2xl font-black">{match.score}</div>
                    <div className="text-xs text-blue-300">barajitas</div>
                  </div>
                </div>

                {/* Lo que él te da */}
                {match.elMeDa.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-green-600 mb-1">
                      ✅ {match.nombre.split(' ')[0]} te puede dar ({match.totalElMeDa}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {match.elMeDa.map(s => (
                        <span key={s.id}
                          className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">
                          #{s.numero} {s.jugador}
                        </span>
                      ))}
                      {match.totalElMeDa > 5 && (
                        <span className="text-gray-400 text-xs px-2 py-0.5">
                          +{match.totalElMeDa - 5} más
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Lo que tú le das */}
                {match.yoLeDoy.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-blue-600 mb-1">
                      🔄 Tú le puedes dar ({match.totalYoLeDoy}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {match.yoLeDoy.map(s => (
                        <span key={s.id}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                          #{s.numero} {s.jugador}
                        </span>
                      ))}
                      {match.totalYoLeDoy > 5 && (
                        <span className="text-gray-400 text-xs px-2 py-0.5">
                          +{match.totalYoLeDoy - 5} más
                        </span>
                      )}
                    </div>
                  </div>
                )}

               {/* Botón de contacto */}
                
              <a href={`https://wa.me/?text=Hola! Te escribo desde PaniniSwap. Podemos intercambiar ${match.score} barajitas del album Mundial 2026. Yo te doy las que necesitas y tú me das las que me faltan. Entra a https://paniniswap-6hlt.vercel.app para verlo!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-center block transition-colors">
                  💬 Contactar por WhatsApp
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
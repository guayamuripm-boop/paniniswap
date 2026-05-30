'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const COLORES_SECCION = {
  'PORTADA':   'bg-yellow-100 border-yellow-400',
  'ESTADIOS':  'bg-purple-100 border-purple-400',
  'ESCUDOS':   'bg-gray-100 border-gray-400',
  'ESPAÑA':    'bg-red-100 border-red-400',
  'FRANCIA':   'bg-blue-100 border-blue-400',
  'BRASIL':    'bg-green-100 border-green-400',
  'ARGENTINA': 'bg-sky-100 border-sky-400',
  'INGLATERRA':'bg-rose-100 border-rose-400',
  'ITALIA':    'bg-blue-100 border-blue-400',
  'ALEMANIA':  'bg-gray-100 border-gray-400',
  'PORTUGAL':  'bg-red-100 border-red-400',
  'NORUEGA':   'bg-red-100 border-red-400',
  'MEXICO':    'bg-green-100 border-green-400',
  'CANADA':    'bg-red-100 border-red-400',
}

export default function Album() {
  const [user, setUser]           = useState(null)
  const [stickers, setStickers]   = useState([])
  const [misStickers, setMisStickers] = useState({})
  const [seccionActiva, setSeccionActiva] = useState('TODOS')
  const [loading, setLoading]     = useState(true)
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
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()
    if (!data) {
      await supabase.from('profiles').insert({
        id: user.id,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
      })
    }
  }

  const cargarStickers = async (userId) => {
    const { data: todos } = await supabase
      .from('stickers')
      .select('*')
      .order('numero')

    const { data: mios } = await supabase
      .from('user_stickers')
      .select('*')
      .eq('user_id', userId)

    const mapa = {}
    if (mios) mios.forEach(s => { mapa[s.sticker_id] = s })
    setStickers(todos || [])
    setMisStickers(mapa)
  }

  const toggleSticker = async (sticker) => {
    const userId = user.id
    const actual = misStickers[sticker.id]

    if (!actual) {
      // No la tiene — marcar como que tiene 1
      const { data } = await supabase
        .from('user_stickers')
        .insert({ user_id: userId, sticker_id: sticker.id, quantity: 1, wanted: false })
        .select().single()
      setMisStickers(prev => ({ ...prev, [sticker.id]: data }))
    } else if (actual.quantity === 1) {
      // Tiene 1 — pasar a repetida (2)
      const { data } = await supabase
        .from('user_stickers')
        .update({ quantity: 2 })
        .eq('id', actual.id)
        .select().single()
      setMisStickers(prev => ({ ...prev, [sticker.id]: data }))
    } else {
      // Tiene repetida — quitar
      await supabase.from('user_stickers').delete().eq('id', actual.id)
      setMisStickers(prev => {
        const nuevo = { ...prev }
        delete nuevo[sticker.id]
        return nuevo
      })
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const secciones = ['TODOS', ...new Set(stickers.map(s => s.seccion))]
  const filtrados = seccionActiva === 'TODOS'
    ? stickers
    : stickers.filter(s => s.seccion === seccionActiva)

  const tengo   = Object.values(misStickers).filter(s => s.quantity >= 1).length
  const repito  = Object.values(misStickers).filter(s => s.quantity >= 2).length
  const mefaltan = stickers.length - tengo

  if (loading) return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center">
      <p className="text-white text-2xl animate-pulse">Cargando tu album...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚽</span>
          <span className="text-lg font-black">MetaXport</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-blue-200 text-sm hidden md:block">
            {user?.user_metadata?.full_name}
          </span>
          <button onClick={() => router.push('/intercambios')}
  className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-lg text-sm transition-colors font-bold">
  🔄 Intercambios
</button>
          <button onClick={handleLogout}
            className="bg-blue-700 hover:bg-blue-600 px-3 py-1.5 rounded-lg text-sm transition-colors">
            Salir
          </button>
        </div>
      </nav>

      {/* Stats */}
      <div className="bg-blue-800 text-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex gap-6 justify-center">
          <div className="text-center">
            <div className="text-2xl font-black">{tengo}</div>
            <div className="text-blue-300 text-xs">Tengo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-red-300">{mefaltan}</div>
            <div className="text-blue-300 text-xs">Me faltan</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-green-300">{repito}</div>
            <div className="text-blue-300 text-xs">Repito</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-yellow-300">{stickers.length}</div>
            <div className="text-blue-300 text-xs">Total</div>
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-2">
        <p className="text-gray-500 text-sm text-center">
          1 clic = la tienes &nbsp;·&nbsp; 2 clics = repetida &nbsp;·&nbsp; 3 clics = quitar
        </p>
      </div>

      {/* Filtros por sección */}
      <div className="max-w-5xl mx-auto px-4 py-3 flex gap-2 flex-wrap justify-center">
        {secciones.map(s => (
          <button key={s}
            onClick={() => setSeccionActiva(s)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
              seccionActiva === s
                ? 'bg-blue-900 text-white border-blue-900'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {/* Grid de barajitas */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {filtrados.map(sticker => {
            const mio = misStickers[sticker.id]
            const quantity = mio?.quantity || 0
            const colorBase = COLORES_SECCION[sticker.seccion] || 'bg-white border-gray-300'

            return (
              <button
                key={sticker.id}
                onClick={() => toggleSticker(sticker)}
                title={`#${sticker.numero} ${sticker.jugador}`}
                className={`
                  relative border-2 rounded-xl p-1 text-center transition-all hover:scale-105 active:scale-95
                  ${quantity === 0 ? 'bg-white border-gray-200 opacity-40' : colorBase}
                  ${quantity >= 2 ? 'ring-2 ring-green-400' : ''}
                `}
              >
                <div className="text-xs font-black text-gray-700">#{sticker.numero}</div>
                <div className="text-xs text-gray-500 truncate leading-tight mt-0.5" style={{fontSize:'9px'}}>
                  {sticker.jugador.split(' ')[0]}
                </div>
                {quantity >= 2 && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold" style={{fontSize:'9px'}}>
                    R
                  </span>
                )}
                {quantity >= 1 && (
                  <div className="absolute inset-0 rounded-xl bg-blue-900 opacity-10" />
                )}
              </button>
            )
          })}
        </div>
      </div>

    </main>
  )
}
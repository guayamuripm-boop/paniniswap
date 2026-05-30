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
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚽</span>
          <span className="text-lg font-black">Metaxport</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/album')}
            className="bg-blue-700 hover:bg-blue-600 px-3 py-1.5 rounded-lg text-sm transition-colors">
            Mi Album
          </button>
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

      <div className="max-w-lg mx-auto px-4 py-10">

        {/* Avatar y nombre */}
        <div className="text-center mb-8">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url}
              className="w-24 h-24 rounded-full mx-auto mb-4 shadow-lg" alt="" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-200 mx-auto mb-4 flex items-center justify-center text-blue-900 text-4xl font-black">
              {perfil.full_name?.[0] || '?'}
            </div>
          )}
          <h1 className="text-2xl font-black text-blue-900">{perfil.full_name}</h1>
          <p className="text-gray-400 text-sm">{user?.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow text-center">
            <div className="text-2xl font-black text-blue-900">{stats.tengo}</div>
            <div className="text-gray-400 text-xs mt-1">Tengo</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow text-center">
            <div className="text-2xl font-black text-red-400">{stats.mefaltan}</div>
            <div className="text-gray-400 text-xs mt-1">Me faltan</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow text-center">
            <div className="text-2xl font-black text-green-500">{stats.repito}</div>
            <div className="text-gray-400 text-xs mt-1">Repito</div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-black text-gray-800 mb-4">Editar perfil</h2>

          <div className="mb-4">
            <label className="text-sm font-bold text-gray-600 block mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={perfil.full_name}
              onChange={e => setPerfil(p => ({ ...p, full_name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-400 transition-colors"
              placeholder="Tu nombre"
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-bold text-gray-600 block mb-1">
              Ciudad 📍
            </label>
            <input
              type="text"
              value={perfil.ciudad}
              onChange={e => setPerfil(p => ({ ...p, ciudad: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-400 transition-colors"
              placeholder="Ej: Caracas, Bogotá, Madrid..."
            />
            <p className="text-gray-400 text-xs mt-1">
              Tu ciudad aparece en los matches para facilitar intercambios presenciales
            </p>
            <div className="mb-6">
            <label className="text-sm font-bold text-gray-600 block mb-1">
              WhatsApp 📱
            </label>
            <div className="flex">
              <span className="bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl px-3 flex items-center text-gray-500 text-sm">
                +
              </span>
              <input
                type="tel"
                value={perfil.telefono}
                onChange={e => setPerfil(p => ({ ...p, telefono: e.target.value.replace(/\D/g, '') }))}
                className="flex-1 border border-gray-200 rounded-r-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-400 transition-colors"
                placeholder="584121234567 (sin + ni espacios)"
              />
            </div>
            <p className="text-gray-400 text-xs mt-1">
              Código de país + número. Ej Venezuela: 584121234567
            </p>
          </div>
          </div>

          {mensaje && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-bold text-center ${
              mensaje.includes('Error') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
            }`}>
              {mensaje}
            </div>
          )}

          <button
            onClick={guardarPerfil}
            disabled={guardando}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
            {guardando ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </div>
      </div>
    </main>
  )
}
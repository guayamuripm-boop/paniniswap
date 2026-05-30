'use client'
import { supabase } from '../lib/supabase'

export default function Home() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 flex items-center justify-center">
      <div className="text-center text-white px-6">
        <div className="text-8xl mb-6">⚽</div>
        <h1 className="text-6xl font-black mb-4 tracking-tight">
          PaniniSwap
        </h1>
        <p className="text-2xl font-light mb-2 text-blue-200">
          Album Digital del Mundial 2026
        </p>
        <p className="text-lg text-blue-300 mb-12 max-w-md mx-auto">
          Marca tus barajitas, encuentra a quien tiene las que te faltan e intercambia al instante.
        </p>
        <button
          onClick={handleLogin}
          className="bg-white text-blue-900 font-bold text-lg px-10 py-4 rounded-full hover:bg-blue-50 transition-all shadow-2xl hover:scale-105"
        >
          Entrar con Google
        </button>
        <p className="mt-6 text-blue-400 text-sm">
          Gratis para el Mundial 2026
        </p>
      </div>
    </main>
  )
}
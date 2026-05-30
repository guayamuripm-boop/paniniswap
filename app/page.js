'use client'
import { supabase } from '../lib/supabase'

export default function Home() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <main className="min-h-screen bg-grid overflow-hidden relative" style={{background:'var(--dark)'}}>
      
      {/* Orbs de fondo */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{background:'radial-gradient(circle, #F5C518 0%, transparent 70%)', filter:'blur(80px)'}} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none"
        style={{background:'radial-gradient(circle, #00D4FF 0%, transparent 70%)', filter:'blur(80px)'}} />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10 pointer-events-none"
        style={{background:'radial-gradient(circle, #00FF88 0%, transparent 70%)', filter:'blur(60px)'}} />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      {/* Contenido */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full animate-fade-up"
          style={{background:'rgba(245,197,24,0.1)', border:'1px solid rgba(245,197,24,0.3)'}}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="font-display text-xs tracking-widest uppercase" style={{color:'var(--gold)'}}>
            FIFA World Cup 2026 · USA · México · Canadá
          </span>
        </div>

        {/* Logo */}
        <h1 className="font-display text-[80px] md:text-[120px] font-black leading-none tracking-tight mb-2 animate-fade-up text-glow-gold"
          style={{color:'var(--gold)', animationDelay:'0.1s'}}>
          META
          <span style={{color:'var(--text)'}}>XPORT</span>
        </h1>

        <p className="font-display text-xl md:text-2xl tracking-widest uppercase mb-4 animate-fade-up"
          style={{color:'var(--text-dim)', animationDelay:'0.2s'}}>
          El álbum del mundial · Reinventado
        </p>

        <p className="max-w-md text-base mb-12 leading-relaxed animate-fade-up"
          style={{color:'var(--text-dim)', animationDelay:'0.3s'}}>
          Marca tus figuritas, encuentra tu match perfecto e intercambia con otros coleccionistas al instante.
        </p>

        {/* CTA */}
        <button onClick={handleLogin}
          className="btn-primary px-10 py-4 text-lg animate-fade-up"
          style={{animationDelay:'0.4s'}}>
          ⚽ Entrar con Google
        </button>

        <p className="mt-6 text-xs animate-fade-up" style={{color:'var(--text-dim)', animationDelay:'0.5s'}}>
          Gratis durante el Mundial 2026
        </p>

        {/* Stats decorativos */}
        <div className="mt-16 grid grid-cols-3 gap-8 animate-fade-up" style={{animationDelay:'0.6s'}}>
          {[
            {n:'993', label:'Figuritas'},
            {n:'48', label:'Selecciones'},
            {n:'12', label:'Grupos'},
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl font-black" style={{color:'var(--gold)'}}>{s.n}</div>
              <div className="text-xs uppercase tracking-widest mt-1" style={{color:'var(--text-dim)'}}>{s.label}</div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
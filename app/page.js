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
    <main style={{background:'var(--bg)', minHeight:'100vh', overflow:'hidden', position:'relative'}}>

      {/* Orbs */}
      <div className="orb" style={{width:500,height:500,background:'rgba(232,54,61,0.12)',top:'-100px',left:'-100px'}} />
      <div className="orb" style={{width:400,height:400,background:'rgba(0,180,216,0.1)',top:'20%',right:'-80px'}} />
      <div className="orb" style={{width:300,height:300,background:'rgba(245,197,24,0.08)',bottom:'10%',left:'30%'}} />

      {/* Grid sutil */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize:'60px 60px'
      }} />

      <div style={{position:'relative', zIndex:10, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', textAlign:'center'}}>

        {/* Live badge */}
        <div className="anim-up" style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'6px 16px', borderRadius:50,
          background:'rgba(59,178,115,0.1)', border:'1px solid rgba(59,178,115,0.25)',
          marginBottom:32
        }}>
          <span style={{width:6,height:6,borderRadius:'50%',background:'#3BB273',display:'inline-block',animation:'pulse 2s infinite'}} />
          <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.12em',color:'#3BB273',textTransform:'uppercase'}}>
            Mundial 2026 · 11 Jun – 19 Jul
          </span>
        </div>

        {/* Logo principal */}
        <div className="anim-up-1">
          <h1 style={{
            fontFamily:'Syne, sans-serif',
            fontSize:'clamp(56px, 12vw, 100px)',
            fontWeight:800,
            lineHeight:1,
            letterSpacing:'-0.02em',
            marginBottom:8,
          }}>
            <span style={{
              background:'linear-gradient(135deg, #E8363D 0%, #F47B20 40%, #F5C518 70%, #3BB273 100%)',
              WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent',
            }}>Meta</span>
            <span style={{color:'white'}}>Xport</span>
          </h1>
          <p style={{fontSize:'clamp(13px,2vw,16px)', color:'var(--text2)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:24}}>
            El álbum del mundial · Reinventado
          </p>
        </div>

        {/* Descripción */}
        <p className="anim-up-2" style={{
          maxWidth:440, fontSize:16, lineHeight:1.7,
          color:'var(--text2)', marginBottom:40
        }}>
          Marca tus figuritas, encuentra tu <strong style={{color:'var(--text)'}}>match perfecto</strong> y coordina intercambios con coleccionistas cerca de ti.
        </p>

        {/* CTA */}
        <button onClick={handleLogin} className="btn btn-primary anim-up-3"
          style={{padding:'14px 32px', fontSize:15, borderRadius:14}}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.12 14.01 17.64 11.92 17.64 9.2z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Entrar con Google
        </button>

        <p className="anim-up-4" style={{marginTop:16, fontSize:12, color:'var(--text3)'}}>
          Gratis · Sin tarjeta · Solo durante el Mundial 2026
        </p>

        {/* Stats */}
        <div className="anim-up-5" style={{
          display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16,
          marginTop:56, width:'100%', maxWidth:360
        }}>
          {[
            {n:'993', label:'Figuritas', color:'#E8363D'},
            {n:'48', label:'Selecciones', color:'#00B4D8'},
            {n:'12', label:'Grupos', color:'#3BB273'},
          ].map(s => (
            <div key={s.label} style={{
              background:'rgba(255,255,255,0.03)',
              border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:16, padding:'16px 8px', textAlign:'center'
            }}>
              <div style={{fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:800, color:s.color}}>{s.n}</div>
              <div style={{fontSize:11, color:'var(--text3)', marginTop:4, textTransform:'uppercase', letterSpacing:'0.08em'}}>{s.label}</div>
            </div>
          ))}
        </div>

      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </main>
  )
}
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
    <main style={{minHeight:'100vh',background:'var(--bg)'}}>
            {/* Bottom Nav */}
            <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(6,8,16,0.92)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 0 max(10px, env(safe-area-inset-bottom))',
        display: 'flex', justifyContent: 'space-around'
      }}>
        {[
          { icon: '📒', label: 'Álbum', path: '/album' },
          { icon: '🔄', label: 'Swaps', path: '/intercambios' },
          { icon: '📊', label: 'Análisis', path: '/analisis' },
          { icon: '👤', label: 'Perfil', path: '/perfil', active: true },
        ].map(item => (
          <button key={item.path} onClick={() => router.push(item.path)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 16px', color: item.active ? '#0EA5E9' : 'var(--text3)' }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
      </div>

      <div style={{maxWidth:480,margin:'0 auto',padding:'32px 16px'}}>

        {/* Avatar */}
        <div style={{textAlign:'center',marginBottom:32}}>
          {user?.user_metadata?.avatar_url?(
            <img src={user.user_metadata.avatar_url}
              style={{width:88,height:88,borderRadius:'50%',margin:'0 auto 12px',display:'block',border:'3px solid rgba(255,255,255,0.1)'}} alt=""/>
          ):(
            <div style={{
              width:88,height:88,borderRadius:'50%',margin:'0 auto 12px',
              background:'linear-gradient(135deg,#E8363D,#F47B20)',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontFamily:'Syne',fontWeight:800,fontSize:32,color:'white'
            }}>{perfil.full_name?.[0]||'?'}</div>
          )}
          <h1 style={{fontFamily:'Syne',fontSize:22,fontWeight:800}}>{perfil.full_name}</h1>
          <p style={{fontSize:13,color:'var(--text2)',marginTop:4}}>{user?.email}</p>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:28}}>
          {[
            {n:stats.tengo,label:'Tengo',color:'#00B4D8'},
            {n:stats.mefaltan,label:'Faltan',color:'#E8363D'},
            {n:stats.repito,label:'Repito',color:'#3BB273'},
          ].map(s=>(
            <div key={s.label} style={{
              background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:16,padding:'16px 8px',textAlign:'center'
            }}>
              <div style={{fontFamily:'Syne',fontSize:24,fontWeight:800,color:s.color}}>{s.n}</div>
              <div style={{fontSize:11,color:'var(--text3)',marginTop:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:20,padding:24}}>
          <h2 style={{fontFamily:'Syne',fontSize:16,fontWeight:800,marginBottom:20,color:'white'}}>Editar perfil</h2>

          {[
            {key:'full_name',label:'Nombre',placeholder:'Tu nombre',type:'text'},
            {key:'ciudad',label:'Ciudad 📍',placeholder:'Ej: Caracas, Bogotá...',type:'text'},
            {key:'telefono',label:'WhatsApp 📱',placeholder:'584121234567',type:'tel'},
          ].map(f=>(
            <div key={f.key} style={{marginBottom:16}}>
              <label style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text2)',display:'block',marginBottom:8}}>
                {f.label}
              </label>
              <input type={f.type} className="input-field"
                value={perfil[f.key]||''}
                onChange={e=>setPerfil(p=>({...p,[f.key]:e.target.value}))}
                placeholder={f.placeholder}/>
            </div>
          ))}

          {mensaje&&(
            <div style={{
              padding:'10px 14px',borderRadius:10,fontSize:13,fontWeight:600,textAlign:'center',marginBottom:16,
              background:mensaje.includes('Error')?'rgba(232,54,61,0.1)':'rgba(59,178,115,0.1)',
              border:`1px solid ${mensaje.includes('Error')?'rgba(232,54,61,0.25)':'rgba(59,178,115,0.25)'}`,
              color:mensaje.includes('Error')?'#E8363D':'#3BB273'
            }}>{mensaje}</div>
          )}

          <button className="btn btn-primary" style={{width:'100%',padding:'13px',fontSize:14}}
            onClick={guardarPerfil} disabled={guardando}>
            {guardando?'Guardando...':'Guardar perfil'}
          </button>
        </div>
      </div>
    </main>
  )
}

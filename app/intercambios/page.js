'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Intercambios() {
  const [user,setUser]=useState(null)
  const [matches,setMatches]=useState([])
  const [loading,setLoading]=useState(true)
  const [filtro,setFiltro]=useState('')
  const router=useRouter()

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(!session){router.push('/');return}
      setUser(session.user)
      await calcular(session.user.id)
      setLoading(false)
    })
  },[])

  const calcular=async(uid)=>{
    const{data:mis}=await supabase.from('user_stickers').select('sticker_id,quantity').eq('user_id',uid)
    if(!mis||mis.length===0)return
    const tengo=mis.filter(s=>s.quantity>=1).map(s=>s.sticker_id)
    const repito=mis.filter(s=>s.quantity>=2).map(s=>s.sticker_id)
    const{data:todos}=await supabase.from('stickers').select('id')
    const todosIds=todos.map(s=>s.id)
    const faltan=todosIds.filter(id=>!tengo.includes(id))
    if(repito.length===0&&faltan.length===0)return
    const{data:otros}=await supabase.from('user_stickers').select('user_id,sticker_id,quantity').neq('user_id',uid)
    if(!otros||otros.length===0)return
    const porUser={}
    otros.forEach(s=>{if(!porUser[s.user_id])porUser[s.user_id]=[];porUser[s.user_id].push(s)})
    const res=[]
    for(const[oId,sus]of Object.entries(porUser)){
      const elTiene=sus.filter(s=>s.quantity>=1).map(s=>s.sticker_id)
      const elRep=sus.filter(s=>s.quantity>=2).map(s=>s.sticker_id)
      const elFal=todosIds.filter(id=>!elTiene.includes(id))
      const dame=elRep.filter(id=>faltan.includes(id))
      const doy=repito.filter(id=>elFal.includes(id))
      const score=dame.length+doy.length
      if(score>0){
        const{data:p}=await supabase.from('profiles').select('full_name,avatar_url,ciudad,telefono').eq('id',oId).single()
        const{data:sd}=await supabase.from('stickers').select('jugador').in('id',dame.slice(0,5))
        const{data:sg}=await supabase.from('stickers').select('jugador').in('id',doy.slice(0,5))
        res.push({userId:oId,nombre:p?.full_name||'Usuario',avatar:p?.avatar_url,ciudad:p?.ciudad,telefono:p?.telefono,score,dame:sd||[],doy:sg||[],totalDame:dame.length,totalDoy:doy.length})
      }
    }
    res.sort((a,b)=>b.score-a.score)
    setMatches(res)
  }

  const filtrados=matches.filter(m=>!filtro||m.ciudad?.toLowerCase().includes(filtro.toLowerCase()))

  if(loading) return(
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontFamily:'Syne',fontSize:28,fontWeight:800,background:'linear-gradient(135deg,#E8363D,#F5C518)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>MetaXport</div>
        <div style={{color:'var(--text2)',fontSize:13,marginTop:8}}>Buscando matches...</div>
      </div>
    </div>
  )

  return(
    <main style={{minHeight:'100vh',background:'var(--bg)'}}>
      <nav className="navbar" style={{position:'sticky',top:0,zIndex:50,padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontFamily:'Syne',fontSize:18,fontWeight:800}}>
          <span style={{background:'linear-gradient(135deg,#E8363D,#F47B20)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Meta</span>
          <span style={{color:'white'}}>Xport</span>
        </span>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-ghost" style={{padding:'7px 14px'}} onClick={()=>router.push('/album')}>📒 Álbum</button>
          <button className="btn btn-ghost" style={{padding:'7px 14px'}} onClick={()=>router.push('/perfil')}>👤 Perfil</button>
        </div>
      </nav>

      <div style={{maxWidth:600,margin:'0 auto',padding:'24px 16px'}}>

        {/* Header */}
        <div style={{marginBottom:24}} className="anim-up">
          <h1 style={{fontFamily:'Syne',fontSize:28,fontWeight:800,marginBottom:4}}>
            Mis <span style={{background:'linear-gradient(135deg,#E8363D,#F47B20)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Intercambios</span>
          </h1>
          <p style={{color:'var(--text2)',fontSize:14}}>
            {matches.length>0?`${matches.length} match${matches.length>1?'es':''} encontrado${matches.length>1?'s':''}`:'Marca figuritas para encontrar matches'}
          </p>
        </div>

        {/* Filtro ciudad */}
        <div style={{position:'relative',marginBottom:20}}>
          <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--text3)',fontSize:14}}>🔍</span>
          <input className="input-field" style={{paddingLeft:38}} placeholder="Filtrar por ciudad..."
            value={filtro} onChange={e=>setFiltro(e.target.value)} />
        </div>

        {filtrados.length===0?(
          <div style={{textAlign:'center',padding:'60px 20px'}}>
            <div style={{fontSize:48,marginBottom:16}}>🔍</div>
            <p style={{fontFamily:'Syne',fontSize:18,fontWeight:700,color:'var(--text2)',marginBottom:8}}>Sin matches aún</p>
            <p style={{color:'var(--text3)',fontSize:14,marginBottom:24}}>Marca más figuritas y agrega algunas como repetidas</p>
            <button className="btn btn-primary" style={{padding:'12px 24px',fontSize:14}} onClick={()=>router.push('/album')}>
              Ir a mi Álbum
            </button>
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {filtrados.map((m,i)=>(
              <div key={m.userId} className="match-card anim-up" style={{animationDelay:`${i*0.05}s`}}>

                {/* Header */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    {m.avatar?(
                      <img src={m.avatar} style={{width:44,height:44,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.1)'}} alt=""/>
                    ):(
                      <div style={{
                        width:44,height:44,borderRadius:'50%',
                        background:'linear-gradient(135deg,#E8363D,#F47B20)',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontFamily:'Syne',fontWeight:800,fontSize:18,color:'white'
                      }}>{m.nombre[0]}</div>
                    )}
                    <div>
                      <div style={{fontWeight:700,fontSize:15,color:'white'}}>{m.nombre}</div>
                      {m.ciudad&&<div style={{fontSize:12,color:'var(--text2)',marginTop:1}}>📍 {m.ciudad}</div>}
                    </div>
                  </div>
                  <div style={{
                    padding:'8px 14px',borderRadius:12,textAlign:'center',
                    background:'rgba(245,197,24,0.1)',border:'1px solid rgba(245,197,24,0.2)'
                  }}>
                    <div style={{fontFamily:'Syne',fontSize:22,fontWeight:800,color:'#F5C518',lineHeight:1}}>{m.score}</div>
                    <div style={{fontSize:9,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',marginTop:1}}>figuritas</div>
                  </div>
                </div>

                {/* Figuritas que te da */}
                {m.dame.length>0&&(
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#3BB273',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>
                      ✅ Te puede dar ({m.totalDame})
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {m.dame.map(s=>(
                        <span key={s.jugador} className="badge badge-green">{s.jugador}</span>
                      ))}
                      {m.totalDame>5&&<span style={{fontSize:11,color:'var(--text3)',alignSelf:'center'}}>+{m.totalDame-5} más</span>}
                    </div>
                  </div>
                )}

                {/* Figuritas que le das */}
                {m.doy.length>0&&(
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#00B4D8',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>
                      🔄 Tú le das ({m.totalDoy})
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {m.doy.map(s=>(
                        <span key={s.jugador} className="badge badge-teal">{s.jugador}</span>
                      ))}
                      {m.totalDoy>5&&<span style={{fontSize:11,color:'var(--text3)',alignSelf:'center'}}>+{m.totalDoy-5} más</span>}
                    </div>
                  </div>
                )}

                {/* WhatsApp */}
                {m.telefono?(
                  <a href={`https://wa.me/${m.telefono}?text=Hola%20${encodeURIComponent(m.nombre.split(' ')[0])}!%20Te%20escribo%20desde%20MetaXport.%20Podemos%20intercambiar%20${m.score}%20figuritas%20del%20Mundial%202026!%20%F0%9F%8F%86`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                      width:'100%',padding:'11px',borderRadius:12,
                      background:'linear-gradient(135deg,#25D366,#128C7E)',
                      color:'white',fontWeight:700,fontSize:14,textDecoration:'none',
                      transition:'opacity 0.2s'
                    }}
                    onMouseOver={e=>e.currentTarget.style.opacity='0.9'}
                    onMouseOut={e=>e.currentTarget.style.opacity='1'}>
                    💬 Contactar por WhatsApp
                  </a>
                ):(
                  <div style={{
                    padding:'11px',borderRadius:12,textAlign:'center',fontSize:13,
                    background:'rgba(255,255,255,0.03)',color:'var(--text3)',
                    border:'1px solid rgba(255,255,255,0.06)'
                  }}>
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
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const GRUPOS = {
  A:['MEX','RSA','KOR','CZE'], B:['CAN','BIH','QAT','SUI'],
  C:['BRA','MAR','HAI','SCO'], D:['USA','PAR','AUS','TUR'],
  E:['GER','CUW','CIV','ECU'], F:['NED','JPN','SWE','TUN'],
  G:['BEL','EGY','IRN','NZL'], H:['ESP','CPV','KSA','URU'],
  I:['FRA','SEN','IRQ','NOR'], J:['ARG','ALG','AUT','JOR'],
  K:['POR','COD','UZB','COL'], L:['ENG','CRO','GHA','PAN'],
}
const PAISES = {
  MEX:'🇲🇽 México',RSA:'🇿🇦 Sudáfrica',KOR:'🇰🇷 Corea del Sur',CZE:'🇨🇿 Rep. Checa',
  CAN:'🇨🇦 Canadá',BIH:'🇧🇦 Bosnia',QAT:'🇶🇦 Qatar',SUI:'🇨🇭 Suiza',
  BRA:'🇧🇷 Brasil',MAR:'🇲🇦 Marruecos',HAI:'🇭🇹 Haití',SCO:'🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia',
  USA:'🇺🇸 USA',PAR:'🇵🇾 Paraguay',AUS:'🇦🇺 Australia',TUR:'🇹🇷 Turquía',
  GER:'🇩🇪 Alemania',CUW:'🇨🇼 Curazao',CIV:'🇨🇮 Costa de Marfil',ECU:'🇪🇨 Ecuador',
  NED:'🇳🇱 Holanda',JPN:'🇯🇵 Japón',SWE:'🇸🇪 Suecia',TUN:'🇹🇳 Túnez',
  BEL:'🇧🇪 Bélgica',EGY:'🇪🇬 Egipto',IRN:'🇮🇷 Irán',NZL:'🇳🇿 Nueva Zelanda',
  ESP:'🇪🇸 España',CPV:'🇨🇻 Cabo Verde',KSA:'🇸🇦 Arabia Saudita',URU:'🇺🇾 Uruguay',
  FRA:'🇫🇷 Francia',SEN:'🇸🇳 Senegal',IRQ:'🇮🇶 Irak',NOR:'🇳🇴 Noruega',
  ARG:'🇦🇷 Argentina',ALG:'🇩🇿 Argelia',AUT:'🇦🇹 Austria',JOR:'🇯🇴 Jordania',
  POR:'🇵🇹 Portugal',COD:'🇨🇩 Congo DR',UZB:'🇺🇿 Uzbekistán',COL:'🇨🇴 Colombia',
  ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra',CRO:'🇭🇷 Croacia',GHA:'🇬🇭 Ghana',PAN:'🇵🇦 Panamá',
  FWC:'🏆 FIFA WC',CC:'🥤 Coca-Cola',
}
const COLORES = {
  A:'#E8363D',B:'#F47B20',C:'#3BB273',D:'#00B4D8',
  E:'#7B2FBE',F:'#F5C518',G:'#4361EE',H:'#EC407A',
  I:'#00897B',J:'#FF7043',K:'#5C6BC0',L:'#26A69A',
  FWC:'#F5C518',CC:'#E8363D',
}

export default function Album() {
  const [user,setUser]=useState(null)
  const [stickers,setStickers]=useState([])
  const [mis,setMis]=useState({})
  const [grupo,setGrupo]=useState('A')
  const [seccion,setSeccion]=useState(null)
  const [loading,setLoading]=useState(true)
  const router=useRouter()

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(!session){router.push('/');return}
      setUser(session.user)
      await asegurarPerfil(session.user)
      await cargar(session.user.id)
      setLoading(false)
    })
  },[])

  const asegurarPerfil=async(u)=>{
    const{data}=await supabase.from('profiles').select('id').eq('id',u.id).single()
    if(!data)await supabase.from('profiles').insert({id:u.id,full_name:u.user_metadata?.full_name,avatar_url:u.user_metadata?.avatar_url})
  }

  const cargar=async(uid)=>{
    const{data:todos}=await supabase.from('stickers').select('*').order('numero')
    const{data:mios}=await supabase.from('user_stickers').select('*').eq('user_id',uid)
    const m={}
    if(mios)mios.forEach(s=>{m[s.sticker_id]=s})
    setStickers(todos||[])
    setMis(m)
  }

  const toggle=async(s)=>{
    const uid=user.id
    const act=mis[s.id]
    if(!act){
      const{data}=await supabase.from('user_stickers').insert({user_id:uid,sticker_id:s.id,quantity:1,wanted:false}).select().single()
      setMis(p=>({...p,[s.id]:data}))
    } else if(act.quantity===1){
      const{data}=await supabase.from('user_stickers').update({quantity:2}).eq('id',act.id).select().single()
      setMis(p=>({...p,[s.id]:data}))
    } else {
      await supabase.from('user_stickers').delete().eq('id',act.id)
      setMis(p=>{const n={...p};delete n[s.id];return n})
    }
  }

  const secciones=GRUPOS[grupo]||[]
  const secActiva=seccion||secciones[0]||grupo
  const filtrados=stickers.filter(s=>s.seccion===secActiva)
  const tengo=Object.values(mis).filter(s=>s.quantity>=1).length
  const repito=Object.values(mis).filter(s=>s.quantity>=2).length
  const faltan=stickers.length-tengo
  const pct=stickers.length>0?Math.round(tengo/stickers.length*100):0
  const color=COLORES[grupo]||'#00B4D8'

  if(loading) return(
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontFamily:'Syne',fontSize:32,fontWeight:800,background:'linear-gradient(135deg,#E8363D,#F47B20,#F5C518)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>MetaXport</div>
        <div style={{color:'var(--text2)',fontSize:13,marginTop:8}}>Cargando tu álbum...</div>
      </div>
    </div>
  )

  return(
    <main style={{minHeight:'100vh',background:'var(--bg)'}}>

      {/* Navbar */}
      <nav className="navbar" style={{position:'sticky',top:0,zIndex:50,padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800}}>
          <span style={{background:'linear-gradient(135deg,#E8363D,#F47B20)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Meta</span>
          <span style={{color:'white'}}>Xport</span>
        </span>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-ghost" style={{padding:'7px 14px'}} onClick={()=>router.push('/intercambios')}>🔄 Intercambios</button>
          <button className="btn btn-ghost" style={{padding:'7px 14px'}} onClick={()=>router.push('/perfil')}>👤 {user?.user_metadata?.full_name?.split(' ')[0]}</button>
        </div>
      </nav>

      {/* Stats hero */}
      <div style={{padding:'20px 20px 0',maxWidth:680,margin:'0 auto'}}>
        <div style={{
          background:`linear-gradient(135deg, ${color}18, ${color}08)`,
          border:`1px solid ${color}25`,
          borderRadius:20,padding:'20px 24px',marginBottom:20
        }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
            <div>
              <div style={{fontFamily:'Syne',fontSize:24,fontWeight:800,color:'white'}}>{pct}% completado</div>
              <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>
                {tengo} tengo · {faltan} faltan · {repito} repito
              </div>
            </div>
            <div style={{fontSize:28,fontFamily:'Syne',fontWeight:800,color}}>
              {tengo}<span style={{fontSize:14,color:'var(--text2)',fontWeight:400}}>/{stickers.length}</span>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{width:`${pct}%`, background:`linear-gradient(90deg, ${color}, ${color}99)`}} />
          </div>
        </div>

        {/* Instrucción */}
        <div style={{display:'flex',gap:16,justifyContent:'center',marginBottom:20}}>
          {[['·','Vacía','rgba(255,255,255,0.2)'],['cyan','Tengo','#00B4D8'],['green','Repito','#3BB273']].map(([k,l,c])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--text2)'}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:c,display:'inline-block'}}/>
              {l}
            </div>
          ))}
        </div>

        {/* Grupos scroll */}
        <div style={{overflowX:'auto',paddingBottom:4,marginBottom:12}}>
          <div style={{display:'flex',gap:8,width:'max-content'}}>
            {Object.keys(GRUPOS).map(g=>(
              <button key={g} className={`grupo-btn${grupo===g?' active':''}`}
                onClick={()=>{setGrupo(g);setSeccion(null)}}
                style={grupo===g?{background:COLORES[g],borderColor:COLORES[g]}:{}}>
                Grupo {g}
              </button>
            ))}
            <button className={`grupo-btn${grupo==='FWC'?' active':''}`}
              onClick={()=>{setGrupo('FWC');setSeccion('FWC')}}
              style={grupo==='FWC'?{background:COLORES.FWC,borderColor:COLORES.FWC,color:'#000'}:{}}>
              🏆 FIFA
            </button>
            <button className={`grupo-btn${grupo==='CC'?' active':''}`}
              onClick={()=>{setGrupo('CC');setSeccion('CC')}}
              style={grupo==='CC'?{background:COLORES.CC,borderColor:COLORES.CC}:{}}>
              🥤 Coca
            </button>
          </div>
        </div>

        {/* Selecciones del grupo */}
        {GRUPOS[grupo]&&(
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
            {GRUPOS[grupo].map(sec=>{
              const stkSec=stickers.filter(s=>s.seccion===sec)
              const tieneSec=stkSec.filter(s=>mis[s.id]?.quantity>=1).length
              const pctSec=stkSec.length>0?Math.round(tieneSec/stkSec.length*100):0
              const isAct=secActiva===sec
              return(
                <button key={sec} className={`selec-btn${isAct?' active':''}`}
                  onClick={()=>setSeccion(sec)}
                  style={isAct?{borderColor:`${color}50`,background:`${color}12`,color:'white'}:{}}>
                  <span style={{fontSize:13}}>{PAISES[sec]||sec}</span>
                  <span style={{
                    fontSize:10,padding:'1px 6px',borderRadius:50,fontWeight:700,
                    background: pctSec===100?'rgba(59,178,115,0.2)':'rgba(255,255,255,0.06)',
                    color: pctSec===100?'#3BB273':'var(--text3)'
                  }}>
                    {pctSec}%
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Título selección activa */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <div style={{width:3,height:20,borderRadius:2,background:color}} />
          <span style={{fontSize:13,fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'0.08em'}}>
            {PAISES[secActiva]||secActiva} · {filtrados.length} figuritas
          </span>
        </div>

        {/* Grid figuritas */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(56px,1fr))',gap:6,paddingBottom:40}}>
          {filtrados.map(s=>{
            const m=mis[s.id]
            const q=m?.quantity||0
            return(
              <button key={s.id} onClick={()=>toggle(s)}
                className={`stk ${q===0?'stk-empty':q>=2?'stk-repeat':'stk-have'}`}
                title={s.jugador}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:'0.02em',lineHeight:1.2}}>
                  {s.jugador}
                </div>
                {q>=2&&(
                  <div style={{
                    marginTop:3,fontSize:8,fontWeight:800,
                    color:'#3BB273',textTransform:'uppercase',letterSpacing:'0.05em'
                  }}>REP</div>
                )}
              </button>
            )
          })}
        </div>

      </div>
    </main>
  )
}
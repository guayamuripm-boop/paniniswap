'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import Navbar from '../../components/Navbar'
import { Trophy, Zap, Repeat2, Clock, TrendingUp, TrendingDown } from 'lucide-react'

const GRUPOS = {
  A:['MEX','RSA','KOR','CZE'], B:['CAN','BIH','QAT','SUI'],
  C:['BRA','MAR','HAI','SCO'], D:['USA','PAR','AUS','TUR'],
  E:['GER','CUW','CIV','ECU'], F:['NED','JPN','SWE','TUN'],
  G:['BEL','EGY','IRN','NZL'], H:['ESP','CPV','KSA','URU'],
  I:['FRA','SEN','IRQ','NOR'], J:['ARG','ALG','AUT','JOR'],
  K:['POR','COD','UZB','COL'], L:['ENG','CRO','GHA','PAN'],
}
const PAISES = {
  MEX:'🇲🇽 México', RSA:'🇿🇦 Sudáfrica', KOR:'🇰🇷 Corea', CZE:'🇨🇿 Rep. Checa',
  CAN:'🇨🇦 Canadá', BIH:'🇧🇦 Bosnia', QAT:'🇶🇦 Qatar', SUI:'🇨🇭 Suiza',
  BRA:'🇧🇷 Brasil', MAR:'🇲🇦 Marruecos', HAI:'🇭🇹 Haití', SCO:'🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia',
  USA:'🇺🇸 USA', PAR:'🇵🇾 Paraguay', AUS:'🇦🇺 Australia', TUR:'🇹🇷 Turquía',
  GER:'🇩🇪 Alemania', CUW:'🇨🇼 Curazao', CIV:'🇨🇮 Costa de Marfil', ECU:'🇪🇨 Ecuador',
  NED:'🇳🇱 Holanda', JPN:'🇯🇵 Japón', SWE:'🇸🇪 Suecia', TUN:'🇹🇳 Túnez',
  BEL:'🇧🇪 Bélgica', EGY:'🇪🇬 Egipto', IRN:'🇮🇷 Irán', NZL:'🇳🇿 Nueva Zelanda',
  ESP:'🇪🇸 España', CPV:'🇨🇻 Cabo Verde', KSA:'🇸🇦 Arabia Saudita', URU:'🇺🇾 Uruguay',
  FRA:'🇫🇷 Francia', SEN:'🇸🇳 Senegal', IRQ:'🇮🇶 Irak', NOR:'🇳🇴 Noruega',
  ARG:'🇦🇷 Argentina', ALG:'🇩🇿 Argelia', AUT:'🇦🇹 Austria', JOR:'🇯🇴 Jordania',
  POR:'🇵🇹 Portugal', COD:'🇨🇩 Congo DR', UZB:'🇺🇿 Uzbekistán', COL:'🇨🇴 Colombia',
  ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', CRO:'🇭🇷 Croacia', GHA:'🇬🇭 Ghana', PAN:'🇵🇦 Panamá',
  FWC:'🏆 FIFA', CC:'🥤 Coca-Cola',
}
const COLORES = {
  A:'#E8363D', B:'#F47B20', C:'#3BB273', D:'#00B4D8',
  E:'#7B2FBE', F:'#F5C518', G:'#4361EE', H:'#EC407A',
  I:'#00897B', J:'#FF7043', K:'#5C6BC0', L:'#26A69A',
}

export default function Analisis() {
  const [stickers, setStickers] = useState([])
  const [mis, setMis] = useState({})
  const [loading, setLoading] = useState(true)
  const [tasaDiaria, setTasaDiaria] = useState(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      const [{ data: todos }, { data: mios }, { data: perfil }] = await Promise.all([
        supabase.from('stickers').select('id,seccion'),
        supabase.from('user_stickers').select('sticker_id,quantity,created_at').eq('user_id', session.user.id),
        supabase.from('profiles').select('created_at').eq('id', session.user.id).single()
      ])
      const m = {}
      if (mios) mios.forEach(s => { m[s.sticker_id] = s })
      setStickers(todos || [])
      setMis(m)
      if (perfil && mios && mios.length > 0) {
        const joined = new Date(perfil.created_at)
        const dias = Math.max(1, (Date.now() - joined) / 86400000)
        const rate = mios.length / dias
        setTasaDiaria(rate)
      }
      setLoading(false)
    })
  }, [])

  const tengo = Object.values(mis).filter(s => s.quantity >= 1).length
  const repito = Object.values(mis).filter(s => s.quantity >= 2).length
  const faltan = stickers.length - tengo
  const pct = stickers.length > 0 ? Math.round(tengo / stickers.length * 100) : 0

  const statsPorGrupo = Object.entries(GRUPOS).map(([grupo, secciones]) => {
    const stkGrupo = stickers.filter(s => secciones.includes(s.seccion))
    const tieneGrupo = stkGrupo.filter(s => mis[s.id]?.quantity >= 1).length
    const pctGrupo = stkGrupo.length > 0 ? Math.round(tieneGrupo / stkGrupo.length * 100) : 0
    return { grupo, total: stkGrupo.length, tiene: tieneGrupo, pct: pctGrupo }
  }).sort((a, b) => b.pct - a.pct)

  const statsPorSeccion = Object.entries(PAISES)
    .filter(([code]) => stickers.some(s => s.seccion === code))
    .map(([code, nombre]) => {
      const stkSec = stickers.filter(s => s.seccion === code)
      const tieneSec = stkSec.filter(s => mis[s.id]?.quantity >= 1).length
      const pctSec = stkSec.length > 0 ? Math.round(tieneSec / stkSec.length * 100) : 0
      return { code, nombre, pct: pctSec }
    })

  const masCompletas = [...statsPorSeccion].sort((a, b) => b.pct - a.pct).slice(0, 5)
  const menosCompletas = [...statsPorSeccion].sort((a, b) => a.pct - b.pct).slice(0, 5)

  const diasRestantes = faltan > 0 ? Math.ceil(faltan / Math.max(tasaDiaria || 10, 1)) : 0
  const mundialInicia = new Date('2026-06-11')
  const diasHastaMundial = Math.max(0, Math.ceil((mundialInicia - new Date()) / (1000 * 60 * 60 * 24)))
  const fechaEst = new Date(Date.now() + diasRestantes * 86400000)
  const llegaATiempo = fechaEst < mundialInicia

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <nav style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="skel" style={{ width: 120, height: 24 }} />
        <div className="skel" style={{ width: 76, height: 38, borderRadius: 10 }} />
      </nav>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px' }}>
        <div className="skel" style={{ width: 140, height: 26, marginBottom: 8 }} />
        <div className="skel" style={{ width: 200, height: 14, marginBottom: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skel" style={{ height: 88, borderRadius: 16 }} />
          ))}
        </div>
        <div className="skel" style={{ height: 80, borderRadius: 16, marginBottom: 20 }} />
        <div className="skel" style={{ width: 180, height: 18, marginBottom: 12 }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skel" style={{ height: 52, borderRadius: 12, marginBottom: 8 }} />
        ))}
      </div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <Navbar />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px' }}>

        <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          Mi <span style={{ background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Análisis</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>Tu progreso del álbum Mundial 2026</p>

        {/* Stats 2x2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { n: `${pct}%`, label: 'Completado', color: '#0EA5E9', icon: Trophy, sub: `${tengo} de ${stickers.length}` },
            { n: faltan, label: 'Me faltan', color: '#E8363D', icon: Zap, sub: 'figuritas' },
            { n: repito, label: 'Repito', color: '#3BB273', icon: Repeat2, sub: 'para intercambiar' },
            { n: diasHastaMundial, label: 'Días al Mundial', color: '#F5C518', icon: Clock, sub: '11 Jun 2026' },
          ].map(({ n, label, color, icon: Icon, sub }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color }}>{n}</div>
                <Icon size={16} color={color} strokeWidth={2} style={{ opacity: 0.7, marginTop: 4 }} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'white' }}>{label}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Predicción */}
        <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 16, padding: '16px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Predicción de completado
          </div>
          {pct === 100 ? (
            <p style={{ color: '#3BB273', fontWeight: 700, fontSize: 15 }}>¡Álbum completado!</p>
          ) : (
            <>
              <p style={{ color: 'white', fontSize: 14, marginBottom: 4 }}>
                {tasaDiaria
                  ? <>A tu ritmo ({tasaDiaria.toFixed(1)}/día), completarías en <strong style={{color:'#F5C518'}}>{diasRestantes} días</strong> ({fechaEst.toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' })}).</>
                  : <>A 10 figuritas/día, completarías en <strong style={{color:'#F5C518'}}>{diasRestantes} días</strong>.</>}
              </p>
              <p style={{ color: 'var(--text3)', fontSize: 12 }}>
                El Mundial inicia en <strong style={{ color: 'white' }}>{diasHastaMundial} días</strong>. {llegaATiempo ? '— Vas bien.' : '— Acelera el ritmo.'}
              </p>
            </>
          )}
        </div>

        {/* Progreso por grupo */}
        <h2 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 800, marginBottom: 12, color: 'white' }}>Progreso por Grupo</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {statsPorGrupo.map(({ grupo, pct: pctG, tiene, total }) => (
            <div key={grupo} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 13, background: `${COLORES[grupo]}20`, color: COLORES[grupo], border: `1px solid ${COLORES[grupo]}30` }}>
                    {grupo}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>Grupo {grupo}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: pctG === 100 ? '#3BB273' : 'white' }}>
                  {tiene}/{total} · {pctG}%
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${pctG}%`, height: '100%', borderRadius: 99, background: pctG === 100 ? '#3BB273' : COLORES[grupo], transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Más y menos completas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'rgba(59,178,115,0.05)', border: '1px solid rgba(59,178,115,0.15)', borderRadius: 16, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <TrendingUp size={14} color="#3BB273" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#3BB273', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Más completas</span>
            </div>
            {masCompletas.map(s => (
              <div key={s.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{s.nombre}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 60, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${s.pct}%`, height: '100%', background: '#3BB273', borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#3BB273', minWidth: 30, textAlign: 'right' }}>{s.pct}%</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(232,54,61,0.05)', border: '1px solid rgba(232,54,61,0.15)', borderRadius: 16, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <TrendingDown size={14} color="#E8363D" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#E8363D', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Necesitan más figuritas</span>
            </div>
            {menosCompletas.map(s => (
              <div key={s.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{s.nombre}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 60, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${s.pct}%`, height: '100%', background: '#E8363D', borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#E8363D', minWidth: 30, textAlign: 'right' }}>{s.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      <BottomNav active="/analisis" />
    </main>
  )
}
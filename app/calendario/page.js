'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import Navbar from '../../components/Navbar'
import { GRUPOS, PAISES, SEDES, PARTIDOS_FASE_GRUPOS, ELIMINATORIAS } from '../../lib/calendario-data'
import { Calendar, MapPin, Clock, Trophy, ChevronRight } from 'lucide-react'

const COLORES = {
  A:'#E8363D', B:'#F47B20', C:'#3BB273', D:'#00B4D8',
  E:'#7B2FBE', F:'#F5C518', G:'#4361EE', H:'#EC407A',
  I:'#00897B', J:'#FF7043', K:'#5C6BC0', L:'#26A69A',
}

function formatFecha(f) {
  const d = new Date(f + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'short' }).replace('.','')
}

export default function Calendario() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('grupos')
  const [grupoFiltro, setGrupoFiltro] = useState(null)
  const [hoy, setHoy] = useState(null)
  const router = useRouter()

  useEffect(() => {
    setHoy(new Date().toISOString().slice(0,10))
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
  }, [])

  const ordenarPartidos = (partidos) => {
    return [...partidos].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora?.localeCompare(b.hora || ''))
  }

  const agruparPorFecha = (partidos) => {
    const grupos = {}
    partidos.forEach(p => {
      const k = p.fecha
      if (!grupos[k]) grupos[k] = []
      grupos[k].push(p)
    })
    return Object.entries(grupos).sort((a, b) => a[0].localeCompare(b[0]))
  }

  const partidosFiltrados = grupoFiltro
    ? PARTIDOS_FASE_GRUPOS.filter(p => p.grupo === grupoFiltro)
    : PARTIDOS_FASE_GRUPOS

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <Navbar />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px' }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          <span style={{ background: 'linear-gradient(135deg,#F5C518,#E8363D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Calendario</span> Mundial 2026
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>11 Jun — 19 Jul · 104 partidos · 16 sedes</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { key:'grupos', label:'Fase de Grupos' },
            { key:'eliminatorias', label:'Fase Final' },
            { key:'sedes', label:'Sedes' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`btn ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding:'8px 16px', fontSize:12, fontWeight:700 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* FASE DE GRUPOS */}
        {tab === 'grupos' && (
          <>
            {/* Filtro de grupos */}
            <div style={{ display:'flex', gap:6, marginBottom:20, overflow:'auto', paddingBottom:4, flexWrap:'wrap' }}>
              <button onClick={() => setGrupoFiltro(null)}
                className={`btn ${!grupoFiltro ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding:'6px 12px', fontSize:11, fontWeight:700 }}>
                Todos
              </button>
              {Object.keys(GRUPOS).map(g => (
                <button key={g} onClick={() => setGrupoFiltro(g)}
                  className={`btn ${grupoFiltro === g ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding:'6px 12px', fontSize:11, fontWeight:700 }}>
                  Grupo {g}
                </button>
              ))}
            </div>

            {/* Partidos por fecha */}
            {agruparPorFecha(ordenarPartidos(partidosFiltrados)).map(([fecha, partidos]) => {
              const esHoy = fecha === hoy
              return (
                <div key={fecha} style={{ marginBottom: 20 }}>
                  <div style={{
                    display:'flex', alignItems:'center', gap:8, marginBottom:10,
                    padding:'8px 12px', borderRadius:10,
                    background: esHoy ? 'rgba(245,197,36,0.1)' : 'rgba(255,255,255,0.03)',
                    border: esHoy ? '1px solid rgba(245,197,36,0.2)' : '1px solid transparent'
                  }}>
                    <Calendar size={14} color={esHoy ? '#F5C518' : 'var(--text3)'} />
                    <span style={{ fontWeight:700, fontSize:13, color: esHoy ? '#F5C518' : 'white' }}>
                      {formatFecha(fecha)}
                    </span>
                    {esHoy && <span style={{ fontSize:10, color:'#F5C518', fontWeight:600, marginLeft:4 }}>Hoy</span>}
                    <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text3)' }}>{partidos.length} partido{partidos.length>1?'s':''}</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {partidos.map(p => (
                      <div key={p.id} style={{
                        display:'flex', alignItems:'center', gap:10,
                        padding:'10px 12px', borderRadius:12,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        opacity: p.pendiente ? 0.5 : 1,
                      }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:44 }}>
                          <Clock size={12} color="var(--text3)" />
                          <span style={{ fontSize:11, fontWeight:700, color:'var(--text2)', marginTop:2 }}>{p.hora || '—'}</span>
                        </div>
                        <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
                          <span style={{ fontSize:13, fontWeight:700, textAlign:'right', flex:1, whiteSpace:'nowrap' }}>
                            {PAISES[p.local]?.split(' ')[1] || p.local}
                          </span>
                          <span style={{ fontSize:11, fontWeight:700, color:'var(--text3)', padding:'0 4px' }}>vs</span>
                          <span style={{ fontSize:13, fontWeight:700, textAlign:'left', flex:1, whiteSpace:'nowrap' }}>
                            {PAISES[p.visitante]?.split(' ')[1] || p.visitante}
                          </span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                          <span style={{
                            fontSize:8, fontWeight:700, padding:'2px 6px', borderRadius:4,
                            background: `${COLORES[p.grupo]}20`, color: COLORES[p.grupo],
                          }}>
                            {p.grupo}
                          </span>
                          <MapPin size={11} color="var(--text3)" />
                          <span style={{ fontSize:10, color:'var(--text3)', maxWidth:80, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {SEDES[p.sede]?.ciudad.split(' ').slice(0,2).join(' ') || p.sede}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* FASE FINAL */}
        {tab === 'eliminatorias' && (
          <div>
            {ELIMINATORIAS.map(ronda => (
              <div key={ronda.rondaClave} style={{ marginBottom:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <Trophy size={16} color="#F5C518" />
                  <h2 style={{ fontFamily:'Syne', fontSize:18, fontWeight:800, color:'white' }}>{ronda.ronda}</h2>
                  <span style={{ fontSize:11, color:'var(--text3)', marginLeft:'auto' }}>{ronda.partidos.length} partidos</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {ronda.partidos.map(p => (
                    <div key={p.id} style={{
                      display:'flex', alignItems:'center', gap:10,
                      padding:'10px 12px', borderRadius:12,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      opacity: p.pendiente ? 0.4 : 1,
                    }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:44 }}>
                        <Clock size={12} color="var(--text3)" />
                        <span style={{ fontSize:10, fontWeight:700, color:'var(--text2)', marginTop:2 }}>{p.hora || '—'}</span>
                      </div>
                      <div style={{ fontSize:10, color:'var(--text3)', minWidth:70 }}>
                        {formatFecha(p.fecha)}
                      </div>
                      <div style={{ flex:1, display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}>
                        <span style={{ fontSize:13, fontWeight:700, textAlign:'right', flex:1 }}>
                          {p.local.includes('W') ? p.local : PAISES[p.local]?.split(' ')[1] || p.local}
                        </span>
                        <span style={{ fontSize:10, fontWeight:700, color:'var(--text3)', padding:'0 2px' }}>vs</span>
                        <span style={{ fontSize:13, fontWeight:700, textAlign:'left', flex:1 }}>
                          {p.visitante.includes('W') ? p.visitante : PAISES[p.visitante]?.split(' ')[1] || p.visitante}
                        </span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                        <MapPin size={10} color="var(--text3)" />
                        <span style={{ fontSize:10, color:'var(--text3)', maxWidth:70, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {SEDES[p.sede]?.ciudad.split(' ').slice(0,2).join(' ') || p.sede}
                        </span>
                      </div>
                      <ChevronRight size={14} color="var(--text3)" style={{ flexShrink:0 }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SEDES */}
        {tab === 'sedes' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {['Oeste','Central','Este'].map(zona => (
              <div key={zona}>
                <h3 style={{ fontFamily:'Syne', fontSize:14, fontWeight:700, marginBottom:10, color:'var(--text2)' }}>
                  Región {zona}
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {Object.entries(SEDES).filter(([,s]) => s.zona === zona).map(([key, s]) => (
                    <div key={key} style={{
                      display:'flex', alignItems:'center', gap:10,
                      padding:'12px 14px', borderRadius:12,
                      background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)',
                    }}>
                      <MapPin size={16} color="#0EA5E9" style={{ flexShrink:0 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:13 }}>{s.ciudad}</div>
                        <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{s.estadio} · ET{s.et >= 0 ? `−${Math.abs(s.et)}` : `+${Math.abs(s.et)}`}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="/calendario" />
    </main>
  )
}

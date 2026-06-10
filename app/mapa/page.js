'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import Navbar from '../../components/Navbar'
import Link from 'next/link'
import { MapPin, Navigation, Users, MessageCircle } from 'lucide-react'

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function Mapa() {
  const [user, setUser] = useState(null)
  const [coords, setCoords] = useState(null)
  const [cercanos, setCercanos] = useState([])
  const [loading, setLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const mapRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    import('leaflet/dist/leaflet.css')
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      await loadData(session.user.id)
      setLoading(false)
    })
  }, [])

  const loadData = async (uid) => {
    const { data: perfil } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (perfil?.latitud && perfil?.longitud) {
      setCoords([perfil.latitud, perfil.longitud])
      await buscarCercanos(uid, perfil.latitud, perfil.longitud)
    }
  }

  const requestLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      setCoords([lat, lng])
      await supabase.from('profiles').update({ latitud: lat, longitud: lng }).eq('id', user.id)
      await buscarCercanos(user.id, lat, lng)
    }, () => {
      setLoading(false)
    }, { enableHighAccuracy: true, timeout: 10000 })
  }

  const buscarCercanos = async (uid, lat, lng) => {
    const [{ data: perfiles }, { data: stickers }] = await Promise.all([
      supabase.from('profiles').select('id,full_name,avatar_url,latitud,longitud,ciudad,pais').not('latitud', 'is', null).not('longitud', 'is', null),
      supabase.from('user_stickers').select('user_id,sticker_id,quantity'),
    ])
    const stkCount = {}
    if (stickers) stickers.forEach(s => {
      if (!stkCount[s.user_id]) stkCount[s.user_id] = { tengo: new Set(), repito: 0 }
      stkCount[s.user_id].tengo.add(s.sticker_id)
      if (s.quantity >= 2) stkCount[s.user_id].repito += s.quantity
    })
    const near = (perfiles || [])
      .filter(p => p.id !== uid && p.latitud && p.longitud)
      .map(p => ({
        ...p,
        distancia: haversine(lat, lng, p.latitud, p.longitud),
        tengo: stkCount[p.id]?.tengo?.size || 0,
        repito: stkCount[p.id]?.repito || 0,
      }))
      .filter(p => p.distancia <= 50)
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, 40)
    setCercanos(near)
  }

  useEffect(() => {
    if (!coords || mapReady || typeof window === 'undefined') return
    let instance = null
    import('leaflet').then(L => {
      instance = L.map(mapRef.current).setView(coords, 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(instance)
      const myIcon = L.divIcon({
        html: '<div style="width:18px;height:18px;background:#0EA5E9;border:2px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>',
        className: '',
        iconSize: [18, 18],
      })
      L.marker(coords, { icon: myIcon }).addTo(instance).bindPopup('Tú')
      cercanos.forEach(c => {
        if (c.latitud && c.longitud) {
          L.marker([c.latitud, c.longitud]).addTo(instance)
            .bindPopup(`<b>${c.full_name}</b><br/>${c.tengo} stickers<br/>${Math.round(c.distancia)} km`)
        }
      })
      if (cercanos.length > 0) {
        const all = [[coords[0], coords[1]], ...cercanos.filter(c => c.latitud && c.longitud).map(c => [c.latitud, c.longitud])]
        instance.fitBounds(all, { padding: [40, 40] })
      }
      setMapReady(true)
    })
    return () => { if (instance) instance.remove() }
  }, [coords, cercanos])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <Navbar />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          <span style={{ background: 'linear-gradient(135deg,#3BB273,#00B4D8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Coleccionistas</span> cercanos
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>Encuentra swaps cerca de ti</p>

        {!coords && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <MapPin size={48} strokeWidth={1.5} style={{ color: 'var(--text3)', marginBottom: 16 }} />
            <p style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Comparte tu ubicación</p>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>Para ver coleccionistas cerca de ti</p>
            <button onClick={requestLocation} className="btn btn-primary" style={{ padding: '12px 24px' }}>
              <Navigation size={16} /> Activar ubicación
            </button>
          </div>
        )}

        {coords && (
          <>
            {loading && (
              <div className="skel" style={{ width: '100%', height: 300, borderRadius: 16, marginBottom: 20 }} />
            )}
            <div ref={mapRef} style={{ width: '100%', height: 300, borderRadius: 16, overflow: 'hidden', marginBottom: 20, display: loading ? 'none' : 'block' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700 }}>
                <Users size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                {cercanos.length} coleccionista{cercanos.length !== 1 ? 's' : ''} cerca
              </h3>
            </div>

            {cercanos.length === 0 && (
              <p style={{ color: 'var(--text3)', textAlign: 'center', padding: 20 }}>
                No hay coleccionistas cerca aún. ¡Invita a tus amigos!
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cercanos.map(c => (
                <div key={c.id} className="match-card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {c.avatar_url ? (
                      <img src={c.avatar_url} style={{ width: 40, height: 40, borderRadius: '50%' }} alt="" />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#3BB273,#00B4D8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white' }}>
                        {(c.full_name || '?')[0]}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{c.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                        <MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
                        {c.distancia < 1 ? '< 1 km' : `${Math.round(c.distancia)} km`}
                        {c.ciudad && ` · ${c.ciudad}`}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'right' }}>
                      <div>{c.tengo} stickers</div>
                      <div style={{ color: '#3BB273' }}>{c.repito} rep.</div>
                    </div>
                    <Link href={`/chat?id=${c.id}`} passHref legacyBehavior>
                      <a style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: 'rgba(14,165,233,0.1)', color: '#0EA5E9' }}>
                        <MessageCircle size={16} />
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <BottomNav active="/mapa" />
    </main>
  )
}

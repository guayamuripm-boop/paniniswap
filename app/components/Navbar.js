'use client'
import { useRouter } from 'next/navigation'
import { Menu, Search, X } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Navbar({ onSearch, showSearch = false, searchActive = false }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(6,8,16,0.85)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, cursor: 'pointer' }}
          onClick={() => router.push('/album')}>
          <span style={{ background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Meta</span>
          <span style={{ color: 'white' }}>Xport</span>
        </span>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {showSearch && (
            <button onClick={onSearch}
              style={{
                width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
                background: searchActive ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.06)',
                color: searchActive ? '#0EA5E9' : 'rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
              }}>
              {searchActive ? <X size={17} /> : <Search size={17} />}
            </button>
          )}
          <button onClick={() => setMenuOpen(true)}
            style={{
              width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            <Menu size={17} />
          </button>
        </div>
      </nav>

      {/* Drawer */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMenuOpen(false)}>
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 260,
            background: '#0D1420', borderLeft: '1px solid rgba(255,255,255,0.08)',
            padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 8
          }} onClick={e => e.stopPropagation()}>

            <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
              <span style={{ background: 'linear-gradient(135deg,#0EA5E9,#1D4ED8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Meta</span>
              <span style={{ color: 'white' }}>Xport</span>
            </div>

            {[
              { label: 'Mi Álbum', path: '/album' },
              { label: 'Intercambios', path: '/intercambios' },
              { label: 'Análisis', path: '/analisis' },
              { label: 'Mi Perfil', path: '/perfil' },
            ].map(item => (
              <button key={item.path}
                onClick={() => { router.push(item.path); setMenuOpen(false) }}
                style={{
                  padding: '13px 16px', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 600,
                  textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s'
                }}>
                {item.label}
              </button>
            ))}

            <div style={{ marginTop: 'auto' }}>
              <button onClick={handleLogout}
                style={{
                  width: '100%', padding: '13px', borderRadius: 12,
                  border: '1px solid rgba(239,68,68,0.2)',
                  background: 'rgba(239,68,68,0.07)',
                  color: '#EF4444', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                }}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
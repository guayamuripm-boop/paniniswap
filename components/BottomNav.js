'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { BookOpen, ArrowLeftRight, Users, User, Bell, Trophy, Calendar } from 'lucide-react'

const ITEMS = [
  { icon: BookOpen,       label: 'Álbum',    path: '/album' },
  { icon: Bell,           label: 'Feed',     path: '/feed' },
  { icon: ArrowLeftRight, label: 'Swaps',   path: '/intercambios' },
  { icon: Calendar,       label: 'Juegos',  path: '/calendario' },
  { icon: Trophy,         label: 'Ranking', path: '/ranking' },
  { icon: User,           label: 'Perfil',   path: '/perfil' },
]

export default function BottomNav({ active }) {
  const router = useRouter()
  useEffect(() => {
    ITEMS.forEach(item => router.prefetch(item.path))
  }, [])
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(6,8,16,0.95)',
      backdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center'
    }}>
      {ITEMS.map(({ icon: Icon, label, path }) => {
        const isActive = active === path
        return (
          <button key={path} onClick={() => router.push(path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 4, background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 20px',
              color: isActive ? '#0EA5E9' : 'rgba(255,255,255,0.3)',
              transition: 'color 0.2s', position: 'relative'
            }}>
            {isActive && (
              <div style={{
                position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                width: 20, height: 2, borderRadius: 99, background: '#0EA5E9'
              }} />
            )}
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: '0.03em' }}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
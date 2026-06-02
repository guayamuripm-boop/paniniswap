'use client'
export default function GlobalError({ error, reset }) {
  return (
    <html lang="es">
      <body style={{ background: '#060810', color: '#F0F4FF', fontFamily: 'sans-serif', padding: 40, textAlign: 'center' }}>
        <h1>Algo sali� mal</h1>
        <button onClick={() => reset()} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: '#0EA5E9', color: 'white', cursor: 'pointer', fontWeight: 700, marginTop: 16 }}>
          Intentar de nuevo
        </button>
      </body>
    </html>
  )
}

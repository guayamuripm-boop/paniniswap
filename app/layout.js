import './globals.css'

export const metadata = {
  title: 'PaniniSwap — Album Mundial 2026',
  description: 'Marca tus barajitas e intercambia con otros coleccionistas',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
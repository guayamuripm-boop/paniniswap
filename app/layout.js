import './globals.css'
import ServiceWorkerRegister from '../components/ServiceWorkerRegister'

export const metadata = {
  title: 'MetaXport — Álbum Digital del Mundial 2026',
  description: 'Marca tus figuritas del álbum Panini FIFA World Cup 2026, encuentra coleccionistas cerca de ti y coordina intercambios al instante.',
  keywords: 'album mundial 2026, figuritas panini, intercambiar figuritas, album fifa 2026, panini mundial',
  authors: [{ name: 'MetaXport' }],
  openGraph: {
    title: 'MetaXport — Álbum del Mundial 2026',
    description: 'Marca tus figuritas y encuentra tu match de intercambio perfecto.',
    url: 'https://paniniswap-6hlt.vercel.app',
    siteName: 'MetaXport',
    type: 'website',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'MetaXport — Álbum del Mundial 2026',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MetaXport — Álbum del Mundial 2026',
    description: 'Marca tus figuritas y encuentra tu match de intercambio perfecto.',
  },
  robots: { index: true, follow: true },
 
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#060810" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
# MetaXport — Deploy & Mobile

## Entornos (Staging + Producción)

### Producción (actual)
- Repo: `main` branch → Vercel
- URL: `https://paniniswap-6hlt.vercel.app`
- Dashboard: https://vercel.com (login con GitHub)

### Crear staging
```bash
# Crear branch de staging
git checkout -b staging
git push origin staging
```

En Vercel:
1. Ve a tu dashboard del proyecto
2. Settings → Git → Production Branch: `main`
3. Agrega Preview Deployment: cada PR crea URL automática
4. O agrega un dominio custom tipo `staging.metaxport.app`

### Variables de entorno (ambas iguales)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:info@metaxport.app
```

### Flujo de release
```bash
# 1. Trabajar en feature branch
git checkout -b feature/nueva-funcion
# ... codificar ...

# 2. Push → Vercel genera preview URL automáticamente
git push origin feature/nueva-funcion

# 3. Probar en preview URL (estilo test)

# 4. Merge a staging (si creaste el branch)
git checkout staging
git merge feature/nueva-funcion
git push origin staging

# 5. Probar en staging

# 6. Merge a producción
git checkout main
git merge feature/nueva-funcion
git push origin main
```

---

## Convertir en App Android (Google Play)

### Opción 1: PWA Builder (gratis, más rápido)
1. La app ya es PWA (manifest.json + Service Worker)
2. Ve a https://pwabuilder.com
3. Ingresa URL: `https://paniniswap-6hlt.vercel.app`
4. Descarga el package Android (APK/AAB)
5. Firma con Android Studio
6. Sube a Google Play Console → $25 única vez

### Opción 2: Bubblewrap (más control)
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://paniniswap-6hlt.vercel.app/manifest.json
bubblewrap build
```

### Opción 3: Trusted Web Activity (recomendado)
Usa `android-browser-helper` para crear una TWA que envuelve la PWA con Chrome y soporta notificaciones push. Google Play lo acepta sin problemas.

---

## Convertir en App iOS (App Store)

### Opción 1: WKWebView wrapper (más práctico)
Usa un proyecto Xcode mínimo que carga la PWA en un WKWebView. Herramientas:
- **PWA2iOS** — https://pwa2ios.com (genera Xcode project)
- **PWABuilder** también genera iOS wrapper

### Opción 2: Capacitor (recomendado)
```bash
npm install @capacitor/core @capacitor/cli
npx cap init MetaXport com.metaxport.app
npx cap add ios
npx cap add android
npx cap sync
npx cap open ios  # Abre Xcode listo para buildear
```

Capacitor te da control nativo (notificaciones push reales con APNs/FCM, in-app purchases, etc).

### App Store
1. Programa Developer de Apple → $99/año
2. Build en Xcode
3. Subir via Transporter
4. Revisión de Apple (~24-48h)

---

## Post-lanzamiento

### SQL para Supabase (ejecutar 1 vez)
```sql
-- Crear tabla de push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manage_own_subscription" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);
```

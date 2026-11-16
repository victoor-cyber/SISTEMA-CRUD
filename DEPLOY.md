# Cómo publicar el proyecto gratis (Render)

Esta guía deja la app en línea con una URL pública tipo
`https://catalogo-productos.onrender.com` **sin pagar nada**.

> Render es la opción más sencilla para Express: detecta Node, ejecuta
> `npm start` y da HTTPS gratis. La cuenta gratuita **duerme la app tras 15
> minutos sin visitas**; la primera visita después de dormir tarda ~30-60 s.

---

## Requisitos

1. Cuenta en <https://github.com> (gratis).
2. Cuenta en <https://render.com> (gratis, se puede entrar con GitHub).
3. El proyecto funcionando en local (`npm.cmd start`).

> **Ojo:** la carpeta `node_modules` **no se sube**. Render la instala solo.
> Tampoco se sube `.env` ni `data/db.json` (ya están en `.gitignore`).

---

## Paso 1 — Instalar Git (una sola vez)

Si `git --version` falla en PowerShell, instálalo con:

```powershell
winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
```

Cierra y vuelve a abrir la terminal para que reconozca el comando.

> Si no quieres instalar Git, salta al **Anexo A** (subir por la web de GitHub).

## Paso 2 — Subir el proyecto a GitHub

En la carpeta del proyecto:

```powershell
cd "C:\Users\HP\Documents\SISTEMA CRUD"

git init
git add .
git commit -m "API REST + formulario CRUD de productos"
git branch -M main
```

Crea el repositorio vacío en GitHub (botón **New repository**, sin README ni
`.gitignore`), copia la URL y ejecuta:

```powershell
git remote add origin https://github.com/TU_USUARIO/sistema-crud-productos.git
git push -u origin main
```

Comprueba que en GitHub aparecen `src/`, `public/`, `tests/`, `render.yaml`, etc.
y que **no** aparece `node_modules`.

## Paso 3 — Crear el servicio en Render

1. Entra a <https://dashboard.render.com> → **New +** → **Web Service**.
2. Conecta tu cuenta de GitHub y elige el repositorio.
3. Configura así:

| Campo | Valor |
|---|---|
| Name | `catalogo-productos` |
| Language / Runtime | `Node` |
| Branch | `main` |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Instance Type | `Free` |
| Health Check Path | `/api/health` |

4. En **Environment Variables** agrega:

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | una frase larga y secreta (ej: `Catalogo2026-Clave-Larga-123`) |
| `JWT_EXPIRES_IN` | `2h` |
| `CORS_ORIGIN` | `*` (o la URL de tu frontend si lo separas) |
| `ADMIN_EMAIL` | `admin@tienda.com` |
| `ADMIN_PASSWORD` | tu contraseña segura para el admin |

> `PORT` **no** se configura: Render lo entrega automáticamente y
> `src/config/env.js` ya lo lee.

5. Pulsa **Create Web Service** y espera el primer despliegue (2-4 min).

## Paso 4 — Probar

Render te da una URL, por ejemplo `https://catalogo-productos.onrender.com`:

- Formulario: `https://catalogo-productos.onrender.com`
- Salud: `https://catalogo-productos.onrender.com/api/health`
- Login: `POST https://catalogo-productos.onrender.com/api/auth/login`

Entra con el `ADMIN_EMAIL` / `ADMIN_PASSWORD` que configuraste.

En Postman, cambia la variable `baseUrl` por
`https://catalogo-productos.onrender.com/api`.

---

## Anexo A — Subir sin instalar Git (desde el navegador)

1. En GitHub: **New repository** → nombre `sistema-crud-productos` → **Create**.
2. Botón **uploading an existing file**.
3. Arrastra **solo estas carpetas y archivos** (no `node_modules`, no `.env`,
   no `data/db.json`):
   - `src/`
   - `public/`
   - `tests/`
   - `docs/`
   - `package.json`
   - `package-lock.json`
   - `README.md`
   - `.gitignore`
   - `render.yaml`
   - `.env.example`
4. **Commit changes** y sigue desde el **Paso 3**.

---

## Anexo B — Despliegue automático con `render.yaml`

El repo incluye `render.yaml` (Blueprint). En Render:

1. **New +** → **Blueprint**.
2. Elige el repositorio.
3. Render lee el archivo y crea el servicio solo. Te pedirá el valor de
   `ADMIN_PASSWORD`; el resto de variables se generan automáticamente.

Cada `git push` a `main` vuelve a desplegar la app.

---

## Advertencias importantes

### 1. Los datos se reinician al reiniciar o redesplegar
En el plan gratis el disco es **temporal**: cada reinicio o nuevo deploy crea
otra vez `data/db.json` con el admin y los 4 productos de ejemplo. Para una
entrega o demostración funciona perfecto, pero lo que crees se pierde.

**Si necesitas que los datos queden guardados de verdad**, usa una base de
datos gratuita en la nube y cambia **solo** `src/repositories/`:

| Servicio gratis | Tipo | Nota |
|---|---|---|
| MongoDB Atlas (M0, 512 MB) | NoSQL | El más usado en clase |
| Neon / Supabase | PostgreSQL | Plan gratis suficiente |
| Turso | SQLite en la nube | Cambio mínimo desde JSON |

### 2. Seguridad
- Nunca subas `.env` al repositorio (ya está ignorado).
- Cambia `JWT_SECRET` y `ADMIN_PASSWORD` en Render; el valor por defecto es solo
  para desarrollo.
- `CORS_ORIGIN=*` está bien para la entrega; en producción real pon el dominio
  exacto del frontend.

### 3. La app "duerme"
Tras 15 minutos sin visitas el servicio se apaga. La primera petición tarda
hasta un minuto. Si el profesor va a calificar, entra 2 minutos antes para
"despertarla".

---

## Otras opciones gratuitas (por si Render no te gusta)

| Plataforma | ¿Sirve este proyecto? | Comentario |
|---|---|---|
| **Render** | ✅ Sí | Recomendada para esta entrega |
| **Koyeb** | ✅ Sí | Plan gratis con límites; similar a Render |
| **Railway** | ⚠️ Solo crédito de prueba | Ya no tiene plan gratis permanente |
| **Fly.io** | ⚠️ Cambió sus límites | Requiere tarjeta |
| **Replit** | ✅ Sí | Fácil, pero se duerme y la URL es más fea |
| **Vercel / Netlify** | ⚠️ Con adaptador | Serverless: el archivo JSON no persiste y el formulario estático sí |
| **GitHub Pages** | ❌ No | Solo sirve HTML/CSS/JS estático, no Node/Express |

Para este proyecto (Express + formulario + JSON), **Render es la ruta más corta**.

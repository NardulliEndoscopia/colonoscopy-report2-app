# ColonReport

Aplicacion Next.js para explicar informes de colonoscopia en lenguaje claro y en multiples idiomas.

## Modelo IA

La app usa Gemini para analizar informes: gemini-3.1-flash-lite-preview.

## Requisitos

- Node.js 20 o superior
- GEMINI_API_KEY configurada
- ADMIN_PASSWORD configurada

## Instalacion local

npm install
npm run dev

Abrir http://localhost:3000.

## Produccion

npm install
npm run build
npm run start

## Variables de entorno

GEMINI_API_KEY=tu_clave_de_google_ai_studio
ADMIN_PASSWORD=tu_contrasena_segura
NEXT_PUBLIC_DOCTOR_CONFIG={}

No subas .env.local al repositorio.

## Cómo ejecutar el frontend

Desde la carpeta `frontend`:

```bash
python -m http.server 5500

Luego abrir en el navegador:  http://localhost:5500/index.html



## Integración con los backends

El frontend se comunica con dos servicios:

1. Backend Java (autenticación)
   - Base URL configurada en `js/api/authApi.js` como `JAVA_BASE_URL`.
   - Endpoints esperados:
     - `POST /api/auth/login`
     - `POST /api/auth/register`
     - `GET /api/auth/me` (opcional, para recuperar datos del usuario)

2. Backend Python (hábitos y gamificación)
   - Base URL configurada en `js/api/habitsApi.js` como `PY_BASE_URL`.
   - Endpoints esperados:
     - `GET /api/habits`
     - `GET /api/user-habits`
     - `POST /api/user-habits`
     - `POST /api/checkins`
     - `GET /api/stats/weekly`
     - `GET /api/achievements`
     - `GET /api/user-achievements`

Para que el frontend funcione contra los servicios reales, el equipo de backend
debe implementar esos endpoints respetando la estructura de JSON que aquí se espera.
Mientras tanto, el frontend puede usar datos de prueba (mock) definidos en `js/api/habitsApi.js`.

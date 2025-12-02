## Cómo ejecutar el frontend

Desde la carpeta `frontend`:

```bash
python -m http.server 5500
```
Luego abrir en el navegador:  http://localhost:5500/index.html

### Al momento dedesarrollar

Al abrir la página en el navegador, para deshabilitar que se guarden automaticamente archivos javascript en cache: ir  a Herramientas de Desarrollador (f12 o ctrl+Shift+i) -> Network-> Disable cache (checkbox que se encuentra en la parte superior). Esto evita que al recargar la página para revisar cambios hechos en el código, no recargue la información y use lo guardado en cache.

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
     - `GET /habits`
     - `GET /user-habits`
     - `POST /user-habits`
     - `POST /checkins`
     - `GET /stats/weekly`
     - `GET /achievements`
     - `GET /user-achievements`

Para que el frontend funcione contra los servicios reales, el equipo de backend
debe implementar esos endpoints respetando la estructura de JSON que aquí se espera.
Mientras tanto, el frontend puede usar datos de prueba (mock) definidos en `js/api/habitsApi.js`.

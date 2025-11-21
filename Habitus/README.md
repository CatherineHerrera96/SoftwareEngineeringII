# HABITUS

HABITUS es una aplicación web para el **seguimiento de hábitos** con elementos de **gamificación**.  
Permite que las personas:

- Se registren e inicien sesión.
- Activen hábitos desde un catálogo personalizado.
- Registren diariamente si cumplieron o no cada hábito.
- Consulten estadísticas semanales de cumplimiento y rachas.
- Desbloqueen logros de acuerdo a su consistencia.

El proyecto se desarrolla como parte de los Workshops del curso, con énfasis en:
- Diseño de arquitectura por servicios.
- Integración de múltiples tecnologías (Java, Python, PostgreSQL, web frontend).
- Buenas prácticas de organización de código y repositorio.

---

## Tecnologías principales

- **Base de datos:** PostgreSQL  
- **Backend Java:** servicio de autenticación y gestión de usuarios  
- **Backend Python:** servicio de hábitos, check-ins, estadísticas y logros  
- **Frontend web:** HTML, CSS y JavaScript (sin framework pesado obligatorio)

---

## Arquitectura general

La solución se organiza en cuatro componentes principales:

1. **Base de datos (DB)**
   - Modelo relacional con tablas como:
     - `users`
     - `habits`
     - `user_habits`
     - `habit_tracker`
     - `achievements`
     - `user_achievements`
   - Scripts de creación de esquema y carga de datos de prueba.

2. **Backend Java**
   - Servicio de autenticación (registro, login, información básica del usuario).
   - Generación y validación de un token de autenticación (por ejemplo, JWT).
   - Acceso a la tabla `users` en PostgreSQL.

3. **Backend Python**
   - Gestión del catálogo de hábitos y hábitos activados por usuario.
   - Registro diario de cumplimiento (check-ins).
   - Cálculo de estadísticas (porcentaje de cumplimiento, rachas, etc.).
   - Gestión de logros y logros desbloqueados.
   - Acceso al mismo esquema de base de datos en PostgreSQL.

4. **Frontend**
   - Implementa las pantallas principales:
     - Login/registro
     - Selección de hábitos
     - Checklist diaria
     - Dashboard de estadísticas y logros
   - Se comunica vía API REST con los backends Java y Python.
   - Maneja el token de autenticación en el navegador.

---

## Estructura del repositorio

```text
Habitus/
├─ README.md              # Descripción general del proyecto
├─ .gitignore             # Archivos y carpetas a ignorar por Git
│
├─ db/                    # Scripts y recursos de base de datos
│   ├─ schema.sql         # Definición del esquema (tablas, PK, FK, índices)
│   ├─ seed.sql           # Datos de prueba para poblar la base
│   └─ README.md          # Instrucciones para crear la BD y cargar datos
│
├─ backend-java/          # Servicio de autenticación (Java)
│   ├─ src/               # Código fuente Java (controladores, servicios, modelos)
│   ├─ pom.xml            # Configuración de Maven (dependencias, build)
│   └─ README.md          # Cómo ejecutar el backend Java y descripción de endpoints
│
├─ backend-python/        # Servicio de hábitos, stats y logros (Python)
│   ├─ app/               # Código fuente de la API (rutas, lógica de negocio)
│   ├─ tests/             # Pruebas unitarias y/o de integración en Python
│   ├─ requirements.txt   # Dependencias de Python (FastAPI/Flask, DB driver, etc.)
│   └─ README.md          # Cómo ejecutar el backend Python y descripción de endpoints
│
└─ frontend/              # Aplicación web del lado del cliente
    ├─ index.html         # Punto de entrada del frontend
    ├─ css/               # Hojas de estilo
    ├─ js/                # Lógica del frontend (fetch a APIs, manejo de token, etc.)
    ├─ assets/            # Imágenes, íconos y otros recursos estáticos
    └─ README.md          # Cómo levantar el frontend y descripción de las vistas

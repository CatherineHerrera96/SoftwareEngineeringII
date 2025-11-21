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
habitus/                         # Repositorio raíz del proyecto HABITUS
├─ README.md                     # Descripción general del proyecto, estructura y cómo arrancar cada parte
├─ .gitignore                    # Archivos/carpetas que Git NO debe versionar (binarios, .env, etc.)
│
├─ db/                           # TODO lo relacionado con la base de datos (trabajo de BD)
│   ├─ schema.sql                # Script para crear el esquema completo: tablas, PK, FK, UNIQUE, índices
│   ├─ seed.sql                  # Script para insertar datos de prueba (usuarios, hábitos, check-ins, logros)
│   └─ README.md                 # Instrucciones: cómo crear la BD, ejecutar schema.sql/seed.sql, conexión básica
│
├─ backend-java/                 # Backend de AUTENTICACIÓN (registro, login, /me) en Java
│   ├─ pom.xml                   # Configuración de Maven: dependencias (Spring, PostgreSQL, JWT, etc.)
│   ├─ src/
│   │   ├─ main/
│   │   │   ├─ java/
│   │   │   │   └─ com/habitus/auth/      # Paquete principal del servicio de Auth
│   │   │   │       ├─ controller/        # Controladores REST: definen los endpoints
│   │   │   │       │   └─ AuthController.java
│   │   │   │       │       # Métodos para: POST /register, POST /login, GET /me
│   │   │   │       │
│   │   │   │       ├─ service/           # Lógica de negocio de autenticación
│   │   │   │       │   └─ AuthService.java
│   │   │   │       │       # Valida credenciales, llama al repo, genera el token
│   │   │   │       │
│   │   │   │       ├─ model/             # Modelos/entidades de BD (mapeo tabla users)
│   │   │   │       │   └─ User.java
│   │   │   │       │       # Representa la tabla users (id, email, password_hash, created_at...)
│   │   │   │       │
│   │   │   │       ├─ repository/        # Acceso a BD (JPA/JDBC)
│   │   │   │       │   └─ UserRepository.java
│   │   │   │       │       # findByEmail, save, etc.
│   │   │   │       │
│   │   │   │       ├─ security/          # Cosas específicas de seguridad/token
│   │   │   │       │   ├─ JwtUtil.java   # Generación y validación del token (por ejemplo JWT)
│   │   │   │       │   └─ JwtFilter.java # Filtro para leer Authorization: Bearer <token> (si se usa)
│   │   │   │       │
│   │   │   │       └─ HabitusAuthApplication.java
│   │   │   │           # Clase main de Spring Boot: arranque del servicio de Auth
│   │   │   │
│   │   │   └─ resources/
│   │   │       ├─ application.properties # Config BD, puerto del server, variables de entorno
│   │   │       └─ (otros recursos)       # Por ej. configuración de logging
│   │   │
│   │   └─ test/
│   │       └─ java/com/habitus/auth/     # Pruebas del backend Java
│   │           └─ AuthControllerTest.java
│   │               # Tests de registro/login/me (mínimo un par de pruebas)
│   │
│   └─ README.md                 # Cómo compilar y ejecutar el backend Java + documentación de endpoints
│
├─ backend-python/               # Backend de HÁBITOS, CHECK-INS, STATS y LOGROS en Python
│   ├─ app/
│   │   ├─ main.py               # Punto de entrada de la API (crea la app FastAPI/Flask y monta las rutas)
│   │   │
│   │   ├─ api/                  # "Controladores" de Python: definen los endpoints REST
│   │   │   ├─ habits.py         # /habits, /user-habits (GET/POST para catálogo y hábitos del usuario)
│   │   │   ├─ checkins.py       # /checkins (registro diario de completado/no completado)
│   │   │   ├─ stats.py          # /stats/weekly (estadísticas semanales, rachas, % cumplimiento)
│   │   │   └─ achievements.py   # /achievements y /user-achievements (logros y logros desbloqueados)
│   │   │
│   │   ├─ core/                 # Configuración general y autenticación
│   │   │   ├─ config.py         # Configuración de la app: URL de BD, puerto, constantes
│   │   │   └─ auth.py           # Funciones para validar el token de Java y extraer user_id
│   │   │
│   │   ├─ db/                   # Capa de acceso a base de datos
│   │   │   ├─ connection.py     # Creación de conexión/engine a PostgreSQL (psycopg2 o SQLAlchemy)
│   │   │   └─ queries.py        # Consultas SQL reutilizables (aporta mucho la persona de BD)
│   │   │       # Ej: obtener hábitos activos, check-ins de una semana, etc.
│   │   │
│   │   ├─ models/               # (Opcional) Modelos ORM (SQLAlchemy) que mapean tablas
│   │   │   └─ habit_models.py   # Clases Habit, UserHabit, HabitTracker, Achievement, UserAchievement
│   │   │
│   │   ├─ schemas/              # (Opcional) Esquemas Pydantic u otros para request/response
│   │   │   └─ habit_schemas.py  # Definición de estructuras JSON que se reciben/devuelven
│   │   │
│   │   └─ services/             # Lógica de negocio pura (sin HTTP ni SQL directo)
│   │       ├─ habits_service.py       # Alta/baja de hábitos de usuario, catálogo, etc.
│   │       ├─ checkins_service.py     # Crear/actualizar check-ins diarios
│   │       ├─ stats_service.py        # Cálculo de estadísticas semanales, rachas
│   │       └─ achievements_service.py # Lógica para desbloquear logros según condiciones
│   │
│   ├─ tests/                    # Pruebas unitarias / de integración del backend Python
│   │   ├─ test_habits.py
│   │   ├─ test_checkins.py
│   │   └─ test_stats.py
│   │       # Tests para verificar que los endpoints y la lógica funcionan correctamente
│   │
│   ├─ requirements.txt          # Lista de dependencias de Python (FastAPI/Flask, driver Postgres, etc.)
│   └─ README.md                 # Cómo correr el backend Python + documentación de endpoints
│
└─ frontend/                     # Aplicación web del lado del cliente (todas las vistas de la UI)
    ├─ index.html                # Único HTML principal; contiene las secciones de todas las vistas
    │                            # Ej: <section data-view="login">, "habits", "daily", "dashboard"
    │
    ├─ css/
    │   ├─ base.css              # Estilos globales (tipografía, colores, botones, etc.)
    │   ├─ layout.css            # Layout general: header, contenedores, grid/flex, etc.
    │   ├─ login.css             # Estilos específicos para la vista de login/registro
    │   ├─ habits.css            # Estilos para la vista de selección de hábitos
    │   └─ dashboard.css         # Estilos para la vista de estadísticas y logros
    │
    ├─ js/
    │   ├─ api/                  # Capa de acceso a los backends desde el frontend (fetch)
    │   │   ├─ authApi.js        # Funciones para llamar al backend Java (login, register, /me)
    │   │   └─ habitsApi.js      # Funciones para llamar al backend Python (habits, checkins, stats, etc.)
    │   │
    │   ├─ views/                # Lógica específica de cada vista de la UI
    │   │   ├─ loginView.js              # Maneja la vista de login/registro (eventos del formulario, etc.)
    │   │   ├─ habitsView.js             # Vista para activar/desactivar hábitos del catálogo
    │   │   ├─ dailyChecklistView.js     # Vista para marcar hábitos como completados/no completados
    │   │   └─ dashboardView.js          # Vista de estadísticas semanales y logros desbloqueados
    │   │
    │   ├─ state.js              # Estado global del frontend (token, user, hábitos cargados en memoria)
    │   ├─ router.js             # Pequeño "router": decide qué vista se muestra, muestra/oculta secciones
    │   └─ main.js               # Punto de entrada del frontend; inicializa eventos, llama al router, etc.
    │
    ├─ assets/
    │   ├─ logo.png              # Logo de HABITUS u otros íconos del proyecto
    │   └─ (otros recursos)      # Imágenes, ilustraciones, etc.
    │
    └─ README.md                 # Cómo abrir/servir el frontend y qué vistas/pantallas existen


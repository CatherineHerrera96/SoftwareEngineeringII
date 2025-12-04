# Habitus - Architecture Documentation
# Habitus - Documentación de Arquitectura

## Overview / Descripción General

Habitus is a full-stack habit-tracking application built with microservices architecture principles. The system separates authentication concerns from business logic, with dedicated services for user management and habit tracking.

Habitus es una aplicación completa de seguimiento de hábitos construida con principios de arquitectura de microservicios. El sistema separa las preocupaciones de autenticación de la lógica de negocio, con servicios dedicados para gestión de usuarios y seguimiento de hábitos.

## System Architecture / Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (Vanilla JavaScript SPA)                       │
│                     http://localhost:8001                         │
└────────────┬──────────────────────────┬─────────────────────────┘
             │                          │
    ┌────────▼──────────┐      ┌────────▼──────────┐
    │  Java Auth API    │      │  Python Habits API │
    │  (Spring Boot)    │      │    (FastAPI)       │
    │  Port 8080        │      │    Port 8000       │
    │                   │      │                    │
    │  - /auth/register │      │  - /api/habits     │
    │  - /auth/login    │      │  - /api/user-habits│
    │  - /auth/me       │      │  - /api/checkins   │
    │                   │      │  - /api/stats      │
    │  Returns JWT ────┼──────┼─▶ Validates JWT    │
    └──────────┬────────┘      └────────┬───────────┘
               │                        │
               └────────┬───────────────┘
                        │
                 ┌──────▼────────┐
                 │   PostgreSQL   │
                 │   Database     │
                 │   Port 5432    │
                 └────────────────┘
```

### Key Architectural Decisions / Decisiones Arquitectónicas Clave

1. **Separation of Concerns / Separación de Responsabilidades**
   - Authentication service (Java) handles ONLY user registration, login, and token generation
   - Habits service (Python) handles ALL business logic for habit management
   - El servicio de autenticación (Java) maneja SOLO registro, login y generación de tokens
   - El servicio de hábitos (Python) maneja TODA la lógica de negocio para gestión de hábitos

2. **Stateless Authentication / Autenticación Sin Estado**
   - JWT tokens eliminate need for session storage
   - Each service independently validates tokens using shared secret
   - Los tokens JWT eliminan la necesidad de almacenamiento de sesiones
   - Cada servicio valida tokens independientemente usando un secreto compartido

3. **Shared Database / Base de Datos Compartida**
   - Both services access same PostgreSQL instance
   - Simplifies MVP while maintaining service boundaries
   - Ambos servicios acceden a la misma instancia de PostgreSQL
   - Simplifica el MVP mientras mantiene límites de servicio

## Component Details / Detalles de Componentes

### 1. Java Authentication Service / Servicio de Autenticación Java

**Technology Stack / Stack Tecnológico:**
- Spring Boot 3.x
- Spring Security
- JWT (io.jsonwebtoken:jjwt)
- JPA / Hibernate
- BCrypt for password hashing / BCrypt para hash de contraseñas

**Key Components / Componentes Clave:**

#### AuthController
**Responsibility / Responsabilidad:**  
Handles HTTP requests for authentication endpoints.  
Maneja solicitudes HTTP para endpoints de autenticación.

**Endpoints:**
- `POST /auth/register` - Create new user account / Crear nueva cuenta de usuario
- `POST /auth/login` - Authenticate and receive JWT / Autenticar y recibir JWT
- `GET /auth/me` - Get current user info / Obtener información del usuario actual

#### AuthService
**Responsibility / Responsabilidad:**  
Contains business logic for user registration and authentication.  
Contiene lógica de negocio para registro y autenticación de usuarios.

**Key Methods / Métodos Clave:**
- `registerUser(email, password)` - Validates email, hashes password, saves user / Valida email, hashea contraseña, guarda usuario
- `authenticateUser(email, password)` - Verifies credentials, returns user / Verifica credenciales, retorna usuario

#### JwtService
**Responsibility / Responsabilidad:**  
Encapsulates all JWT token operations.  
Encapsula todas las operaciones de tokens JWT.

**Key Methods / Métodos Clave:**
- `generateToken(email)` - Creates signed JWT with 24h expiration / Crea JWT firmado con expiración de 24h
- `extractEmail(token)` - Validates and extracts email from token / Valida y extrae email del token

**Implementation Details / Detalles de Implementación:**
```java
// Secret must match Python backend
// Secreto debe coincidir con el backend Python
SECRET = "my_super_secret_key_for_habitus_mvp_123456789"

// Token structure / Estructura del token:
// {
//   "sub": "user@example.com",  // User email
//   "iat": 1234567890,           // Issued at
//   "exp": 1234654290            // Expires (24h later)
// }
```

#### SecurityConfig
**Responsibility / Responsabilidad:**  
Configures Spring Security filters and CORS policy.  
Configura filtros de Spring Security y política CORS.

**Configuration / Configuración:**
- CSRF disabled (stateless API) / CSRF deshabilitado (API sin estado)
- CORS allows all origins for MVP / CORS permite todos los orígenes para MVP  
- Public access to `/auth/**` endpoints / Acceso público a endpoints `/auth/**`
- All other requests require authentication / Todas las demás solicitudes requieren autenticación

#### User Entity
**Responsibility / Responsabilidad:**  
JPA entity mapping to `users` table.  
Entidad JPA que mapea a la tabla `users`.

**Fields / Campos:**
- `id` (Integer, primary key)
- `email` (String, unique)
- `password` (String, bcrypt hashed / hash bcrypt)
- `name` (String, optional)
- `avatar_url` (String, optional)
- `timezone` (String, optional)
- `created_at` (Timestamp)

---

### 2. Python Habits Service / Servicio de Hábitos Python

**Technology Stack / Stack Tecnológico:**
- FastAPI
- SQLAlchemy (ORM)
- Pydantic (validation)
- python-jose (JWT validation)
- psycopg2 (PostgreSQL driver)

**Key Components / Componentes Clave:**

#### main.py
**Responsibility / Responsabilidad:**  
Application entry point, configures middleware and routes.  
Punto de entrada de la aplicación, configura middleware y rutas.

**Setup / Configuración:**
- Creates FastAPI app instance / Crea instancia de aplicación FastAPI
- Adds CORS middleware / Añade middleware CORS
- Mounts all API routers with `/api` prefix / Monta todos los routers API con prefijo `/api`

#### auth_deps.py  
**Responsibility / Responsabilidad:**  
Provides authentication dependency injection for protected endpoints.  
Provee inyección de dependencias de autenticación para endpoints protegidos.

**Key Function / Función Clave:**
```python
def get_current_user(credentials, db) -> User:
    """
    Validates JWT from Authorization header.
    Valida JWT del encabezado Authorization.
    
    1. Extract Bearer token / Extrae token Bearer
    2. Decode with shared secret / Decodifica con secreto compartido  
    3. Fetch user from database / Obtiene usuario de base de datos
    4. Return User object or raise 401 / Retorna objeto User o levanta 401
    """
```

#### API Routers / Routers de API

**habits.py**
- `GET /api/habits` - List all available habits from catalog / Listar todos los hábitos disponibles del catálogo
- `POST /api/habits` - Create custom habit (admin only) / Crear hábito personalizado (solo admin)

**user_habits.py**  
- `GET /api/user-habits` - Get user's active habits / Obtener hábitos activos del usuario
- `POST /api/user-habits` - Assign habits to user / Asignar hábitos al usuario
- Request body: `{ habit_ids: ["1", "2", "3"] }` (as strings / como cadenas)

**checkins.py**
- `POST /api/checkins` - Mark habit as done/missed for today / Marcar hábito como completado/perdido para hoy
- `GET /api/checkins` - Get check-in history / Obtener historial de check-ins

**stats.py**
- `GET /api/stats/weekly` - Weekly completion rate and streak / Tasa de cumplimiento semanal y racha
- Returns / Retorna: `{ completion_percentage, current_streak, weekly_data }`

**achievements.py**
- `GET /api/achievements` - List all possible achievements / Listar todos los logros posibles
- `GET /api/achievements/user` - Get user's unlocked achievements / Obtener logros desbloqueados del usuario

**profile.py**
- `GET /api/profile` - Get current user profile / Obtener perfil del usuario actual
- `PUT /api/profile` - Update profile fields (name, avatar, timezone) / Actualizar campos de perfil

#### models.py
**Responsibility / Responsabilidad:**  
SQLAlchemy ORM models mapping to database tables.  
Modelos ORM de SQLAlchemy que mapean a tablas de base de datos.

**Models / Modelos:**
- `User` - Maps to `users` table / Mapea a tabla `users`
- `Habit` - Maps to `habits` table (catalog) / Mapea a tabla `habits` (catálogo)
- `UserHabit` - Maps to `user_habits` table (user selections) / Mapea a tabla `user_habits` (selecciones de usuario)
- `Checkin` - Maps to `habit_tracker` table (daily records) / Mapea a tabla `habit_tracker` (registros diarios)
- `Achievement` - Maps to `achievements` table / Mapea a tabla `achievements`
- `UserAchievement` - Maps to `user_achievements` table / Mapea a tabla `user_achievements`

#### schemas.py
**Responsibility / Responsabilidad:**  
Pydantic models for request/response validation and serialization.  
Modelos Pydantic para validación y serialización de solicitudes/respuestas.

**Key Schemas / Esquemas Clave:**
- `UserRead` - User profile response / Respuesta de perfil de usuario
- `HabitRead` - Habit catalog item / Elemento del catálogo de hábitos
- `UserHabitRequest` - Request to assign habits / Solicitud para asignar hábitos
- `CheckinCreate` - Check-in submission / Envío de check-in

#### crud.py
**Responsibility / Responsabilidad:**  
Database operations layer, separates SQL logic from API handlers.  
Capa de operaciones de base de datos, separa lógica SQL de manejadores de API.

**Key Functions / Funciones Clave:**
- `get_user_by_email(db, email)` - Fetch user by email / Obtener usuario por email
- `get_habits(db)` - Get all habits / Obtener todos los hábitos
- `assign_habit_to_user(db, user_id, habit_id)` - Create user-habit relationship / Crear relación usuario-hábito
- `create_checkin(db, checkin_data)` - Record habit completion / Registrar cumplimiento de hábito

---

### 3. Frontend / Frontend

**Technology / Tecnología:** Vanilla JavaScript (ES6 modules), CSS3

**Architecture Pattern / Patrón de Arquitectura:** Single Page Application (SPA) with client-side routing

**Key Modules / Módulos Clave:**

#### main.js
**Responsibility / Responsabilidad:**  
Application bootstrap and initialization.  
Arranque e inicialización de la aplicación.

**Functions / Funciones:**
- `DOMContentLoaded` event - Initializes navigation, logout, and routing / Inicializa navegación, logout y enrutamiento
- Determines initial view based on auth state / Determina vista inicial basada en estado de autenticación

#### router.js
**Responsibility / Responsabilidad:**  
Client-side routing logic, manages view transitions.  
Lógica de enrutamiento del cliente, gestiona transiciones de vistas.

**Key Function / Función Clave:**
```javascript
navigateTo(viewName) {
  // 1. Check authentication / Verificar autenticación
  // 2. Hide all views / Ocultar todas las vistas
  // 3. Show target view / Mostrar vista objetivo  
  // 4. Call view render function / Llamar función de renderizado
  // 5. Update navigation state / Actualizar estado de navegación
}
```

**Routing Table / Tabla de Enrutamiento:**
- `login` → `renderLogin()` (unauthenticated) / (no autenticado)
- `profile` → `renderProfile()` (authenticated, default home) / (autenticado, inicio predeterminado)
- `habits` → `renderHabits()` (authenticated) / (autenticado)

#### state.js
**Responsibility / Responsabilidad:**  
Global application state management with localStorage persistence.  
Gestión de estado global de la aplicación con persistencia en localStorage.

**State / Estado:**
```javascript
{
  authToken: string | null,     // JWT token
  currentUser: { email } | null // User data
}
```

**Key Functions / Funciones Clave:**
- `setAuth(token, user)` - Stores auth data in memory and localStorage / Almacena datos de auth en memoria y localStorage
- `getToken()` - Retrieves token from memory or localStorage / Obtiene token de memoria o localStorage
- `clearAuth()` - Removes all auth data / Elimina todos los datos de auth

#### View Modules / Módulos de Vista

**loginView.js**
- Renders login and registration forms / Renderiza formularios de login y registro
- Validates input / Valida entrada
- Calls `authApi.login()` or `authApi.register()` / Llama a `authApi.login()` o `authApi.register()`
- Shows success/error notifications / Muestra notificaciones de éxito/error
- Navigates to profile on success / Navega a perfil en caso de éxito

**profileView.js**
- Displays user information / Muestra información del usuario
- Allows editing profile fields / Permite editar campos de perfil
- Embeds daily checklist and weekly progress sub-views / Integra sub-vistas de checklist diaria y progreso semanal
- Manages tab navigation between daily/weekly / Gestiona navegación de pestañas entre diario/semanal

**habitsView.js**
- Loads habit catalog / Carga catálogo de hábitos
- Provides category filtering (all, wellness, health, academic, work) / Provee filtrado por categoría
- Manages habit selection state / Gestiona estado de selección de hábitos
- Saves selected habits to backend / Guarda hábitos seleccionados al backend

**dailyChecklistView.js**
- Lists today's active habits / Lista hábitos activos de hoy
- Provides "Done" / "Missed" buttons / Provee botones "Hecho" / "Perdido"
- Updates completion status / Actualiza estado de cumplimiento
- Displays progress bar / Muestra barra de progreso

**dashboardView.js**
- Shows weekly statistics / Muestra estadísticas semanales
- Displays current streak / Muestra racha actual
- Lists unlocked achievements / Lista logros desbloqueados

#### API Modules / Módulos de API

**authApi.js**
- `login(email, password)` - Calls Java backend, stores token / Llama backend Java, almacena token
- `register(email, password)` - Creates new account / Crea nueva cuenta
- Returns `{ token, email }` on success / Retorna `{ token, email }` en caso de éxito

**habitsApi.js**  
- `fetchHabits()` - Get habit catalog / Obtener catálogo de hábitos
- `saveUserHabits(habit_ids)` - Assign habits to user / Asignar hábitos al usuario
- `getProfile()` - Fetch user profile / Obtener perfil de usuario
- `updateProfile(data)` - Update profile fields / Actualizar campos de perfil
- `fetchDailyChecklist()` - Get today's habits / Obtener hábitos de hoy
- `saveDailyStatus(id, completed)` - Mark habit done/missed / Marcar hábito hecho/perdido
- `fetchWeeklyStatsAndAchievements()` - Get weekly data / Obtener datos semanales

All functions include Authorization header with JWT.  
Todas las funciones incluyen encabezado Authorization con JWT.

**components/notifications.js**
- `showNotification(message, type)` - Displays toast notifications / Muestra notificaciones toast
- Types / Tipos: `success`, `error`, `info`
- Auto-dismiss after 5 seconds / Auto-cierra después de 5 segundos

---

### 4. Database / Base de Datos

**Technology / Tecnología:** PostgreSQL 14+

**Schema Design / Diseño de Esquema:**

**users** table / tabla **users**
- Stores user accounts and profiles / Almacena cuentas de usuario y perfiles
- Accessed by both Java and Python services / Accedida por ambos servicios Java y Python
- Primary key: `id` (SERIAL)

**habits** table / tabla **habits**
- Predefined habit catalog / Catálogo de hábitos predefinidos
- Fields / Campos: `id`, `name`, `category`, `frequency`
- Populated by seed data / Poblada por datos de inicialización

**user_habits** table / tabla **user_habits**
- Many-to-many relationship between users and habits / Relación muchos-a-muchos entre usuarios y hábitos
- Tracks which habits each user has activated / Rastrea qué hábitos ha activado cada usuario
- Fields / Campos: `id`, `user_id` (FK), `habit_id` (FK), `is_active`

**habit_tracker** table / tabla **habit_tracker**
- Daily check-in records / Registros de check-in diarios
- One row per user-habit-date combination / Una fila por combinación usuario-hábito-fecha
- Fields / Campos: `id`, `user_habit_id` (FK), `date`, `completed`

**achievements** table / tabla **achievements**
- Achievement definitions / Definiciones de logros
- Fields / Campos: `id`, `title`, `description`, `condition`

**user_achievements** table / tabla **user_achievements**
- Tracks unlocked achievements per user / Rastrea logros desbloqueados por usuario
- Fields / Campos: `id`, `user_id` (FK), `achievement_id` (FK), `unlocked_at`

---

## Data Flow Examples / Ejemplos de Flujo de Datos

### 1. User Registration Flow / Flujo de Registro de Usuario

```
Frontend                 Java Backend              Database
   │                         │                        │
   │ POST /auth/register     │                        │
   ├────────────────────────►│                        │
   │ {email, password}       │                        │
   │                         │                        │
   │                         │ Hash password          │
   │                         │ with BCrypt            │
   │                         │                        │
   │                         │ INSERT INTO users      │
   │                         ├───────────────────────►│
   │                         │                        │
   │                         │◄───────────────────────┤
   │                         │ User row created       │
   │                         │                        │
   │                         │ Generate JWT           │
   │                         │ (email as subject)     │
   │                         │                        │
   │◄────────────────────────┤                        │
   │ {token: "JWT..."}       │                        │
   │                         │                        │
   │ Store in localStorage   │                        │
   │ Navigate to /profile    │                        │
```

### 2. Habit Selection Flow / Flujo de Selección de Hábitos

```
Frontend                Python Backend            Database
   │                         │                        │
   │ GET /api/habits         │                        │
   ├────────────────────────►│                        │
   │ Authorization: Bearer   │                        │
   │                         │                        │
   │                         │ Validate JWT           │
   │                         │                        │
   │                         │ SELECT * FROM habits   │
   │                         ├───────────────────────►│
   │                         │◄───────────────────────┤
   │◄────────────────────────┤                        │
   │ [{id,name,category}]    │                        │
   │                         │                        │
   │ User selects habits     │                        │
   │                         │                        │
   │ POST /api/user-habits   │                        │
   ├────────────────────────►│                        │
   │ {habit_ids:["1","3"]}   │                        │
   │                         │                        │
   │                         │ Validate JWT           │
   │                         │ Extract user_id        │
   │                         │                        │
   │                         │ INSERT user_habits     │
   │                         ├───────────────────────►│
   │                         │◄───────────────────────┤
   │◄────────────────────────┤                        │
   │ Success                 │                        │
```

### 3. Daily Check-in Flow / Flujo de Check-in Diario

```
Frontend                Python Backend            Database
   │                         │                        │
   │ GET /api/user-habits    │                        │
   ├────────────────────────►│                        │
   │                         │                        │
   │◄────────────────────────┤                        │
   │ User's active habits    │                        │
   │                         │                        │
   │ User clicks "Done"      │                        │
   │                         │                        │
   │ POST /api/checkins      │                        │
   ├────────────────────────►│                        │
   │ {habit_id, completed}   │                        │
   │                         │                        │
   │                         │ INSERT habit_tracker   │
   │                         ├───────────────────────►│
   │                         │ date=today             │
   │                         │ completed=true         │
   │                         │◄───────────────────────┤
   │◄────────────────────────┤                        │
   │ Success + updated stats │                        │
```

---

## Security Considerations / Consideraciones de Seguridad

### Authentication / Autenticación
- Passwords hashed with BCrypt (cost factor 10) / Contraseñas hasheadas con BCrypt (factor de costo 10)
- JWT tokens signed with HMAC SHA-256 / Tokens JWT firmados con HMAC SHA-256
- Tokens expire after 24 hours / Tokens expiran después de 24 horas

### Authorization / Autorización  
- All Python endpoints require valid JWT / Todos los endpoints Python requieren JWT válido
- User can only access their own data / Usuario solo puede acceder a sus propios datos
- `get_current_user` dependency ensures data isolation / Dependencia `get_current_user` asegura aislamiento de datos

### CORS Policy / Política CORS
- Development: Allow all origins (`*`) / Desarrollo: Permitir todos los orígenes (`*`)
- Production: Should restrict to specific frontend URL / Producción: Debería restringir a URL específica del frontend

### Data Validation / Validación de Datos
- Pydantic schemas validate all API inputs / Esquemas Pydantic validan todas las entradas de API
- SQL injection prevented by ORM (SQLAlchemy) / Inyección SQL prevenida por ORM (SQLAlchemy)
- Frontend validates before sending / Frontend valida antes de enviar

---

## Design Principles Applied / Principios de Diseño Aplicados

### 1. Single Responsibility Principle (SRP)
**Java:**
- `AuthController` → HTTP handling only / Solo manejo HTTP
- `AuthService` → Business logic only / Solo lógica de negocio
- `JwtService` → Token operations only / Solo operaciones de tokens
- `UserRepository` → Data access only / Solo acceso a datos

**Python:**
- Routers → HTTP endpoints / Endpoints HTTP
- CRUD → Database operations / Operaciones de base de datos
- Schemas → Validation / Validación
- Models → ORM mapping / Mapeo ORM

**Frontend:**
- Views → UI rendering / Renderizado de UI
- API modules → HTTP requests / Solicitudes HTTP
- State → Data management / Gestión de datos
- Router → Navigation / Navegación

### 2. Dependency Inversion Principle (DIP)
- High-level modules (controllers) depend on abstractions (interfaces/dependencies), not concrete classes
- Los módulos de alto nivel (controladores) dependen de abstracciones (interfaces/dependencias), no de clases concretas

**Example / Ejemplo:**
```python
def create_habit(
    db: Session = Depends(get_db),  # Injected dependency
    user: User = Depends(get_current_user)  # Injected dependency
):
    # Function doesn't create its own dependencies
    # Función no crea sus propias dependencias
```

### 3. Separation of Concerns / Separación de Responsabilidades
- Authentication vs Business Logic (different services) / Autenticación vs Lógica de Negocio (diferentes servicios)
- Presentation vs Logic vs Data (layered architecture) / Presentación vs Lógica vs Datos (arquitectura en capas)
- Frontend routing vs Backend routing (independent) / Enrutamiento frontend vs backend (independiente)

### 4. DRY (Don't Repeat Yourself)
- Shared JWT secret between services / Secreto JWT compartido entre servicios
- Reusable API client functions / Funciones de cliente API reutilizables
- Common notification system / Sistema de notificaciones común

---

## API Contract / Contrato de API

### Authentication Endpoints / Endpoints de Autenticación

**POST /auth/register**
```json
Request:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Errors:
- 409: Email already exists
- 400: Invalid email format
```

**POST /auth/login**
```json
Request:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Errors:
- 401: Invalid credentials
- 404: User not found
```

### Habits Endpoints / Endpoints de Hábitos

All require `Authorization: Bearer <token>` header.  
Todos requieren encabezado `Authorization: Bearer <token>`.

**POST /api/user-habits**
```json
Request:
{
  "habit_ids": ["1", "2", "3"]  // As strings!
}

Response (201):
[
  {
    "id": 1,
    "user_id": 5,
    "habit_id": 1,
    "is_active": true
  }
]

Error:
- 422: Invalid habit_ids format
- 401: Invalid/missing token
```

---

## MVP Limitations & Future Improvements / Limitaciones del MVP y Mejoras Futuras

### Current Limitations / Limitaciones Actuales
1. **Shared Database** - Both services access same DB / Ambos servicios acceden a la misma BD
   - Future: Separate databases with event-driven sync / Futuro: Bases de datos separadas con sincronización por eventos

2. **Hardcoded Secret** - JWT secret in source code / Secreto JWT en código fuente
   - Future: Environment variables / Futuro: Variables de entorno

3. **No Rate Limiting** - Vulnerable to abuse / Vulnerable a abuso
   - Future: Add rate limiting middleware / Futuro: Añadir middleware de limitación de tasa

4. **Basic Error Handling** - Generic error messages / Mensajes de error genéricos
   - Future: Detailed error codes and logging / Futuro: Códigos de error detallados y registro

5. **No Email Verification** - Users can register with any email / Usuarios pueden registrarse con cualquier email
   - Future: Email confirmation flow / Futuro: Flujo de confirmación por email

6. **CORS Allow All** - Security risk in production / Riesgo de seguridad en producción
   - Future: Whitelist specific origins / Futuro: Lista blanca de orígenes específicos

### Potential Enhancements / Mejoras Potenciales
1. **Caching** - Redis for session/frequently accessed data / Redis para sesión/datos frecuentes
2. **Real-time Updates** - WebSockets for live progress updates / WebSockets para actualizaciones en vivo
3. **Analytics** - Track usage patterns and insights / Rastrear patrones de uso y conocimientos
4. **Social Features** - Friends, challenges, leaderboards / Amigos, desafíos, tablas de clasificación
5. **Mobile Apps** - React Native or Flutter clients / Clientes React Native o Flutter

---

## Deployment Considerations / Consideraciones de Despliegue

### Docker Containerization / Containerización Docker
Each service should have its own Dockerfile:
- Java: Multi-stage build with Maven / Compilación multi-etapa con Maven
- Python: Requirements installation + gunicorn / Instalación de requisitos + gunicorn
- Frontend: Nginx serving static files / Nginx sirviendo archivos estáticos

### Environment Variables / Variables de Entorno
```bash
# Java Backend
DB_URL=jdbc:postgresql://db:5432/habitusdb
DB_USER=habitususer
DB_PASSWORD=habituspass
JWT_SECRET=<strong-secret-here>

# Python Backend
DATABASE_URL=postgresql://habitususer:habituspass@db:5432/habitusdb
JWT_SECRET=<same-as-java>

# Frontend
API_JAVA_URL=https://api.habitus.com/auth
API_PYTHON_URL=https://api.habitus.com/api
```

### Health Checks / Verificaciones de Salud
- Java: `GET /actuator/health`
- Python: `GET /` (returns API status)
- Database: pg_isready

---

**Last Updated / Última Actualización:** 2025-12-03  
**Version / Versión:** 1.0 MVP

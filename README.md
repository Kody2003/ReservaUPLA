# ReservaUPLA

Sistema web para **gestión y reserva de ambientes universitarios** (aulas, laboratorios, auditorios) de la Universidad Peruana Los Andes (UPLA).
Actividad individual del curso *Construcción de Software*.

- **Backend:** .NET 8, Clean Architecture (Domain, Application, Infrastructure, API) + xUnit/Moq (41 pruebas unitarias en verde).
- **Base de datos:** PostgreSQL con Entity Framework Core 8 y Npgsql 8.x.
- **Frontend:** React 18 + TypeScript + Vite, modo oscuro completo (CSS custom properties) y diseño accesible (WAI-ARIA).
- **Seguridad:** Autenticación con JWT (JSON Web Tokens), derivación de claves con PBKDF2 y HMAC-SHA256 con sal aleatoria, control de acceso basado en roles (RBAC).

---

## Requisitos previos

- **.NET SDK 8.0**
- **Node.js 20.19 o superior** (y npm)
- **PostgreSQL 14 o superior**
- **Git**
- Herramienta global de migraciones de .NET:
  ```powershell
  dotnet tool install --global dotnet-ef --version "8.*"
  ```

---

## Estructura del proyecto

```
ReservaUPLA/
├── backend/
│   ├── ReservaUPLA.sln
│   ├── src/ReservaUPLA.Domain          Entidades, enums y reglas de negocio puras (RN-03..RN-06)
│   ├── src/ReservaUPLA.Application     DTOs, interfaces (IPasswordHasher, ITokenService), Result<T>, servicios
│   ├── src/ReservaUPLA.Infrastructure  DbContext (Fluent API), repositorios, PasswordHasher y TokenService
│   ├── src/ReservaUPLA.API             Controladores REST, AuthController, autenticación JWT, middleware
│   └── tests/ReservaUPLA.Tests         Pruebas unitarias xUnit + Moq (41 pruebas en verde)
├── frontend/                           React + TypeScript + Vite
│   ├── src/components/ui/              Componentes UI reutilizables (Campo, Icono, Button, ModalConfirmacion)
│   ├── src/components/layout/          Barra superior UPLA, menú de usuario accesible, pie de página
│   ├── src/contexts/                   AuthContext (JWT y sesión) y TemaContext (modo claro/oscuro)
│   ├── src/pages/                      Login, Dashboard, Reservas, NuevaReserva, Ambientes, Usuarios, Configuración
│   └── src/services/                   Cliente HTTP (apiClient), authService, reservasService, etc.
├── database/01_init.sql                Esquema DDL completo + datos de prueba (seed)
└── docs/                               Documentación, análisis, evidencia de pruebas y guía de sustentación
```

---

## Cómo ejecutarlo

### 1. Configurar secretos de desarrollo (user-secrets)
Los secretos y contraseñas **nunca** se almacenan en el repositorio ni en archivos de configuración planos. Ejecuta en PowerShell:

```powershell
cd backend

# Cadena de conexión a PostgreSQL local
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=reservaupla;Username=postgres;Password=<TU_PASSWORD_POSTGRES>" --project src/ReservaUPLA.API

# Clave simétrica secreta para firma de tokens JWT (mínimo 32 caracteres)
dotnet user-secrets set "Jwt:Key" "<CLAVE_SECRETA_JWT_MINIMO_32_CARACTERES_EJ_MI_CLAVE_SUPER_SEGURA_2026>" --project src/ReservaUPLA.API

# Contraseña maestra para inicializar los usuarios demo en entorno de desarrollo
dotnet user-secrets set "Seed:PasswordDemo" "<TU_PASSWORD_PARA_USUARIOS_DEMO>" --project src/ReservaUPLA.API
```

> **Nota:** Puedes consultar `backend/src/ReservaUPLA.API/appsettings.Example.json` para observar la estructura general sin valores reales.

---

### 2. Base de datos

Asegúrate de tener creada la base de datos `reservaupla` en tu servidor PostgreSQL local. Luego aplica el esquema:

- **Opción A (Migraciones de EF Core - recomendada):**
  ```powershell
  dotnet ef database update --project src/ReservaUPLA.Infrastructure --startup-project src/ReservaUPLA.API
  ```
  *Posteriormente, ejecuta `database/01_init.sql` con `psql` para cargar los registros de prueba (ambientes y reservas iniciales).*

- **Opción B (Script SQL directo):**
  ```powershell
  psql -U postgres -d reservaupla -f ../database/01_init.sql
  ```
  *(El script contiene sentencias idempotentes `IF NOT EXISTS` y `ON CONFLICT DO NOTHING`, por lo que no duplica registros al reejecutarse).*

---

### 3. Iniciar el Backend (.NET API)

```powershell
dotnet run --project src/ReservaUPLA.API
```
- API REST activa en: `http://localhost:5080`
- Documentación interactiva Swagger UI con soporte Bearer JWT: `http://localhost:5080/swagger`

---

### 4. Iniciar el Frontend (React + Vite)

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```
- Aplicación web accesible en: `http://localhost:5173`

---

## Usuarios de demostración (Seed)

Para facilitar la evaluación y sustentación, el sistema cuenta con usuarios preconfigurados en la base de datos.
En modo desarrollo (`Development`), el sistema inicializa sus contraseñas con el valor configurado en el secreto `Seed:PasswordDemo`. Además, en la pantalla de inicio de sesión se proporcionan botones de acceso rápido para demostración.

| Rol | Nombre completo | Correo institucional | Estado | Propósito de prueba |
|---|---|---|---|---|
| **Administrador** | Marta Quispe | `marta.quispe@ejemplo.edu.pe` | Activo | Gestión integral, aprobación/rechazo de reservas, dashboard, usuarios y ambientes. |
| **Solicitante** | Ana Torres | `ana.torres@ejemplo.edu.pe` | Activo | Solicitud de reservas, visualización y cancelación exclusiva de sus propias reservas. |
| **Solicitante** | Luis Rojas | `luis.rojas@ejemplo.edu.pe` | Activo | Comprobación de aislamiento entre distintos solicitantes (no ve reservas de Ana). |
| **ResponsableAmbiente** | Carlos Huamán | `carlos.huaman@ejemplo.edu.pe` | Activo | Consulta global de reservas y ambientes para supervisión física. |
| **Solicitante** | Pedro Salas | `pedro.salas@ejemplo.edu.pe` | **Inactivo** | Comprobación del bloqueo de acceso a cuentas desactivadas. |

> *Las contraseñas de estos usuarios se definen individualmente mediante `dotnet user-secrets set "Seed:PasswordDemo" "<clave>"`.*

---

## Matriz de permisos por rol

| Módulo / Acción | Administrador | Responsable de Ambiente | Solicitante |
|---|:---:|:---:|:---:|
| **Dashboard general (RF-08)** | ✅ Acceso completo | ❌ | ❌ |
| **Ver todas las reservas (RF-05)** | ✅ Todas | ✅ Todas | ❌ Solo las propias |
| **Ver detalle de reserva (RF-06)** | ✅ Cualquier reserva | ✅ Cualquier reserva | ❌ Solo reservas propias (404 ajenas) |
| **Crear nueva reserva (RF-03)** | ✅ Para cualquier usuario | ✅ Para sí mismo | ✅ Para sí mismo |
| **Aprobar / Rechazar reservas (RN-05)** | ✅ Exclusivo | ❌ | ❌ |
| **Cancelar reserva (RF-07)** | ✅ Cualquier reserva | ✅ Cualquier reserva | ✅ Solo reservas propias |
| **Listar ambientes (RF-02)** | ✅ | ✅ | ✅ (en formulario de reserva) |
| **Registrar nuevos ambientes (RF-02)**| ✅ Exclusivo | ❌ | ❌ |
| **Listar usuarios (RF-01)** | ✅ Exclusivo | ❌ | ❌ |
| **Registrar usuarios (RF-01)** | ✅ Exclusivo | ❌ | ❌ |
| **Cambiar contraseña personal** | ✅ | ✅ | ✅ |

---

## Endpoints de la API REST

### Autenticación y Perfil (`/api/auth`)
| Método | Ruta | Autorización | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/login` | Anónimo | Inicia sesión validando credenciales y devuelve token JWT con datos de usuario. |
| `GET` | `/api/auth/yo` | Autenticado | Obtiene la información del perfil del usuario actualmente autenticado. |
| `PATCH` | `/api/auth/contrasena` | Autenticado | Actualiza la contraseña personal validando la clave actual y reglas de complejidad. |
| `POST` | `/api/auth/demo` | Anónimo (Solo Dev) | Acceso de demostración directa por rol según seeder de desarrollo. |

### Reservas (`/api/reservas`)
| Método | Ruta | Autorización | Requisito / Regla |
|---|---|---|---|
| `POST` | `/api/reservas` | Autenticado | RF-03 / RN-01, RN-02, RN-03, RN-04. Solicitantes reservan a su nombre. |
| `GET` | `/api/reservas/disponibilidad` | Autenticado | RF-04. Verifica cruces de horario para fecha y ambiente. |
| `GET` | `/api/reservas` | Autenticado | RF-05. Administrador y Responsable ven todas; Solicitante solo las suyas. |
| `GET` | `/api/reservas/{id}` | Autenticado | RF-06. Detalle de reserva. Si es ajena a un Solicitante devuelve 404. |
| `PATCH` | `/api/reservas/{id}/estado` | Autenticado | RF-07 / RN-05, RN-06. Aprobar/Rechazar solo Administrador. Cancelar: el Solicitante solo las suyas; Responsable y Administrador, cualquiera. |

### Ambientes y Usuarios
| Método | Ruta | Autorización | Descripción |
|---|---|---|---|
| `GET` | `/api/ambientes` | Autenticado | Listar catálogo de ambientes (RF-02). |
| `POST` | `/api/ambientes` | Administrador | Crear nuevo ambiente (RF-02). |
| `GET` | `/api/usuarios` | Administrador | Listar catálogo de usuarios (RF-01). |
| `POST` | `/api/usuarios` | Administrador | Registrar nuevo usuario con contraseña inicial (RF-01). |
| `GET` | `/api/dashboard` | Administrador | Métricas e indicadores consolidados de reservas (RF-08). |

---

## Validación de Reglas de Negocio

| Regla | Backend (Fuente de verdad) | Frontend (Reflejo UX) |
|---|---|---|
| **RN-01** (Sin solapamiento en Aprobadas) | `ReservaService`, `ReservaRepository.ExisteSolapamientoAprobadoAsync`, `Reserva.Aprobar` | Hook `useDisponibilidad` y comprobación en formulario. |
| **RN-02** (Campos obligatorios) | Entidades del dominio y validaciones en servicios | Componente universal `Campo` con asteriscos y advertencias contextuales. |
| **RN-03** (Hora fin > hora inicio) | `Reserva.ValidarHorario` (y restricción CHECK en PostgreSQL) | Validación reactiva al perder foco o al enviar formulario. |
| **RN-04** (Horario permitido 07:00–22:00)| `Reserva.ValidarHorario` (y restricción CHECK en PostgreSQL) | Validación en `Campo` tipo hora y bloqueo en formulario. |
| **RN-05** (Solo Administrador aprueba/rechaza)| Políticas `[Authorize(Roles = "Administrador")]` y método `Reserva.Aprobar/Rechazar` | Ocultamiento de botones de acción para otros roles. |
| **RN-06** (Reserva rechazada es inmutable) | `Reserva.Aprobar`, `Reserva.Rechazar`, `Reserva.Cancelar` | Ocultamiento de modales y botones en estado Rechazada. |

---

## Pruebas automáticas

El backend cuenta con **41 pruebas unitarias** que verifican el cumplimiento estricto de la arquitectura limpia, reglas de negocio, seguridad criptográfica y aislamiento de roles:

```powershell
# Ejecución de toda la suite de pruebas
dotnet test backend/ReservaUPLA.sln

# Filtrar pruebas específicas de reglas de negocio
dotnet test backend/ReservaUPLA.sln --filter "FullyQualifiedName~RN"
```

---

## Imágenes

Fuente de las imágenes: <completar por el estudiante>

# ReservaUPLA

Sistema web para **reservar ambientes** (aulas, laboratorios, auditorios) de la universidad.
Actividad individual de 9 semanas del curso *Construcción de Software*.

- **Backend:** .NET 8, Clean Architecture (Domain, Application, Infrastructure, API) + xUnit/Moq
- **Base de datos:** PostgreSQL con EF Core 8 y Npgsql 8.x
- **Frontend:** React + TypeScript + Vite

## Requisitos previos

.NET SDK 8, Node.js 20.19 o superior, PostgreSQL y git. Herramienta de migraciones: `dotnet tool install --global dotnet-ef --version "8.*"`.

## Estructura

```
ReservaUPLA/
├── backend/
│   ├── ReservaUPLA.sln
│   ├── src/ReservaUPLA.Domain          entidades, enums y reglas (RN-03..RN-06)
│   ├── src/ReservaUPLA.Application     DTOs, interfaces, Result<T>, servicios (RN-01, RN-02)
│   ├── src/ReservaUPLA.Infrastructure  DbContext (Fluent API) y repositorios
│   ├── src/ReservaUPLA.API             controladores, middleware, Program.cs
│   └── tests/ReservaUPLA.Tests         pruebas xUnit + Moq
├── frontend/                           React + TypeScript + Vite
├── database/01_init.sql                tablas + datos de prueba
└── docs/                               análisis, estándares, evidencias, guía de sustentación
```

## Cómo ejecutarlo

1. **Crear la estructura** con los comandos de la PARTE 1 y copiar encima los archivos de este proyecto (se sobrescriben `Program.cs`, `appsettings.json`, `launchSettings.json`, `main.tsx`, `App.tsx`, `index.css` e `index.html`).
2. **Ajustes que no estaban en la PARTE 1** (ejecutar una vez):
   ```powershell
   cd backend
   dotnet add src/ReservaUPLA.API package Swashbuckle.AspNetCore --version "6.*"
   cd ../frontend
   npm install react-router-dom
   Remove-Item src/App.css -ErrorAction SilentlyContinue
   ```
3. **Secretos** (nunca van al repositorio). Cambia los valores entre `< >`:
   ```powershell
   cd ../backend
   dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=reservaupla;Username=postgres;Password=<TU_PASSWORD>" --project src/ReservaUPLA.API
   dotnet user-secrets set "Admin:ApiKey" "<INVENTA_UNA_CLAVE>" --project src/ReservaUPLA.API
   ```
   `src/ReservaUPLA.API/appsettings.Example.json` muestra el formato con valores falsos.
4. **Base de datos** (elige una forma):
   - *Con migraciones:* `dotnet ef migrations add InitialCreate --project src/ReservaUPLA.Infrastructure --startup-project src/ReservaUPLA.API --output-dir Persistence/Migrations` y luego `dotnet ef database update ...` (mismos `--project` y `--startup-project`).
   - *Con el script:* `psql -U postgres -d reservaupla -f ../database/01_init.sql`.
   - Para tener datos de prueba (dashboard) corre el script **también** después de las migraciones: no duplica nada.
5. **API:** `dotnet run --project src/ReservaUPLA.API` → Swagger en <http://localhost:5080/swagger>.
6. **Frontend:** `cd ../frontend`, `Copy-Item .env.example .env`, `npm install`, `npm run dev` → <http://localhost:5173>.

## Roles y autenticación mínima (RN-05)

No hay login completo. Para distinguir al **Administrador**, el frontend envía la cabecera `X-Admin-Key` con la clave guardada en `Admin:ApiKey`. En la pantalla se escribe la clave en «Clave de administrador» (modo administrador). Sin clave correcta, aprobar o rechazar responde 403 (RN-05). Para algo real se reemplazaría por JWT: solo cambia `RolActualProvider`.

## Endpoints

| Método | Ruta | Requisito |
|---|---|---|
| POST / GET | `/api/usuarios` | RF-01 |
| POST / GET | `/api/ambientes` | RF-02 |
| POST | `/api/reservas` | RF-03 |
| GET | `/api/reservas/disponibilidad?ambienteId=&fecha=&horaInicio=&horaFin=` | RF-04 |
| GET | `/api/reservas?estado=&ambienteId=&fecha=` | RF-05 |
| GET | `/api/reservas/{id}` | RF-06 |
| PATCH | `/api/reservas/{id}/estado` (`{"nuevoEstado":"Aprobada"}`) | RF-07 |
| GET | `/api/dashboard` | RF-08 |

Los errores llegan como `ProblemDetails` (400 datos, 403 RN-05, 404, 409 RN-01/RN-06).

## Dónde se valida cada regla

| Regla | Backend (fuente de verdad) | Frontend (reflejo) |
|---|---|---|
| RN-01 | `ReservaService` + `ReservaRepository.ExisteSolapamientoAprobadoAsync` + `Reserva.Aprobar` | `useDisponibilidad` (mensaje y botón) |
| RN-02 | servicios y `Reserva.Crear` | `useValidacionReserva` y formularios |
| RN-03 / RN-04 | `Reserva.ValidarHorario` (y CHECK en la BD) | `validarReserva` |
| RN-05 | `Reserva.Aprobar/Rechazar` + `RolActualProvider` | botones deshabilitados sin modo administrador |
| RN-06 | `Reserva.Aprobar/Rechazar/Cancelar` | sin acciones si está Rechazada |

## Pruebas

```powershell
dotnet test backend/ReservaUPLA.sln
```

## Supuestos [SUPUESTO]

- Solo se puede aprobar o rechazar una reserva *Pendiente*; cancelar se permite desde Pendiente o Aprobada y no exige ser Administrador.
- No se puede reservar un ambiente que no esté *Disponible* ni con un usuario *inactivo*.
- «Ambiente más utilizado» = el que tiene más reservas *Aprobadas*.
- El correo de un usuario no se repite.
- Una reserva Pendiente que se cruza con una Aprobada se rechaza al crearla (RF-04) y se vuelve a revisar al aprobar (RN-01).

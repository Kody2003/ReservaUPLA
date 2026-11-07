# S01 — Análisis del sistema ReservaUPLA

Documento de análisis de requisitos, actores, casos de uso, reglas de negocio y arquitectura del sistema **ReservaUPLA**.

---

## 1. Problema y alcance

La universidad necesita gestionar y ordenar el uso compartido de sus ambientes físicos (aulas, laboratorios y auditorios), evitando conflictos de horario y garantizando que ningún ambiente sea ocupado simultáneamente por dos grupos distintos.

- **Dentro del alcance:**
  - Gestión y autenticación de usuarios mediante credenciales y tokens JWT (CU-09, CU-10).
  - Catálogo de usuarios y ambientes universitarios (RF-01, RF-02).
  - Registro de solicitudes de reserva de ambientes con validación estricta de horarios (RF-03, RF-04).
  - Consulta de reservas y filtrado con aislamiento por rol (RF-05, RF-06).
  - Aprobación, rechazo y cancelación de reservas bajo reglas de negocio RN-01 a RN-06 (RF-07).
  - Panel analítico (Dashboard) con métricas consolidadas para la administración (RF-08).
  - Modo visual dual (claro y oscuro) con accesibilidad web.
- **Fuera del alcance:**
  - Cobros o pagos por reserva.
  - Envío de notificaciones por correo electrónico o SMS.
  - Registro público de usuarios (auto-registro).
  - Recuperación de contraseñas por enlace externo o integración con OAuth/SAML institucional.

---

## 2. Actores del sistema

| Actor | Descripción y responsabilidades |
|---|---|
| **Solicitante** | Docente, estudiante o personal administrativo que requiere un ambiente. Inicia sesión, solicita reservas a su nombre, consulta únicamente sus propias reservas y puede cancelar sus reservas pendientes o aprobadas. |
| **ResponsableAmbiente** | Encargado o custodio físico de los ambientes (laboratorista, personal de mantenimiento). Consulta el calendario general de reservas y la lista de ambientes para la apertura de puertas y supervisión operativa. |
| **Administrador** | Responsable de la gestión académica de espacios. Aprueba o rechaza solicitudes (RN-05), registra nuevos ambientes y usuarios, cancela cualquier reserva y analiza los indicadores del dashboard. |

---

## 3. Casos de uso

| Código | Caso de uso | Actor principal | Requisito / Regla | Descripción resumida |
|---|---|---|---|---|
| **CU-01** | Registrar usuario | Administrador | RF-01, RN-02 | Registra un nuevo usuario asignándole rol y contraseña inicial con hash. |
| **CU-02** | Registrar ambiente | Administrador | RF-02, RN-02 | Registra aulas, laboratorios o auditorios con su capacidad y ubicación. |
| **CU-03** | Registrar reserva | Solicitante | RF-03, RN-01..RN-04 | Crea una solicitud en estado Pendiente validando rango horario y disponibilidad. |
| **CU-04** | Validar disponibilidad | Solicitante | RF-04, RN-01 | Comprueba en tiempo real si un horario está libre de cruces con reservas aprobadas. |
| **CU-05** | Listar reservas | Todos | RF-05 | Administrador y Responsable ven todas; Solicitante ve solo sus propias reservas. |
| **CU-06** | Ver detalle de reserva | Todos | RF-06 | Muestra datos completos. Si un Solicitante consulta una ajena, recibe 404. |
| **CU-07** | Cambiar estado de reserva | Administrador / Usuario | RF-07, RN-01, RN-05, RN-06 | Administrador aprueba o rechaza. El Solicitante cancela solo las suyas; Responsable y Administrador, cualquiera. |
| **CU-08** | Ver dashboard | Administrador | RF-08 | Visualiza totales, ranking de ambientes más utilizados y reservas por fecha. |
| **CU-09** | Iniciar sesión | Todos | LOGIN, RN-02 | Autenticación con correo y contraseña para obtener un token JWT con claims. |
| **CU-10** | Cambiar contraseña | Todos autenticados | LOGIN, RN-02 | Permite al usuario actualizar su contraseña validando la actual y complejidad. |

```mermaid
flowchart LR
    S([Solicitante])
    R([ResponsableAmbiente])
    A([Administrador])

    subgraph Autenticación
        CU09[CU-09 Iniciar sesión]
        CU10[CU-10 Cambiar contraseña]
    end

    subgraph Gestión de Reservas
        CU03[CU-03 Registrar reserva]
        CU04[CU-04 Validar disponibilidad]
        CU05[CU-05 Listar reservas]
        CU06[CU-06 Ver detalle]
        CU07[CU-07 Cambiar estado]
    end

    subgraph Administración y Catálogos
        CU01[CU-01 Registrar usuario]
        CU02[CU-02 Registrar ambiente]
        CU08[CU-08 Ver dashboard]
    end

    S --> CU09
    S --> CU10
    S --> CU03
    S --> CU05
    S --> CU06
    S --> CU07
    CU03 -. incluye .-> CU04

    R --> CU09
    R --> CU10
    R --> CU05
    R --> CU06
    R --> CU07

    A --> CU09
    A --> CU10
    A --> CU01
    A --> CU02
    A --> CU05
    A --> CU06
    A --> CU07
    A --> CU08
```

---

## 4. Matriz Requisito ↔ Reglas de Negocio ↔ Entidades

| Requisito / Caso de Uso | Reglas de Negocio | Entidades involucradas | Mecanismo de validación |
|---|---|---|---|
| **CU-09 Iniciar sesión** | RN-02 (campos obligatorios) | `Usuario` | Verificación de hash PBKDF2 y comprobación de cuenta activa (`Activo = true`). |
| **CU-10 Cambiar contraseña** | RN-02, Complejidad mínima (8 chars, letra y número) | `Usuario` | Verificación de contraseña actual con hash y derivación de nueva clave. |
| **CU-01 Registrar usuario** | RN-02, Correo único | `Usuario` | Validación de formato, unicidad en BD y hasheo de contraseña inicial. |
| **CU-02 Registrar ambiente** | RN-02, Capacidad > 0 | `Ambiente` | Restricción de dominio y check en base de datos. |
| **CU-03 Registrar reserva** | RN-01, RN-02, RN-03, RN-04 | `Reserva`, `Usuario`, `Ambiente` | Verificación de horarios 07:00 a 22:00, fin > inicio, ambiente disponible y usuario activo. |
| **CU-04 Validar disponibilidad** | RN-01, RN-03, RN-04 | `Reserva`, `Ambiente` | Algoritmo de traslape en repositorio contra reservas en estado Aprobada. |
| **CU-05 Listar reservas** | Aislamiento por rol | `Reserva` | Filtro LINQ: Solicitante consulta `r.UsuarioId == usuarioActualId`. |
| **CU-06 Ver detalle** | Aislamiento por rol | `Reserva`, `Usuario`, `Ambiente` | Respuesta 404 NotFound si el recurso no pertenece al Solicitante autenticado. |
| **CU-07 Cambiar estado** | RN-01, RN-05, RN-06 | `Reserva` | Solo Administrador aprueba/rechaza (RN-05). Una reserva Rechazada es inmutable (RN-06). Cancelar: el Solicitante solo las suyas; Responsable y Administrador, cualquiera. |
| **CU-08 Dashboard** | Integración de métricas | `Reserva`, `Ambiente` | Agregación de conteos por estado, reservas aprobadas por ambiente y distribución cronológica. |

---

## 5. Modelo de clases de Dominio

```mermaid
classDiagram
    class RolUsuario {
        <<enumeration>>
        Solicitante
        Administrador
        ResponsableAmbiente
    }

    class EstadoAmbiente {
        <<enumeration>>
        Disponible
        Mantenimiento
        Inactivo
    }

    class EstadoReserva {
        <<enumeration>>
        Pendiente
        Aprobada
        Rechazada
        Cancelada
    }

    class Usuario {
        +Guid Id
        +string NombreCompleto
        +string Correo
        +RolUsuario Rol
        +bool Activo
        +string PasswordHash
        +Crear(...) Usuario
        +ActualizarPasswordHash(nuevoHash)
    }

    class Ambiente {
        +Guid Id
        +string Nombre
        +string Tipo
        +int Capacidad
        +string Ubicacion
        +EstadoAmbiente Estado
        +Crear(...) Ambiente
    }

    class Reserva {
        +Guid Id
        +DateOnly Fecha
        +TimeOnly HoraInicio
        +TimeOnly HoraFin
        +string Motivo
        +EstadoReserva Estado
        +Guid UsuarioId
        +Guid AmbienteId
        +Crear(...) Reserva
        +ValidarHorario(inicio, fin)
        +HorariosSeCruzan(i1, f1, i2, f2) bool
        +Aprobar(rolOperador, haySolapamiento)
        +Rechazar(rolOperador)
        +Cancelar(rolOperador, solicitanteId)
    }

    Usuario "1" --> "0..*" Reserva : solicita
    Ambiente "1" --> "0..*" Reserva : es reservado en
    Usuario ..> RolUsuario
    Ambiente ..> EstadoAmbiente
    Reserva ..> EstadoReserva
```

---

## 6. Modelo de Base de Datos (Entidad-Relación)

```mermaid
erDiagram
    USUARIOS ||--o{ RESERVAS : solicita
    AMBIENTES ||--o{ RESERVAS : recibe
    USUARIOS {
        uuid id PK
        varchar nombre_completo
        varchar correo UK
        varchar rol
        boolean activo
        text password_hash
    }
    AMBIENTES {
        uuid id PK
        varchar nombre
        varchar tipo
        int capacidad
        varchar ubicacion
        varchar estado
    }
    RESERVAS {
        uuid id PK
        date fecha
        time hora_inicio
        time hora_fin
        varchar motivo
        varchar estado
        uuid usuario_id FK
        uuid ambiente_id FK
    }
```

---

## 7. Ciclo de vida y estados de una reserva

```mermaid
stateDiagram-v2
    [*] --> Pendiente : Registro inicial (RF-03)
    Pendiente --> Aprobada : Administrador aprueba (RN-05, RN-01)
    Pendiente --> Rechazada : Administrador rechaza (RN-05)
    Pendiente --> Cancelada : Solicitante o Administrador cancela
    Aprobada --> Cancelada : Solicitante o Administrador cancela
    Rechazada --> [*] : Inmutable (RN-06)
    Cancelada --> [*] : Fin de ciclo
```

---

## 8. Diagrama de secuencia: Flujo de aprobación con JWT (RN-05, RN-01)

El siguiente diagrama ilustra el flujo seguro de aprobación donde las credenciales son verificadas a través de un token JWT firmado criptográficamente, garantizando la identidad y el rol de Administrador antes de ejecutar las reglas de dominio:

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as Frontend (React)
    participant AuthMW as Authentication Middleware
    participant API as ReservasController
    participant Svc as ReservaService
    participant Dom as Reserva (Dominio)
    participant BD as PostgreSQL

    Admin->>UI: Pulsa "Aprobar reserva" y confirma en modal
    UI->>AuthMW: PATCH /api/reservas/{id}/estado<br/>Headers: Authorization: Bearer <JWT>
    
    critical Verificación de Token
        AuthMW->>AuthMW: Valida firma criptográfica y expiración del JWT
        AuthMW->>AuthMW: Extrae Claims (UserId, Role = Administrador)
    end

    AuthMW->>API: Solicitud autorizada con ClaimsPrincipal
    API->>Svc: CambiarEstadoAsync(id, "Aprobada", usuarioId, rolAdmin)
    
    Svc->>BD: Obtener reserva por Id
    BD-->>Svc: Reserva en estado Pendiente
    
    Svc->>BD: ExisteSolapamientoAprobadoAsync(ambienteId, fecha, inicio, fin, id)
    BD-->>Svc: false (horario libre de colisiones)
    
    Svc->>Dom: Aprobar(RolUsuario.Administrador, haySolapamiento: false)
    Note over Dom: RN-05: Rol es Administrador ✓<br/>RN-06: No estaba Rechazada ✓<br/>RN-01: Sin solapamiento ✓<br/>Estado pasa a Aprobada
    Dom-->>Svc: Result.Ok()
    
    Svc->>BD: Guardar cambios (Reserva actualizada)
    BD-->>Svc: Commit exitoso
    
    Svc-->>API: Result<ReservaDto>.Ok(reservaActualizada)
    API-->>UI: HTTP 200 OK con JSON de reserva aprobada
    UI-->>Admin: Actualiza estado en pantalla a "Aprobada" (verde)
```

---

## 9. Matriz de gestión de riesgos técnicos

| Riesgo identificado | Severidad | Mitigación implementada |
|---|:---:|---|
| **Falsificación de identidad o roles** | Alta | Firma criptográfica simétrica HMAC-SHA256 con clave secreta fuera del código fuente (`user-secrets`). |
| **Ataque de fuerza bruta o diccionario a contraseñas** | Alta | Algoritmo PBKDF2 con sal aleatoria de 128 bits y 100,000 iteraciones; hashes únicos para cada usuario. |
| **Fuga de datos entre solicitantes (IDOR)** | Alta | Validación estricta en repositorio y controladores: reservas ajenas responden 404 impidiendo enumeración de IDs. |
| **Condición de carrera en reservas simultáneas** | Media | Doble validación: comprobación previa en servicio y regla de dominio; soporte para índice EXCLUDE opcional en BD. |
| **Exposición accidental de credenciales en Git** | Alta | Exclusión de `appsettings.Development.json` y variables locales mediante `.gitignore`; uso estricto de secretos de desarrollo. |

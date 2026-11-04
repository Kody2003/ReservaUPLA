# S01 — Análisis del sistema ReservaUPLA (borrador)

> Borrador para que lo reescribas con tus palabras. Los diagramas están en Mermaid (se ven en GitHub, VS Code con extensión Mermaid o <https://mermaid.live>).

## 1. Problema y alcance

La universidad necesita ordenar quién usa cada ambiente (aula, laboratorio, auditorio) y cuándo, evitando que dos grupos ocupen el mismo lugar a la misma hora. **Dentro del alcance:** RF-01 a RF-08. **Fuera del alcance:** pagos, envío de correos, roles adicionales, login completo.

## 2. Actores

| Actor | Qué hace en el sistema |
|---|---|
| Solicitante | Pide reservas y consulta su estado |
| Administrador | Aprueba o rechaza reservas, registra usuarios y ambientes, consulta el dashboard (RN-05) |
| ResponsableAmbiente | Rol registrado en el sistema, sin permisos especiales de aprobación **[SUPUESTO]** |

## 3. Casos de uso

| Código | Caso de uso | Actor principal | Requisito |
|---|---|---|---|
| CU-01 | Registrar usuario | Administrador | RF-01 |
| CU-02 | Registrar ambiente | Administrador | RF-02 |
| CU-03 | Registrar reserva | Solicitante | RF-03 |
| CU-04 | Validar disponibilidad | Solicitante | RF-04 |
| CU-05 | Listar reservas | Todos | RF-05 |
| CU-06 | Ver detalle de reserva | Todos | RF-06 |
| CU-07 | Cambiar estado de reserva | Administrador (aprobar/rechazar), todos (cancelar) | RF-07 |
| CU-08 | Ver dashboard | Administrador | RF-08 |

```mermaid
flowchart LR
    S([Solicitante])
    A([Administrador])
    S --> CU03[CU-03 Registrar reserva]
    S --> CU04[CU-04 Validar disponibilidad]
    S --> CU05[CU-05 Listar reservas]
    S --> CU06[CU-06 Ver detalle]
    A --> CU01[CU-01 Registrar usuario]
    A --> CU02[CU-02 Registrar ambiente]
    A --> CU07[CU-07 Cambiar estado]
    A --> CU08[CU-08 Ver dashboard]
    A --> CU05
    CU03 -. incluye .-> CU04
```

## 4. Matriz RF ↔ RN ↔ entidad

| Requisito | Reglas relacionadas | Entidades |
|---|---|---|
| RF-01 Registrar usuarios | RN-02 | Usuario |
| RF-02 Registrar ambientes | RN-02 | Ambiente |
| RF-03 Registrar reservas | RN-01, RN-02, RN-03, RN-04 | Reserva, Usuario, Ambiente |
| RF-04 Validar disponibilidad | RN-01, RN-03, RN-04 | Reserva, Ambiente |
| RF-05 Listar reservas | — | Reserva |
| RF-06 Ver detalle | — | Reserva, Usuario, Ambiente |
| RF-07 Cambiar estado | RN-01, RN-05, RN-06 | Reserva |
| RF-08 Dashboard | — | Reserva, Ambiente |

## 5. Modelo de clases

```mermaid
classDiagram
    class Usuario {
        +Guid Id
        +string NombreCompleto
        +string Correo
        +RolUsuario Rol
        +bool Activo
    }
    class Ambiente {
        +Guid Id
        +string Nombre
        +string Tipo
        +int Capacidad
        +string Ubicacion
        +EstadoAmbiente Estado
    }
    class Reserva {
        +Guid Id
        +DateOnly Fecha
        +TimeOnly HoraInicio
        +TimeOnly HoraFin
        +string Motivo
        +EstadoReserva Estado
        +Aprobar()
        +Rechazar()
        +Cancelar()
    }
    Usuario "1" --> "0..*" Reserva : solicita
    Ambiente "1" --> "0..*" Reserva : es reservado en
```

## 6. Base de datos (entidad-relación)

```mermaid
erDiagram
    USUARIOS ||--o{ RESERVAS : solicita
    AMBIENTES ||--o{ RESERVAS : recibe
    USUARIOS { uuid id PK
               varchar nombre_completo
               varchar correo
               varchar rol
               boolean activo }
    AMBIENTES { uuid id PK
                varchar nombre
                varchar tipo
                int capacidad
                varchar ubicacion
                varchar estado }
    RESERVAS { uuid id PK
               date fecha
               time hora_inicio
               time hora_fin
               varchar motivo
               varchar estado
               uuid usuario_id FK
               uuid ambiente_id FK }
```

## 7. Estados de una reserva

```mermaid
stateDiagram-v2
    [*] --> Pendiente : registrar (RF-03)
    Pendiente --> Aprobada : aprobar (RN-05, RN-01)
    Pendiente --> Rechazada : rechazar (RN-05)
    Pendiente --> Cancelada : cancelar
    Aprobada --> Cancelada : cancelar
    Rechazada --> [*] : RN-06, no se modifica
    Cancelada --> [*]
```

## 8. Flujo principal: aprobar una reserva

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant UI as Frontend
    participant API as ReservasController
    participant Svc as ReservaService
    participant Dom as Reserva (dominio)
    participant BD as PostgreSQL
    Admin->>UI: Aprobar (modal confirma)
    UI->>API: PATCH /api/reservas/{id}/estado + X-Admin-Key
    API->>Svc: CambiarEstadoAsync(id, "Aprobada", rol)
    Svc->>BD: leer reserva y buscar solapamientos Aprobadas
    Svc->>Dom: Aprobar(rol, haySolapamiento)
    Dom-->>Svc: RN-05, RN-06, RN-01 verificadas
    Svc->>BD: guardar nuevo estado
    Svc-->>API: Result Ok
    API-->>UI: 200 con la reserva
```

## 9. Riesgos

| Riesgo | Probabilidad | Impacto | Qué hago |
|---|---|---|---|
| Un solo desarrollador, poco tiempo | Alta | Alto | Alcance fijo, entregas semanales, no agregar funciones extra |
| Dos aprobaciones al mismo tiempo que se crucen | Baja | Medio | Validar en el servicio y, opcionalmente, restricción de exclusión en la BD (comentada en `01_init.sql`) |
| Subir secretos al repositorio por error | Media | Alto | `user-secrets`, `.gitignore`, `appsettings.Example.json`, revisar `git status` |
| Incompatibilidad de versiones EF Core / Npgsql | Media | Medio | Usar ambas en 8.x |
| Perder el control del alcance | Media | Medio | Matriz RF↔RN y plan de commits |

## 10. Supuestos

Ver la lista **[SUPUESTO]** del README: estados permitidos para cada cambio, ambiente y usuario deben estar habilitados, correo único, «más utilizado» = más reservas Aprobadas, autenticación por clave de administrador.

## 11. Qué fuentes citar (tú las buscas y las citas en el texto)

- Libro de ingeniería de software sobre **requisitos y casos de uso** (por ejemplo Sommerville o Pressman).
- Texto sobre **UML**: diagramas de casos de uso, clases y estados (Fowler, «UML Distilled»).
- Documento sobre **Clean Architecture** (Robert C. Martin).
- **Heurísticas de usabilidad de Nielsen** (sitio de Nielsen Norman Group).
- Documentación oficial de **.NET, EF Core, Npgsql y PostgreSQL** para las decisiones técnicas.

Verifica edición, año y editorial antes de poner cada referencia.

# Changelog

Todos los cambios notables de este proyecto están documentados en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

### Agregado
- **Autenticación real y roles (RBAC):**
  - Implementación de tokens JWT (JSON Web Tokens) con firma HMAC-SHA256 y claims de identidad y rol.
  - Servicio criptográfico `PasswordHasher` basado en PBKDF2 con sal aleatoria de 128 bits y 100,000 iteraciones (RFC 2898 / NIST SP 800-132).
  - Endpoints en `AuthController`: `POST /api/auth/login`, `GET /api/auth/yo`, `PATCH /api/auth/contrasena` y `POST /api/auth/demo` (restringido a entorno Development).
  - Seeder de desarrollo (`DesarrolloSeeder`) para inicializar hashes de usuarios de prueba a partir del secreto `Seed:PasswordDemo`.
- **Aislamiento y privacidad de datos por rol:**
  - El rol Solicitante visualiza únicamente sus propias reservas en listado (`GET /api/reservas`) y detalle (`GET /api/reservas/{id}`).
  - Respuestas HTTP 404 (Not Found) al consultar detalles de reservas ajenas para evitar vulnerabilidades de enumeración de recursos (IDOR).
  - Inyección del `usuarioId` proveniente del token JWT al crear reservas, impidiendo suplantación desde el cliente.
  - El rol Solicitante solo puede cancelar sus propias reservas; el Administrador puede cancelar cualquier reserva.
- **Frontend y Experiencia de Usuario (UX):**
  - Pantalla de inicio de sesión rediseñada con layout dividido: panel fotográfico UPLA y formulario accesible.
  - Chips de acceso rápido de demostración en entorno de desarrollo con autocompletado visual y botón de visualización de contraseña.
  - Barra superior institucional (`.cabecera-upla`) con insignia UPLA, título oficial y alternador de modo oscuro/claro.
  - Menú de usuario desplegable accesible (WAI-ARIA) con iniciales dinámicas, visualización de rol y atajos de teclado.
  - Páginas de usuario `/configuracion` (datos de perfil y selector de tema) y `/cambiar-contrasena` (validación de contraseña actual y reglas de complejidad).
  - Componentes UI universales y reutilizables:
    - `<Campo>`: envoltura de controles de formulario con etiqueta, asterisco obligatorio, ícono SVG a la izquierda, borde redondeado y mensajes de error accesibles vía `aria-describedby` y `aria-invalid`.
    - `<Icono>`: catálogo centralizado de íconos en SVG en línea sin librerías externas.
  - Modo oscuro integral implementado mediante variables CSS semánticas y script síncrono anti-parpadeo en `index.html`.
  - Rediseño de pantallas:
    - **Dashboard:** tarjetas estadísticas con bordes de color, gráfico cronológico SVG de reservas por día y ranking de ambientes más utilizados.
    - **Ambientes:** vista diferenciada de doble columna para Administrador (con formulario de registro) y tabla completa con búsqueda y filtros para Responsable de Ambiente.
    - **Usuarios:** vista de gestión administrativa con formulario, alternador de visualización de contraseña inicial y chips de rol.
- **Pruebas unitarias:**
  - Incorporación de 12 nuevas pruebas unitarias en `ReservaUPLA.Tests` para autenticación, derivación de contraseñas, validación de JWT, y aislamiento de datos por rol (total: 41 pruebas en verde).

### Cambiado
- Refactorización: Campo compone los controles base TextInput, SelectInput, DateInput y TimeInput; el Dashboard usa CardIndicador.
- **Eliminación del esquema preliminar `X-Admin-Key`:**
  - Retirada de la cabecera `X-Admin-Key` y del proveedor provisional de roles en backend.
  - Eliminación de archivos obsoletos del frontend: `AdminKeyPanel.tsx`, `useClaveAdmin.ts` y `claveAdmin.ts`.
  - Migración del cliente HTTP `apiClient.ts` para adjuntar de manera transparente la cabecera estándar `Authorization: Bearer <token>`.
- **Base de datos:**
  - Adición de la columna `password_hash` en la tabla `usuarios` (migración `AgregarLoginUsuario` y actualización de `database/01_init.sql`).
  - Incorporación del usuario de prueba inactivo Pedro Salas para verificar el rechazo de cuentas desactivadas.

---

## [0.1.0] - 2026-11-04

### Agregado
- Análisis de requisitos y modelo de dominio (S01).
- Justificación del ciclo de vida (S02) y estándares de código y Git (S03).
- Entidades `Usuario`, `Ambiente` y `Reserva` con reglas RN-03 a RN-06 en el dominio.
- Servicios de aplicación con `Result<T>` y validación de RN-01 y RN-02.
- API REST con controladores delgados, Swagger, CORS y middleware global de excepciones.
- Base de datos PostgreSQL: migración inicial y script `database/01_init.sql` con datos de prueba.
- Frontend React: formularios, listado con filtros, detalle, cambio de estado con modal y dashboard.
- Pruebas unitarias xUnit + Moq para RN-01 a RN-06 (29 pruebas iniciales).

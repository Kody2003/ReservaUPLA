# Guía para la Sustentación del Proyecto ReservaUPLA

Este documento resume los conceptos clave, flujos de ejecución de extremo a extremo, respuestas a preguntas frecuentes del docente y el checklist de capturas para el informe final.

---

## 1. Recorrido de una petición: «Crear una reserva» (RF-03)

| Paso | Archivo / Componente | Método o función | Qué ocurre |
|---|---|---|---|
| **1. UI** | `frontend/src/pages/NuevaReservaPage.tsx` | `alEnviar` | Valida con `useValidacionReserva`, verifica horarios y llama a `reservasService.crear`. |
| **2. Servicio Frontend** | `frontend/src/services/reservasService.ts` | `crear` | Prepara el DTO y delega en el cliente HTTP centralizado `apiClient`. |
| **3. Cliente HTTP** | `frontend/src/services/apiClient.ts` | `solicitar` | Adjunta la cabecera `Authorization: Bearer <token>` desde `sessionStorage` y realiza la petición `POST /api/reservas`. |
| **4. Middleware Auth** | Pipeline de ASP.NET Core | `JwtBearerMiddleware` | Valida firma, vigencia y emisor del token; extrae el ID y rol del usuario autenticado en `HttpContext.User`. |
| **5. Controlador** | `backend/src/ReservaUPLA.API/Controllers/ReservasController.cs` | `Crear` | Controlador delgado. Inyecta el `usuarioId` y `rol` del token al DTO y delega en el servicio de aplicación. |
| **6. Servicio de Aplicación** | `backend/src/ReservaUPLA.Application/Services/ReservaService.cs` | `CrearAsync` | Valida existencia de usuario activo, ambiente disponible y ausencia de cruces de horario (RN-01). |
| **7. Dominio** | `backend/src/ReservaUPLA.Domain/Entities/Reserva.cs` | `Crear` y `ValidarHorario` | Aplica RN-02 (campos obligatorios), RN-03 (fin > inicio) y RN-04 (07:00 a 22:00). |
| **8. Infraestructura** | `backend/src/ReservaUPLA.Infrastructure/Repositories/ReservaRepository.cs` | `AgregarAsync` | Registra la entidad en el `ReservaUplaDbContext`. |
| **9. PostgreSQL** | Tabla `reservas` | `INSERT` | Persiste el registro; las restricciones CHECK garantizan integridad relacional. |

---

## 2. Banco de Preguntas Clave para Sustentación

### Fundamentos de Arquitectura y Diseño
1. **¿Por qué se eligió Clean Architecture?**  
   > *Respuesta:* Para desacoplar las reglas de negocio puras (núcleo) de la infraestructura externa (base de datos PostgreSQL, frameworks HTTP). Permite probar el dominio sin simular un servidor web ni depender de una base de datos activa.

2. **¿Cuál es el sentido de las dependencias entre proyectos?**  
   > *Respuesta:* Sigue la regla de dependencias concéntricas: API depende de Application e Infrastructure; Infrastructure depende de Application y Domain; Application depende únicamente de Domain; Domain es el centro y no depende de nadie.

3. **¿Por qué las interfaces de repositorio residen en Application y no en Infrastructure?**  
   > *Respuesta:* Por el principio de Inversión de Dependencias (la "D" de SOLID). La capa de aplicación define el contrato que necesita para operar; la infraestructura es un detalle que implementa dicho contrato mediante EF Core.

4. **¿Qué es el patrón `Result<T>` y por qué se usa en lugar de lanzar excepciones?**  
   > *Respuesta:* Es un tipo envoltorio funcional que expresa éxito o fallo de forma explícita. Los errores de negocio (ej. solapamiento de horario) son parte previsible del flujo normal y no fallos excepcionales del sistema; reservamos las excepciones para caídas críticas imprevistas.

5. **¿Por qué los controladores de la API son delgados (thin controllers)?**  
   > *Respuesta:* Porque su única responsabilidad es mediar entre el protocolo HTTP (códigos de estado, cabeceras) y la aplicación. No contienen lógica de negocio ni consultas a la base de datos, lo que evita duplicidad y facilita pruebas.

6. **¿Por qué se utilizan DTOs (Data Transfer Objects) y no se exponen las entidades de dominio directamente en la API?**  
   > *Respuesta:* Por seguridad y desacoplamiento (evitar vulnerabilidades de over-posting o mass assignment). Impide exponer datos internos como `PasswordHash` o permitir que el cliente modifique estados protegidos por reglas de negocio.

---

### Seguridad, Autenticación y Control de Acceso
7. **¿Por qué se utiliza JWT (JSON Web Tokens) para la autenticación?**  
   > *Respuesta:* Porque permite una autenticación sin estado (stateless) y de alto rendimiento. El servidor no requiere almacenar sesiones en memoria o base de datos por cada petición; cada token viaja firmado digitalmente conteniendo la identidad y rol del usuario.

8. **¿Por qué se implementó PBKDF2 con sal (salt) aleatoria en lugar de un hash simple como SHA-256 o MD5?**  
   > *Respuesta:* SHA-256 o MD5 son funciones rápidas diseñadas para checksums, vulnerables a ataques de fuerza bruta masiva y tablas arcoíris (rainbow tables). PBKDF2 es una función de derivación de claves intencionalmente costosa que utiliza miles de iteraciones (100,000) y una sal criptográfica única por usuario, haciendo inviables los ataques de diccionario.

9. **¿Cómo se distingue y autentica al Administrador y a los demás roles en el sistema?**  
   > *Respuesta:* Mediante Claims incluidos dentro del payload del JWT (`ClaimTypes.Role`). El backend valida el rol con atributos `[Authorize(Roles = "Administrador")]` y en el dominio mediante `Reserva.Aprobar/Rechazar(rolOperador)`.

10. **¿Dónde se almacena el token en el navegador y qué implicaciones de seguridad tiene?**  
    > *Respuesta:* En `sessionStorage`. Esto garantiza que la sesión expire automáticamente al cerrar la pestaña o el navegador, mitigando el riesgo de retención permanente que tiene `localStorage`. El riesgo latente es XSS, mitigado sanitizando entradas, utilizando TypeScript y evitando inyecciones de HTML no confiable.

11. **¿Cuál es la diferencia técnica entre una respuesta HTTP 401 Unauthorized y un HTTP 403 Forbidden?**  
    > *Respuesta:* **401 Unauthorized** indica que el usuario no está autenticado (falta token, expiró o es inválido) y debe identificarse. **403 Forbidden** indica que el usuario está correctamente autenticado, pero carece de permisos suficientes para la acción solicitada (ej. un Solicitante intentando aprobar una reserva).

12. **¿Por qué cuando un Solicitante intenta ver el detalle de una reserva ajena se le responde con 404 Not Found y no con 403 Forbidden?**  
    > *Respuesta:* Por el principio de seguridad por diseño contra la enumeración de recursos (IDOR). Responder 403 revelaría a un atacante que el recurso con dicho identificador efectivamente existe en la base de datos; al devolver 404, el sistema no filtra información sobre la existencia de datos ajenos.

13. **¿Por qué el endpoint de acceso demo (`/api/auth/demo`) no representa una brecha de seguridad?**  
    > *Respuesta:* Porque está estrictamente restringido al entorno local de desarrollo mediante la comprobación `if (!environment.IsDevelopment()) return NotFound();`. En producción el endpoint no opera. Además, no expone contraseñas en el frontend y reutiliza las comprobaciones de estado activo de usuario.

14. **¿Cómo está implementado el modo oscuro en el frontend y cómo se evita el parpadeo de pantalla (flicker)?**  
    > *Respuesta:* Se utilizan tokens de diseño semánticos con variables CSS (`--fondo`, `--superficie`, `--texto`) alternados mediante el atributo `data-theme="dark"` en el elemento raíz `<html>`. Para evitar parpadeo blanco al recargar la página, se ejecuta un script síncrono ultra-rápido en el `<head>` de `index.html` que lee el tema guardado en `sessionStorage` antes de que el DOM y React se rendericen.

15. **¿Qué medidas técnicas faltarían para elevar la seguridad a un estándar de producción bancaria o institucional?**  
    > *Respuesta:*
    > 1. Forzar canal seguro obligatorio mediante HTTPS y HSTS.
    > 2. Almacenar tokens de actualización (Refresh Tokens) en cookies seguras `HttpOnly`, `Secure` y `SameSite=Strict` con rotación automática.
    > 3. Implementar limitación de tasa de solicitudes (Rate Limiting) y bloqueo temporal de cuentas ante intentos fallidos reiterados.
    > 4. Mecanismo de lista negra (Revocation List / Redis) para invalidar tokens JWT antes de su expiración ante cierres forzados.

---

## 3. Guía de Modificaciones: Agregar un nuevo campo (ej. `Piso` en Ambiente)

Si el docente solicita extender el modelo con un nuevo campo durante la sustentación:

1. **Domain:** Agregar la propiedad en `Ambiente.cs` y actualizar el método de fábrica `Ambiente.Crear(...)`.
2. **Infrastructure:** Mapear la columna en `ReservaUplaDbContext.cs` (`e.Property(a => a.Piso)...`).
3. **Migración:** Generar y aplicar con:
   ```powershell
   dotnet ef migrations add AgregarPisoAmbiente --project src/ReservaUPLA.Infrastructure --startup-project src/ReservaUPLA.API
   dotnet ef database update --project src/ReservaUPLA.Infrastructure --startup-project src/ReservaUPLA.API
   ```
4. **Base de datos (script):** Actualizar `database/01_init.sql` agregando la columna en el `CREATE TABLE` y en el `INSERT` inicial.
5. **Application:** Modificar los DTOs `AmbienteCrearDto`, `AmbienteDto` y el método de mapeo en `MapeoExtensions.cs`.
6. **Application Service:** Validar obligatoriedad o rango del nuevo campo en `AmbienteService.cs`.
7. **Frontend Types:** Agregar `piso: string` en `Ambiente` y `AmbienteCrear` dentro de `types/index.ts`.
8. **Frontend UI:** Incluir el componente `<Campo>` correspondiente en `AmbientesPage.tsx` y la columna en la tabla.
9. **Pruebas:** Ejecutar `dotnet test` y agregar una prueba unitaria del nuevo campo.

---

## 4. Arquitectura de Componentes Reutilizables de Interfaz (Frontend UI)

Para dar cumplimiento riguroso al principio de **responsabilidad única** y **reutilización de componentes** exigido en el caso práctico, la capa de presentación desacopla los controles atómicos de entrada, los contenedores de formulario y los componentes de visualización:

| Componente | Rol y Responsabilidad | Dónde se utiliza |
|---|---|---|
| `TextInput` | Control base atómico para `<input>` (`text`, `email`, `password`, `number`), ranura derecha para acciones (`slotDerecha` para mostrar/ocultar contraseña) y vinculación ARIA. | Compuesto internamente por `Campo.tsx`. |
| `SelectInput` | Control base atómico para listas desplegables (`<select>`), mapeo de opciones, placeholder accesible y soporte ARIA. | Compuesto internamente por `Campo.tsx`. |
| `DateInput` | Control base atómico para selectores de fecha (`type="date"`), restricciones `min`/`max` y soporte ARIA. | Compuesto internamente por `Campo.tsx`. |
| `TimeInput` | Control base atómico para selectores de hora (`type="time"`), saltos de paso (`step="900"` para 15 min), restricciones y soporte ARIA. | Compuesto internamente por `Campo.tsx`. |
| `Campo` | Contenedor de formulario de alto nivel: renderiza etiqueta, asterisco obligatorio, mensajes de error accesibles (`aria-describedby`, `aria-invalid`), texto de ayuda y delega la entrada en los controles base (`TextInput`, `SelectInput`, `DateInput`, `TimeInput`) o textarea. | `LoginPage`, `NuevaReservaPage`, `AmbientesPage`, `UsuariosPage`, `CambiarContrasenaPage`, `ReservasPage` (filtros). |
| `CardIndicador` | Tarjeta analítica de métricas clave con borde temático de color según variante (`total`, `pendientes`, `aprobadas`, `rechazadas`), ícono SVG, valor destacado y leyenda descriptiva. | `DashboardPage` (4 tarjetas principales de resumen estadístico). |
| `Button` | Botón accesible con variantes semánticas (`primario`, `secundario`, `peligro`), estados de deshabilitado y carga (`cargando`). | `Layout`, `MenuUsuario`, `ModalConfirmacion`, `AmbientesPage`, `CambiarContrasenaPage`, `NuevaReservaPage`, `ReservaDetallePage`, `ReservasPage`, `UsuariosPage`. |
| `AlertMessage` | Mensajes de notificación y retroalimentación accesible (`role="alert"`, `aria-live`) para estados de éxito, error o advertencia. | `LoginPage`, `DashboardPage`, `AmbientesPage`, `UsuariosPage`, `NuevaReservaPage`, `ReservasPage`, `ReservaDetallePage`, `CambiarContrasenaPage`. |
| `ModalConfirmacion` | Ventana modal accesible con control de foco y soporte de teclado para confirmación de acciones críticas (aprobar, rechazar, cancelar). | `ReservaDetallePage`. |
| `TableList` | Envoltorio reutilizable para tablas de datos tabulares accesibles con cabeceras configurables y estado vacío. | `AmbientesPage`, `ReservasPage`, `UsuariosPage`. |
| `Icono` | Catálogo centralizado de gráficos vectoriales SVG en línea (`aria-hidden`), adaptables al tema claro y oscuro sin dependencias externas. | `Layout`, `MenuUsuario`, `CardIndicador`, `EstadoBadge`, `DashboardPage`, `ReservasPage`, `AmbientesPage`, `UsuariosPage`. |
| `EstadoBadge` | Chip visual indicador del estado de la reserva (Pendiente, Aprobada, Rechazada, Cancelada) con color y semántica accesible. | `ReservasPage`, `ReservaDetallePage`, `DashboardPage`. |

---

## 5. Checklist de Capturas para el Informe y Diapositivas

Asegúrate de tomar las siguientes capturas para documentar tu sustentación (recuerda verificar que no queden contraseñas ni claves visibles):

- [ ] **1. Pantalla de Login en modo claro:** Con los campos de entrada, íconos y chips de demostración visibles.
- [ ] **2. Pantalla de Login en modo oscuro:** Mostrando la coherencia cromática y contraste adecuado.
- [ ] **3. Login con validación de error:** Mostrando el mensaje de credenciales incorrectas.
- [ ] **4. Login responsivo en dispositivo móvil (375 px):** Inspección de dispositivo mostrando adaptación vertical.
- [ ] **5. Acceso de demostración «Usuario inactivo»:** Pulsando el chip de Pedro Salas y visualizando el mensaje de cuenta desactivada.
- [ ] **6. Barra superior institucional en modo claro y oscuro:** Insignia UPLA, título y alternador de tema.
- [ ] **7. Menú de usuario desplegado:** Menú accesible abierto con opciones de Configuración, Contraseña y Cerrar sesión.
- [ ] **8. Dashboard analítico en modo oscuro:** Tarjetas estadísticas con bordes de color, gráfico cronológico y ranking.
- [ ] **9. Vista del Solicitante («Mis reservas») vs Vista del Administrador:** Comparativa demostrando que el Solicitante no ve Dashboard ni opciones de otros usuarios.
- [ ] **10. Intento no autorizado 403:** Demostración en consola o Swagger al intentar aprobar con rol Solicitante.
- [ ] **11. Pantalla de Configuración (`/configuracion`):** Datos del usuario en solo lectura y selector de tema.
- [ ] **12. Pantalla de Cambio de Contraseña (`/cambiar-contrasena`):** Validación reactiva de reglas de contraseña.
- [ ] **13. Terminal con `dotnet test`:** Salida limpia mostrando las **41 pruebas unitarias en verde**.
- [ ] **14. Swagger UI interactivo:** Vista de endpoints con botón de autenticación `Authorize` (Bearer JWT).

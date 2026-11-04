# Guía para sustentar ReservaUPLA (PARTE 7)

## 1. Recorrido de una petición: «Crear una reserva» (RF-03)

| Paso | Archivo | Método o función | Qué ocurre |
|---|---|---|---|
| 1. UI | `frontend/src/pages/NuevaReservaPage.tsx` | `alEnviar` | Valida con `useValidacionReserva`, deshabilita el botón según `useDisponibilidad` y llama al servicio |
| 2. Servicio del frontend | `frontend/src/services/reservasService.ts` | `crear` | Prepara la ruta `/api/reservas` y delega en `apiClient` |
| 3. apiClient | `frontend/src/services/apiClient.ts` | `solicitar` | Arma la URL, envía JSON y `X-Admin-Key` si existe, convierte errores en `ApiError` |
| 4. Controller | `backend/src/ReservaUPLA.API/Controllers/ReservasController.cs` | `Crear` | Recibe el DTO y llama al servicio (no tiene lógica) |
| 5. Service | `backend/src/ReservaUPLA.Application/Services/ReservaService.cs` | `CrearAsync` | Lee y valida datos, crea la entidad, verifica usuario, ambiente y RN-01 |
| 6. Dominio | `backend/src/ReservaUPLA.Domain/Entities/Reserva.cs` | `Crear` / `ValidarHorario` | Aplica RN-02, RN-03 y RN-04 |
| 7. Repository | `backend/src/ReservaUPLA.Infrastructure/Repositories/ReservaRepository.cs` | `ExisteSolapamientoAprobadoAsync`, `AgregarAsync` | Consulta el cruce de horarios y guarda |
| 8. PostgreSQL | tabla `reservas` (`DbContext` / `01_init.sql`) | `INSERT` | Guarda la fila; los CHECK de la BD repiten RN-03 y RN-04 |

La respuesta vuelve igual pero al revés: `Result<ReservaDto>` → `ApiControllerBase.ResponderCreado` (201 o ProblemDetails) → `apiClient` → página.

**Cambio de estado (RF-07):** `ReservaDetallePage.confirmar` → `reservasService.cambiarEstado` → `ReservasController.CambiarEstado` (el rol sale de `RolActualProvider`) → `ReservaService.CambiarEstadoAsync` → `Reserva.Aprobar/Rechazar/Cancelar` → `ReservaRepository.ActualizarAsync`.

## 2. Quince preguntas probables

1. **¿Por qué Clean Architecture?** Para separar las reglas del negocio de la base de datos y de la API: se pueden probar sin PostgreSQL y cambiar una capa sin romper las otras.
2. **¿Qué depende de qué?** API → Application + Infrastructure; Infrastructure → Application + Domain; Application → Domain; Domain no depende de nadie.
3. **¿Por qué las interfaces de repositorio están en Application?** Para que el servicio dependa de un contrato y no de EF Core (inversión de dependencias); Infrastructure lo implementa.
4. **¿Qué es `Result<T>` y por qué no usar excepciones?** Un objeto que dice si salió bien o mal. Un error de negocio (horario cruzado) es parte normal del flujo; las excepciones se reservan para fallos inesperados.
5. **¿Dónde se valida cada regla?** En el backend, que es la fuente de verdad (`Reserva`, servicios y repositorio). El frontend solo las refleja para avisar antes. Ver la tabla del README.
6. **¿Cómo detectas el solapamiento (RN-01)?** Misma fecha, mismo ambiente, estado Aprobada y `inicioNueva < finExistente && finNueva > inicioExistente`. Si uno termina cuando empieza el otro, no se cruzan.
7. **¿Por qué los controladores son «delgados»?** Solo reciben la petición y delegan; así la lógica se prueba sin HTTP y no se duplica.
8. **¿Por qué DTOs y no las entidades?** Para no exponer detalles internos, evitar que el cliente cambie campos que no debe y poder evolucionar la API sin tocar el dominio.
9. **¿Cómo distingues al Administrador (RN-05)?** Con una clave en la cabecera `X-Admin-Key` comparada contra `Admin:ApiKey` (user-secrets). Es la opción más simple; en un sistema real iría JWT y solo cambiaría `RolActualProvider`.
10. **¿Dónde está el middleware de excepciones y qué hace?** `ExcepcionesMiddleware`: atrapa errores inesperados, los registra en el log y responde un `ProblemDetails` 500 en español sin mostrar detalles técnicos.
11. **¿Cómo evitas subir secretos?** `dotnet user-secrets` y variables de entorno, `appsettings.Example.json` con valores falsos, `.env.example` y un `.gitignore` que excluye los archivos reales.
12. **¿Qué diferencia hay entre migraciones y `01_init.sql`?** Ambos crean el mismo esquema; las migraciones se generan desde el código con `dotnet ef`, y el script es SQL directo con datos de prueba. Se pueden combinar porque el script no duplica nada.
13. **¿Cómo pruebas las reglas?** xUnit para la estructura y Moq para simular repositorios; hay al menos una prueba por RN-01, RN-03, RN-04, RN-05 y RN-06, con el nombre de la regla en el nombre de la prueba.
14. **¿Cómo cuidas la usabilidad?** Mensajes en español junto al campo, botón deshabilitado cuando el horario es inválido o el ambiente está ocupado, modal con «Cancelar» como opción por defecto, foco atrapado y tecla Escape (prevención de errores, Nielsen).
15. **¿Qué mejorarías con más tiempo?** Login real con JWT, restricción de exclusión en PostgreSQL para RN-01 ante aprobaciones simultáneas, paginación, y pruebas de integración y del frontend.

## 3. Si te piden agregar un campo (ejemplo: `Piso` en Ambiente)

Orden recomendado, de adentro hacia afuera:

1. `Domain/Entities/Ambiente.cs`: agregar la propiedad y el parámetro de `Crear`.
2. `Infrastructure/Persistence/ReservaUplaDbContext.cs`: configurar la columna (`piso`, tamaño, requerido).
3. Terminal: `dotnet ef migrations add AgregarPisoAmbiente ...` y `dotnet ef database update ...`.
4. `database/01_init.sql`: agregar la columna y los datos del seed.
5. `Application/DTOs/AmbienteDtos.cs` y `MapeoExtensions.cs`: agregar el campo al DTO de entrada y al de salida.
6. `Application/Services/AmbienteService.cs`: validar el campo (RN-02) y pasarlo a `Ambiente.Crear`.
7. `frontend/src/types/index.ts`: actualizar `Ambiente` y `AmbienteCrear`.
8. `frontend/src/pages/AmbientesPage.tsx`: campo del formulario, validación y columna de la tabla.
9. Pruebas: ajustar `Ambiente.Crear(...)` donde se use y agregar un caso nuevo.
10. `README.md`, `CHANGELOG.md` y un commit: `feat(ambientes): agregar campo piso`.

Si el campo es solo del frontend (por ejemplo, un filtro), basta con los pasos 7 y 8.

## 4. Checklist de capturas para el informe

**VS Code**
- [ ] Explorador mostrando las carpetas de las 4 capas, `tests` y `frontend/src`.
- [ ] `Reserva.cs` con los comentarios `// RN-03`, `// RN-04`, `// RN-05` y `// RN-06` visibles.
- [ ] `ReservaService.cs` con `CrearAsync` y `// RN-01`.
- [ ] `ReservaRepository.cs` con la fórmula de solapamiento.
- [ ] Un componente de `components/ui` (por ejemplo `ModalConfirmacion.tsx`).

**Terminal**
- [ ] `dotnet --version`, `node --version`, `git --version`.
- [ ] `dotnet build backend/ReservaUPLA.sln` con «Build succeeded».
- [ ] `dotnet ef migrations add` y `dotnet ef database update`.
- [ ] `dotnet test` con todas las pruebas en verde.
- [ ] `git log --oneline` mostrando los commits en Conventional Commits.
- [ ] `git branch -a` con `main` y `develop`.
- [ ] `dotnet user-secrets list` con la **contraseña tapada** antes de capturar.
- [ ] La salida de los `Invoke-RestMethod` de la evidencia (409, 400, 403).

**Navegador**
- [ ] Swagger en `http://localhost:5080/swagger` con los endpoints.
- [ ] Dashboard con los indicadores.
- [ ] Formulario de reserva con el error de horario (RN-03/RN-04) junto al campo.
- [ ] Formulario con el mensaje de «no disponible» (RN-01) y el botón deshabilitado.
- [ ] Listado con filtros aplicados.
- [ ] Detalle con el modal de confirmación abierto.
- [ ] Mensaje de error al aprobar sin modo administrador (RN-05) y detalle de una reserva Rechazada sin acciones (RN-06).
- [ ] Herramientas del navegador (F12, pestaña Red) mostrando la cabecera `X-Admin-Key` **con el valor tapado**.

**Antes de capturar:** revisa que no se vean contraseñas, cadenas de conexión ni la clave de administrador.

## 5. Refactorizaciones para S08 (antes / después)

**1. Textos «RN-01» escritos a mano → constantes** (`CodigoRegla`)
```csharp
// Antes
return Result<ReservaDto>.Falla(TipoError.Conflicto, "Horario cruzado", "RN-01");
// Después
return Result<ReservaDto>.Falla(TipoError.Conflicto, Reserva.MensajeSolapamiento, CodigoRegla.RN01);
```

**2. Validación de fecha y horas repetida → método privado** (`ReservaService.LeerFechaYHoras`)
```csharp
// Antes: el mismo bloque de TryParse en CrearAsync y en ValidarDisponibilidadAsync
// Después
var lectura = LeerFechaYHoras(dto.Fecha, dto.HoraInicio, dto.HoraFin);
if (!lectura.Exito) return Result<ReservaDto>.Falla(lectura.Tipo, lectura.Error, lectura.Codigo);
```

**3. Fórmula de solapamiento escrita solo dentro de la consulta → método del dominio** (`Reserva.HorariosSeCruzan`)
```csharp
// Antes: la condición solo existía dentro de la consulta LINQ y no se podía probar sin base de datos
// Después: método estático probado por [Theory] y la misma fórmula en la consulta
public static bool HorariosSeCruzan(TimeOnly inicioNueva, TimeOnly finNueva, TimeOnly inicioExistente, TimeOnly finExistente)
    => inicioNueva < finExistente && finNueva > inicioExistente;
```

**4. useEffect + fetch copiado en cada página → hook** (`useCargarDatos`)
```tsx
// Antes (en cada página)
useEffect(() => { setCargando(true); servicio().then(setDatos).catch(...).finally(...); }, []);
// Después
const { datos, cargando, error, recargar } = useCargarDatos(cargar);
```

**5. Etiqueta + error repetidos en cada campo → componente `Campo`**
```tsx
// Antes: <label> y <p className="campo-error"> copiados en TextInput, SelectInput, DateInput y TimeInput
// Después: los cuatro usan <Campo id etiqueta requerido error>...</Campo>
```

**6. Switch de códigos HTTP dentro de cada controlador → clase base** (`ApiControllerBase`)
```csharp
// Antes: cada acción decidía NotFound(), BadRequest(), Conflict()...
// Después
public async Task<IActionResult> Crear([FromBody] UsuarioCrearDto dto) => ResponderCreado(await _servicio.CrearAsync(dto));
```

Tip: haz **un commit por refactorización** (`refactor: ...`) y corre `dotnet test` antes y después para demostrar que el comportamiento no cambió.

# Estándares del proyecto ReservaUPLA (S03)

Reglas simples para que el código sea parecido en todos los archivos y fácil de leer en la sustentación.

## 1. Nomenclatura

| Elemento | Convención | Ejemplo de este proyecto |
|---|---|---|
| Clases, métodos, propiedades | PascalCase | `ReservaService`, `CambiarEstadoAsync` |
| Variables locales y parámetros | camelCase | `haySolapamiento`, `usuarioId` |
| Interfaces | prefijo `I` | `IReservaRepository` |
| Sufijos de clase | `Dto`, `Service`, `Repository`, `Controller` | `ReservaCrearDto`, `UsuariosController` |
| Métodos asíncronos | terminan en `Async` | `ObtenerPorIdAsync` |
| Constantes | PascalCase | `CodigoRegla.RN01` |
| Pruebas | `Metodo_Escenario_Resultado_RNxx` | `Crear_HorarioCruzado_Falla_RN01` |
| Componentes React | PascalCase, un componente por archivo | `ModalConfirmacion.tsx` |
| Hooks | prefijo `use` | `useCargarDatos` |
| Servicios del frontend | camelCase con sufijo `Service` | `reservasService.ts` |
| Tablas y columnas SQL | snake_case en minúsculas | `reservas.hora_inicio` |

## 2. Carpetas

- `Domain`: entidades, enums y reglas. **No depende de nada.**
- `Application`: DTOs, interfaces, `Result<T>` y servicios. Depende solo de Domain.
- `Infrastructure`: DbContext y repositorios. Depende de Application y Domain.
- `API`: controladores, middleware y `Program.cs`. Los controladores no llevan lógica de negocio.
- Frontend: `components/ui` (piezas sin lógica), `components/layout`, `pages` (orquestan), `services` (llamadas a la API), `hooks`, `types`.

## 3. Comentarios

- Cada clase lleva `<summary>` explicando qué es y por qué existe.
- Cada método explica qué hace.
- Las reglas se marcan con `// RN-01: ...` y los requisitos con `// RF-03`.
- Se escribe en español y con palabras simples.

## 4. Ramas

| Rama | Uso |
|---|---|
| `main` | versión estable; solo recibe merges desde `develop` al cerrar una entrega |
| `develop` | integración del trabajo diario |
| `feature/<tema>` | una funcionalidad, ej. `feature/reservas-backend` |
| `fix/<tema>` | corrección de un error, ej. `fix/solapamiento-horas-limite` |
| `docs/<tema>` | solo documentación, ej. `docs/analisis-s01` |

Flujo: `feature/*` sale de `develop` → se integra a `develop` → al terminar la semana, `develop` pasa a `main`.

## 5. Commits (Conventional Commits, en español)

Formato: `tipo(alcance opcional): descripción en minúscula y en presente`.

| Tipo | Cuándo | Ejemplo |
|---|---|---|
| `feat` | funcionalidad nueva | `feat(reservas): validar solapamiento de horarios (RN-01)` |
| `fix` | corrección | `fix(reservas): permitir reservas que empiezan cuando otra termina` |
| `test` | pruebas | `test(dominio): agregar pruebas de RN-03 y RN-04` |
| `refactor` | mejora sin cambiar el comportamiento | `refactor(application): extraer LeerFechaYHoras` |
| `docs` | documentación | `docs: agregar análisis de requisitos (S01)` |
| `chore` | tareas de mantenimiento | `chore: configurar .gitignore y user-secrets` |

Reglas: un commit = un cambio con sentido; sin contraseñas ni cadenas de conexión; sin líneas de coautoría ni menciones a herramientas de IA.

## 6. Seguridad

- Prohibido subir contraseñas, cadenas de conexión reales o claves. Se usan `dotnet user-secrets` y variables de entorno.
- Se versiona `appsettings.Example.json` con valores falsos y `.env.example`; los `.env` reales están en `.gitignore`.
- Antes de cada commit: `git status` y revisar que no aparezca ningún archivo de secretos.

## 7. Mensajes de error (usabilidad)

Dicen qué pasó y cómo corregirlo, en español y sin términos técnicos (heurísticas de Nielsen: prevención de errores y ayuda para reconocer y corregir errores). Ejemplo: «El horario permitido es de 07:00 a 22:00.»

# Plan de commits sugerido (Conventional Commits, en español)

Ordenado por semana. **[SUPUESTO]** Solo S01, S02, S03 y S08 vienen de tu enunciado; el resto es una propuesta: ajusta las semanas a las de tu sílabo.
Todos los mensajes son sin coautoría y sin menciones a herramientas de IA. Trabaja en `develop` y crea ramas `feature/*` para lo grande.

| Semana | Commits |
|---|---|
| S01 | `docs: agregar análisis de requisitos, casos de uso y matriz RF-RN` |
| S02 | `docs: justificar ciclo de vida iterativo para 9 semanas` |
| S03 | `docs: agregar estándares de nomenclatura, ramas y commits`<br>`chore: crear solución, proyectos y referencias entre capas`<br>`chore: configurar .gitignore, user-secrets y appsettings.Example.json` |
| S04 | `feat(dominio): agregar entidades Usuario, Ambiente y Reserva`<br>`feat(dominio): agregar enums y ResultadoDominio`<br>`feat(dominio): aplicar RN-03 y RN-04 al crear reservas`<br>`feat(dominio): agregar Aprobar, Rechazar y Cancelar con RN-05 y RN-06` |
| S05 | `feat(application): agregar Result<T>, DTOs e interfaces`<br>`feat(application): registrar usuarios y ambientes (RF-01, RF-02)`<br>`feat(application): registrar reservas y validar disponibilidad (RF-03, RF-04, RN-01)` |
| S06 | `feat(infraestructura): agregar DbContext con Fluent API`<br>`feat(infraestructura): agregar repositorios`<br>`feat(bd): agregar migración inicial`<br>`feat(bd): agregar script 01_init.sql con datos de prueba`<br>`feat(api): agregar controladores, middleware y Swagger`<br>`feat(api): distinguir al administrador con X-Admin-Key (RN-05)` |
| S07 | `feat(frontend): crear proyecto Vite con apiClient y servicios`<br>`feat(frontend): agregar componentes reutilizables de formulario`<br>`feat(frontend): agregar registro de usuarios y ambientes`<br>`feat(frontend): agregar reservas con validación de disponibilidad`<br>`feat(frontend): agregar listado con filtros y detalle`<br>`feat(frontend): agregar cambio de estado con modal de confirmación`<br>`feat(frontend): agregar dashboard con indicadores` |
| S08 | `refactor(application): extraer LeerFechaYHoras y TipoPorCodigo`<br>`refactor(dominio): reemplazar textos "RN-01" por CodigoRegla`<br>`refactor(frontend): extraer useCargarDatos y Campo` |
| S09 | `test: agregar pruebas de RN-01 a RN-06`<br>`docs: agregar README, CHANGELOG y evidencia de pruebas`<br>`fix: corregir lo que aparezca al probar`<br>`chore: preparar versión 0.1.0` |

Después de cada bloque: `git push` a la rama de trabajo; al cerrar la semana, merge `develop` → `main` y `git push origin main`.

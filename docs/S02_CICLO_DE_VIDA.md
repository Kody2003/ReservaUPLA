# S02 — Justificación del ciclo de vida (borrador)

> Borrador para reescribir con tus palabras.

## 1. Contexto del proyecto

Un solo desarrollador, 9 semanas, requisitos pequeños y ya definidos (RF-01 a RF-08, RN-01 a RN-06), con entregas parciales al docente y una sustentación final.

## 2. Comparación

| Criterio | Cascada | Iterativo e incremental | Scrum |
|---|---|---|---|
| Idea | Fases en secuencia: análisis, diseño, código, pruebas | Entregas pequeñas que se mejoran en ciclos | Sprints cortos con roles, eventos y backlog |
| Requisitos cambiantes | Mal: volver atrás es caro | Bien: se ajusta en cada ciclo | Muy bien |
| Retroalimentación | Al final | En cada iteración | En cada sprint |
| Riesgo de llegar tarde con algo roto | Alto: se prueba al final | Bajo: siempre hay una versión que funciona | Bajo |
| Carga de gestión | Baja | Baja a media | Alta: roles (Product Owner, Scrum Master, equipo) y ceremonias pensadas para equipos |
| Encaje con 1 desarrollador | Aceptable pero riesgoso | **Muy bueno** | Parcial: se adapta, no se aplica completo |
| Documentación | Mucha y temprana | Moderada | Ligera |

## 3. Recomendación

**Ciclo iterativo e incremental con prácticas ligeras de Scrum** (backlog, iteraciones semanales y tablero de tareas), sin los roles ni las reuniones de equipo.

Por qué:
1. Los requisitos están definidos, pero la actividad exige entregar cosas parciales y mostrar avance; cada semana debe terminar con algo que funcione.
2. Con una sola persona, los roles de Scrum no tienen sentido; sí sirven el backlog y la revisión semanal.
3. Reduce el riesgo: las reglas de negocio se prueban desde el dominio (S04) y no al final.
4. Cascada obligaría a diseñar todo antes de programar y a probar al final, con poco margen si algo falla en la semana 9.

## 4. Cómo se ve en las 9 semanas **[SUPUESTO]**

| Iteración | Resultado entregable |
|---|---|
| S01–S03 | Análisis, justificación del ciclo de vida, estándares y estructura del repositorio |
| S04–S05 | Dominio y casos de uso con pruebas de reglas |
| S06 | API y base de datos funcionando (Swagger) |
| S07 | Frontend conectado |
| S08 | Refactorización con las pruebas como red de seguridad |
| S09 | Pruebas finales, documentación y sustentación |

Cada iteración termina con: código compilando, commits ordenados y una prueba de que lo nuevo funciona.

## 5. Fuentes a citar (tú las buscas)

- Sommerville y/o Pressman: capítulos sobre **modelos de proceso** (cascada, incremental, ágil).
- Royce (1970), artículo clásico asociado al modelo en cascada.
- **Guía de Scrum** (Schwaber y Sutherland), documento oficial gratuito.
- Algún texto sobre **desarrollo iterativo e incremental** y sobre adaptar métodos ágiles a proyectos individuales.

Verifica los datos de publicación antes de citar.

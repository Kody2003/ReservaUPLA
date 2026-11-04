# Evidencia de pruebas (PARTE 5)

La columna **Obtenido** la llenas tú después de correr las pruebas: yo no puedo ejecutarlas desde aquí, así que no la completé.

## 1. Pruebas automáticas

```powershell
# Desde la raíz del proyecto
dotnet test backend/ReservaUPLA.sln

# Solo las de una regla (el nombre de cada prueba termina en la regla)
dotnet test backend/ReservaUPLA.sln --filter "FullyQualifiedName~RN01"
dotnet test backend/ReservaUPLA.sln --logger "console;verbosity=detailed"
```

| Caso | Entrada | Esperado | Obtenido |
|---|---|---|---|
| `Crear_HorarioCruzado_Falla_RN01` | Reserva 09:00–10:00 y el repositorio dice que ya hay una Aprobada que se cruza | Falla, código RN-01, tipo Conflicto, no se guarda | |
| `CambiarEstado_AprobarConHorarioCruzado_Falla_RN01` | Aprobar con otra Aprobada cruzada | Falla RN-01, la reserva sigue Pendiente | |
| `Aprobar_ConSolapamiento_Falla_RN01` | `Aprobar(Administrador, haySolapamiento: true)` | Falla RN-01 | |
| `HorariosSeCruzan_...RN01` | 08–10 vs 09–11 / 09–10 vs 08–12 / 08–09 vs 09–10 / 11–12 vs 08–10 | true / true / false / false | |
| `Crear_MotivoVacio_Falla_RN02` | Motivo vacío | Falla RN-02 | |
| `Crear_HoraFinIgualAInicio_Falla_RN03` | 09:00–09:00 | Falla RN-03 | |
| `Crear_HoraFinNoMayorQueInicio_Falla_RN03` | 09:00–09:00 y 10:00–09:00 | Falla RN-03 | |
| `Crear_FueraDeHorario_Falla_RN04` | 06:00–08:00 y 21:00–23:00 | Falla RN-04 | |
| `Crear_HorarioEnLosLimites_Exito_RN04` | 07:00–22:00 | Éxito, estado Pendiente | |
| `CambiarEstado_AprobarSinSerAdministrador_Falla_RN05` | Aprobar con rol Solicitante | Falla RN-05, tipo Prohibido (403) | |
| `Aprobar_RolNoAdministrador_Falla_RN05` / `Rechazar_...` | Roles Solicitante y ResponsableAmbiente | Falla RN-05 | |
| `CambiarEstado_AdministradorAprueba_Exito_RN05` | Aprobar con Administrador y sin cruces | Éxito, estado Aprobada, se guarda una vez | |
| `CambiarEstado_ModificarReservaRechazada_Falla_RN06` | Aprobar una reserva ya Rechazada | Falla RN-06, tipo Conflicto, sigue Rechazada | |
| `Aprobar_ReservaRechazada_Falla_RN06`, `Rechazar_ReservaYaRechazada_Falla_RN06`, `Cancelar_ReservaRechazada_Falla_RN06` | Cualquier cambio sobre una Rechazada | Falla RN-06 | |

## 2. Verificación manual de la API con PowerShell

Primero arranca la API (`dotnet run --project backend/src/ReservaUPLA.API`) y carga los datos de prueba (`database/01_init.sql`). Cambia `$clave` por tu `Admin:ApiKey`.

```powershell
$base  = "http://localhost:5080"
$clave = "<TU_ADMIN_API_KEY>"

# Ayuda para ver el mensaje de error de la API sin que PowerShell lo esconda
function Probar($bloque) {
  try { & $bloque } catch { Write-Host "HTTP error:" $_.ErrorDetails.Message -ForegroundColor Yellow }
}

# --- Listas (RF-05) y dashboard (RF-08) ---
$usuarios  = Invoke-RestMethod "$base/api/usuarios"
$ambientes = Invoke-RestMethod "$base/api/ambientes"
Invoke-RestMethod "$base/api/dashboard"        # esperado con el seed: total 11, aprobadas 6, pendientes 2, rechazadas 2, Aula 101

$ana  = ($usuarios  | Where-Object { $_.nombreCompleto -like "Ana*" }).id
$aula = ($ambientes | Where-Object { $_.nombre -eq "Aula 101" }).id
$sala = ($ambientes | Where-Object { $_.nombre -like "Sala de Reuniones*" }).id
$manana = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")   # el seed tiene reservas Aprobadas de Aula 101 para mañana 08:00-12:00

function NuevaReserva($amb, $fecha, $ini, $fin, $motivo) {
  $cuerpo = @{ usuarioId=$ana; ambienteId=$amb; fecha=$fecha; horaInicio=$ini; horaFin=$fin; motivo=$motivo } | ConvertTo-Json
  Invoke-RestMethod "$base/api/reservas" -Method Post -ContentType "application/json" -Body $cuerpo
}

# --- RN-01: horario cruzado (esperado: 409 y mensaje de solapamiento) ---
Probar { NuevaReserva $aula $manana "09:00" "11:00" "Prueba RN-01" }

# --- RN-03: fin menor o igual al inicio (esperado: 400) ---
Probar { NuevaReserva $aula $manana "15:00" "15:00" "Prueba RN-03" }

# --- RN-04: fuera de 07:00-22:00 (esperado: 400) ---
Probar { NuevaReserva $aula $manana "06:00" "08:00" "Prueba RN-04" }

# --- RN-02: motivo vacío (esperado: 400) ---
Probar { NuevaReserva $aula $manana "16:00" "17:00" "" }

# --- Ambiente en mantenimiento (esperado: 400) ---
Probar { NuevaReserva $sala $manana "16:00" "17:00" "Prueba ambiente" }

# --- RF-04: disponibilidad (esperado: disponible false con RN-01; luego true) ---
Invoke-RestMethod "$base/api/reservas/disponibilidad?ambienteId=$aula&fecha=$manana&horaInicio=09:00&horaFin=10:00"
Invoke-RestMethod "$base/api/reservas/disponibilidad?ambienteId=$aula&fecha=$manana&horaInicio=17:00&horaFin=18:00"

# --- RF-03: reserva válida (esperado: 201, estado Pendiente) ---
$nueva = NuevaReserva $aula $manana "17:00" "18:00" "Reunión de prueba"
$nueva

# --- RN-05: aprobar SIN clave de administrador (esperado: 403) ---
$cambio = @{ nuevoEstado = "Aprobada" } | ConvertTo-Json
Probar { Invoke-RestMethod "$base/api/reservas/$($nueva.id)/estado" -Method Patch -ContentType "application/json" -Body $cambio }

# --- RN-05: aprobar CON clave (esperado: 200, estado Aprobada) ---
Invoke-RestMethod "$base/api/reservas/$($nueva.id)/estado" -Method Patch -ContentType "application/json" -Body $cambio -Headers @{ "X-Admin-Key" = $clave }

# --- RN-06: rechazar otra reserva y luego intentar aprobarla (esperado: 409) ---
$otra = NuevaReserva $aula $manana "19:00" "20:00" "Para rechazar"
$rechazar = @{ nuevoEstado = "Rechazada" } | ConvertTo-Json
Invoke-RestMethod "$base/api/reservas/$($otra.id)/estado" -Method Patch -ContentType "application/json" -Body $rechazar -Headers @{ "X-Admin-Key" = $clave }
Probar { Invoke-RestMethod "$base/api/reservas/$($otra.id)/estado" -Method Patch -ContentType "application/json" -Body $cambio -Headers @{ "X-Admin-Key" = $clave } }

# --- RF-05 con filtros y RF-06 detalle ---
Invoke-RestMethod "$base/api/reservas?estado=Aprobada&fecha=$manana"
Invoke-RestMethod "$base/api/reservas/$($nueva.id)"
```

| Caso | Entrada | Esperado | Obtenido |
|---|---|---|---|
| RN-01 al crear | Aula 101, mañana 09:00–11:00 | 409, mensaje de solapamiento | |
| RN-03 | 15:00–15:00 | 400, «La hora de fin debe ser mayor…» | |
| RN-04 | 06:00–08:00 | 400, «El horario permitido es de 07:00 a 22:00.» | |
| RN-02 | Motivo vacío | 400, «El motivo… es obligatorio.» | |
| Ambiente no disponible | Sala de Reuniones 2 | 400 | |
| RF-04 ocupado / libre | 09:00–10:00 / 17:00–18:00 | `disponible: false` / `true` | |
| RF-03 válido | 17:00–18:00 | 201, estado Pendiente | |
| RN-05 sin clave | Aprobar sin cabecera | 403 | |
| RN-05 con clave | Aprobar con `X-Admin-Key` | 200, Aprobada | |
| RN-06 | Aprobar una Rechazada | 409 | |
| RF-08 | GET dashboard con el seed | Total 11, Aprobadas 6, Pendientes 2, Rechazadas 2, Aula 101 | |

Si repites el script, cambia las horas: las reservas que aprobaste ya ocupan esos horarios y es probable que aparezca RN-01.

# Evidencia de pruebas

Este documento contiene la matriz de pruebas unitarias automáticas (41 pruebas en verde) y las pruebas manuales de verificación de API mediante PowerShell.

> **Nota:** La columna **Obtenido** se deja intencionalmente vacía para que el estudiante la complete al momento de ejecutar las pruebas en su entorno local y capturar los resultados para el informe.

---

## 1. Pruebas automáticas (Suite xUnit + Moq)

Comando de ejecución desde la raíz del proyecto:
```powershell
dotnet test backend/ReservaUPLA.sln --logger "console;verbosity=normal"
```

### Matriz de pruebas automáticas (41 pruebas ejecutadas)

| Módulo / Prueba | Entrada y escenario de prueba | Comportamiento Esperado | Obtenido |
|---|---|---|---|
| **Regla RN-01: Sin solapamiento** | | | |
| `Crear_HorarioCruzado_Falla_RN01` | Intento de reserva 09:00–11:00 en ambiente con reserva ya aprobada en ese rango. | Falla con código RN-01, tipo Conflicto (409), no persiste. | |
| `Crear_HorarioLibre_Exito_RN01` | Intento de reserva en horario sin solapamientos. | Éxito, estado Pendiente. | |
| `CambiarEstado_AprobarConHorarioCruzado_Falla_RN01` | Administrador aprueba una reserva que colisiona con otra aprobada posteriormente. | Falla RN-01, permanece en estado Pendiente. | |
| `Aprobar_ConSolapamiento_Falla_RN01` | Llamada a `Reserva.Aprobar` con flag `haySolapamiento: true`. | Falla validación de dominio RN-01. | |
| `HorariosSeCruzan_CasosVarios_DevuelveLoEsperado_RN01` (4 teorías) | Casos: (08-10 vs 09-11), (09-10 vs 08-12), (08-09 vs 09-10 frontera), (11-12 vs 08-10 disjuntos). | Evalúa exactamente: `true`, `true`, `false`, `false`. | |
| **Regla RN-02: Campos obligatorios** | | | |
| `Crear_MotivoVacio_Falla_RN02` (Dominio) | Creación de reserva con motivo vacío o espacios en blanco. | Falla validación de dominio RN-02. | |
| `Crear_MotivoVacio_Falla_RN02` (Aplicación) | `ReservaCrearDto` con motivo en blanco enviado a `ReservaService`. | Devuelve `Result.Falla` con código RN-02. | |
| **Regla RN-03: Hora fin mayor que hora inicio** | | | |
| `Crear_HoraFinIgualAInicio_Falla_RN03` | Rango horario con inicio y fin iguales (ej. 09:00 a 09:00). | Falla con código RN-03. | |
| `Crear_HoraFinNoMayorQueInicio_Falla_RN03` (2 teorías) | Rango invertido (10:00 a 09:00) y rango idéntico (09:00 a 09:00). | Falla en dominio con código RN-03. | |
| **Regla RN-04: Horario permitido (07:00 a 22:00)** | | | |
| `Crear_FueraDeHorario_Falla_RN04` (2 teorías) | Rangos: 06:00 a 08:00 y 21:00 a 23:00 en servicio. | Falla con código RN-04. | |
| `Crear_FueraDeHorarioPermitido_Falla_RN04` (2 teorías) | Rangos: 06:30 a 08:00 y 21:00 a 22:30 en entidad. | Falla en dominio con código RN-04. | |
| `Crear_HorarioEnLosLimites_Exito_RN04` | Rango exacto límite de 07:00 a 22:00. | Creación exitosa en estado Pendiente. | |
| **Regla RN-05: Solo Administrador aprueba/rechaza** | | | |
| `Aprobar_Administrador_Exito_RN05` | Operador con rol `Administrador` aprueba reserva pendiente. | Éxito, estado transiciona a Aprobada. | |
| `Aprobar_RolNoAdministrador_Falla_RN05` (2 teorías) | Roles `Solicitante` y `ResponsableAmbiente` intentan aprobar en dominio. | Falla con código RN-05. | |
| `Rechazar_RolNoAdministrador_Falla_RN05` (2 teorías) | Roles `Solicitante` y `ResponsableAmbiente` intentan rechazar en dominio. | Falla con código RN-05. | |
| `CambiarEstado_AprobarSinSerAdministrador_Falla_RN05` | Solicitante intenta aprobar mediante `ReservaService`. | Falla con error de tipo `Prohibido` (403) y código RN-05. | |
| `CambiarEstado_AdministradorAprueba_Exito_RN05` | Administrador aprueba mediante `ReservaService`. | Éxito, persiste una vez en repositorio. | |
| **Regla RN-06: Inmutabilidad de reserva rechazada** | | | |
| `Aprobar_ReservaRechazada_Falla_RN06` | Intento de aprobar reserva en estado Rechazada. | Falla con código RN-06. | |
| `Rechazar_ReservaYaRechazada_Falla_RN06` | Intento de volver a rechazar reserva ya Rechazada. | Falla con código RN-06. | |
| `Cancelar_ReservaRechazada_Falla_RN06` | Intento de cancelar reserva en estado Rechazada. | Falla con código RN-06. | |
| `CambiarEstado_ModificarReservaRechazada_Falla_RN06` | Intento de modificar estado de reserva rechazada en servicio. | Falla con tipo Conflicto (409) y código RN-06. | |
| **Autenticación, Roles y Seguridad (LOGIN)** | | | |
| `IniciarSesion_CredencialesCorrectas_DevuelveToken_LOGIN` | Correo y contraseña válidos de usuario activo. | Devuelve token JWT con claims de ID, nombre, correo y rol. | |
| `IniciarSesion_ContrasenaIncorrecta_DevuelveMensajeGenerico_LOGIN` | Correo existente con contraseña incorrecta. | Mensaje genérico «Correo o contraseña incorrectos» (evita enumeración). | |
| `IniciarSesion_CorreoInexistente_DevuelveMismoMensajeGenerico_LOGIN` | Correo no registrado en el sistema. | Mismo mensaje genérico «Correo o contraseña incorrectos». | |
| `IniciarSesion_UsuarioInactivo_NoEntra_LOGIN` | Credenciales de usuario desactivado (`Activo = false`). | Falla con mensaje explícito de cuenta desactivada. | |
| `IniciarSesionDemo_RolInactivo_FallaIgualQueLogin_LOGIN` | Acceso demo sobre rol con cuenta inactiva. | Mismo mensaje de rechazo de cuenta desactivada. | |
| `PasswordHasher_VerificaBien_YDosHashesSonDistintos_LOGIN` | Hashing PBKDF2 de una misma contraseña dos veces. | Ambos hashes son distintos por sales aleatorias y ambos verifican con éxito. | |
| `CambiarContrasena_ActualIncorrecta_Falla_LOGIN` | Cambio de contraseña con clave actual errónea. | Falla indicando que la contraseña actual no es correcta. | |
| `CambiarContrasena_MismaContrasena_Falla_LOGIN` | Nueva contraseña idéntica a la actual. | Falla indicando que la nueva debe ser distinta. | |
| `CambiarContrasena_DatosValidos_GuardaHashNuevo_LOGIN` | Contraseña actual válida y nueva contraseña que cumple reglas. | Éxito, persiste el nuevo hash PBKDF2. | |
| **Aislamiento de Datos por Rol** | | | |
| `Listar_Solicitante_SoloVeLasSuyas` | Consulta de listado por usuario con rol Solicitante. | Retorna exclusivamente reservas donde `UsuarioId == idSolicitante`. | |
| `Cancelar_ReservaAjena_Falla` | Solicitante intenta cancelar una reserva perteneciente a otro usuario. | Falla con error de recurso no encontrado o no autorizado. | |
| `Crear_Solicitante_IgnoraUsuarioIdDelCliente` | Solicitante envía en el payload el ID de otro usuario. | El servicio ignora el ID del payload y asocia la reserva al ID del token. | |

---

## 2. Verificación manual de la API con PowerShell (Seguridad y JWT)

Para ejecutar estas pruebas, inicia primero la API en desarrollo:
```powershell
dotnet run --project backend/src/ReservaUPLA.API
```

> **Importante:** Por seguridad, las contraseñas se solicitan interactivamente mediante `Read-Host -AsSecureString`, evitando que queden registradas en el historial de comandos o en scripts.

```powershell
$base = "http://localhost:5080"

# Función auxiliar para capturar y mostrar respuestas de error de la API
function Probar([ScriptBlock]$bloque) {
    try {
        & $bloque
    } catch {
        $resp = $_.Exception.Response
        $codigo = if ($resp) { [int]$resp.StatusCode } else { $_.Exception.Message }
        $detalle = $_.ErrorDetails.Message
        Write-Host "HTTP $codigo -> $detalle" -ForegroundColor Yellow
    }
}

# =============================================================================
# CASO 1: Login correcto y obtención del token JWT
# =============================================================================
Write-Host "--- CASO 1: Iniciar sesión como Administrador ---" -ForegroundColor Cyan
$credAdmin = Read-Host "Ingresa la contraseña para marta.quispe@ejemplo.edu.pe" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($credAdmin)
$passPlano = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

$cuerpoLogin = @{
    correo = "marta.quispe@ejemplo.edu.pe"
    contrasena = $passPlano
} | ConvertTo-Json

$respLogin = Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType "application/json" -Body $cuerpoLogin
$tokenAdmin = $respLogin.token
Write-Host "Token JWT obtenido con éxito para $($respLogin.usuario.nombreCompleto) (Rol: $($respLogin.usuario.rol))" -ForegroundColor Green

# Cabecera de autorización para peticiones administrativas
$headersAdmin = @{ "Authorization" = "Bearer $tokenAdmin" }

# =============================================================================
# CASO 2: Login con credenciales incorrectas (esperado: 400 Bad Request)
# =============================================================================
Write-Host "`n--- CASO 2: Login con contraseña incorrecta ---" -ForegroundColor Cyan
$cuerpoInvalido = @{
    correo = "marta.quispe@ejemplo.edu.pe"
    contrasena = "ContrasenaEquivocada999"
} | ConvertTo-Json
Probar { Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType "application/json" -Body $cuerpoInvalido }

# =============================================================================
# CASO 3: Login con usuario inactivo (esperado: 400 Bad Request con mensaje de cuenta desactivada)
# =============================================================================
Write-Host "`n--- CASO 3: Login con usuario inactivo (Pedro Salas) ---" -ForegroundColor Cyan
$cuerpoInactivo = @{
    correo = "pedro.salas@ejemplo.edu.pe"
    contrasena = $passPlano
} | ConvertTo-Json
Probar { Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType "application/json" -Body $cuerpoInactivo }

# =============================================================================
# CASO 4: Petición a endpoint protegido sin token (esperado: 401 Unauthorized)
# =============================================================================
Write-Host "`n--- CASO 4: Acceso sin token a /api/reservas ---" -ForegroundColor Cyan
Probar { Invoke-RestMethod "$base/api/reservas" }

# =============================================================================
# CASO 5: Inicio de sesión como Solicitante y prueba de 403 Forbidden al intentar aprobar
# =============================================================================
Write-Host "`n--- CASO 5: Solicitante intenta aprobar reserva (esperado: 403 Forbidden) ---" -ForegroundColor Cyan
# Obtenemos token de Solicitante (Ana Torres) mediante endpoint demo en Development
$respDemoSolicitante = Invoke-RestMethod "$base/api/auth/demo" -Method Post -ContentType "application/json" -Body (@{ rol = "Solicitante" } | ConvertTo-Json)
$tokenSolicitante = $respDemoSolicitante.token
$headersSolicitante = @{ "Authorization" = "Bearer $tokenSolicitante" }

# Obtenemos cualquier reserva pendiente existente
$reservasAdmin = Invoke-RestMethod "$base/api/reservas" -Headers $headersAdmin
$reservaPendiente = ($reservasAdmin | Where-Object { $_.estado -eq "Pendiente" } | Select-Object -First 1)

$cuerpoAprobar = @{ nuevoEstado = "Aprobada" } | ConvertTo-Json
Probar {
    Invoke-RestMethod "$base/api/reservas/$($reservaPendiente.id)/estado" -Method Patch -ContentType "application/json" -Body $cuerpoAprobar -Headers $headersSolicitante
}

# =============================================================================
# CASO 6: Solicitante intenta consultar detalle de reserva ajena (esperado: 404 Not Found)
# =============================================================================
Write-Host "`n--- CASO 6: Solicitante consulta reserva de otro usuario (esperado: 404 Not Found) ---" -ForegroundColor Cyan
$reservaAjena = ($reservasAdmin | Where-Object { $_.usuarioId -ne $respDemoSolicitante.usuario.id } | Select-Object -First 1)
Probar {
    Invoke-RestMethod "$base/api/reservas/$($reservaAjena.id)" -Headers $headersSolicitante
}

# =============================================================================
# CASO 7: Cambio de contraseña con contraseña actual incorrecta (esperado: 400 Bad Request)
# =============================================================================
Write-Host "`n--- CASO 7: Cambio de contraseña fallido por clave actual errónea ---" -ForegroundColor Cyan
$cuerpoCambioErroneo = @{
    contrasenaActual = "ClaveIncorrecta123"
    nuevaContrasena = "NuevaSegura2026!"
} | ConvertTo-Json
Probar {
    Invoke-RestMethod "$base/api/auth/contrasena" -Method Patch -ContentType "application/json" -Body $cuerpoCambioErroneo -Headers $headersAdmin
}

# =============================================================================
# CASO 8: Aprobación exitosa por Administrador con JWT (esperado: 200 OK)
# =============================================================================
Write-Host "`n--- CASO 8: Aprobación legítima por Administrador ---" -ForegroundColor Cyan
if ($reservaPendiente) {
    $aprobada = Invoke-RestMethod "$base/api/reservas/$($reservaPendiente.id)/estado" -Method Patch -ContentType "application/json" -Body $cuerpoAprobar -Headers $headersAdmin
    Write-Host "Reserva aprobada exitosamente. Nuevo estado: $($aprobada.estado)" -ForegroundColor Green
}
```

---

### Matriz de Verificación Manual (Casos Nuevos de Seguridad)

| N° | Escenario de Verificación | Entrada / Método HTTP | Comportamiento Esperado | Obtenido |
|---|---|---|---|---|
| 1 | Login exitoso | `POST /api/auth/login` con credenciales válidas de Marta Quispe | HTTP 200 con token JWT y datos de perfil. | |
| 2 | Login con contraseña errónea | `POST /api/auth/login` con contraseña inválida | HTTP 400 «Correo o contraseña incorrectos». | |
| 3 | Login con cuenta desactivada | `POST /api/auth/login` para `pedro.salas@ejemplo.edu.pe` | HTTP 400 «Tu cuenta está desactivada. Comunícate con el administrador.». | |
| 4 | Petición sin token de autenticación | `GET /api/reservas` sin cabecera `Authorization` | HTTP 401 Unauthorized. | |
| 5 | Solicitante intenta aprobar reserva | `PATCH /api/reservas/{id}/estado` con token de rol `Solicitante` | HTTP 403 Forbidden (RN-05). | |
| 6 | Solicitante consulta reserva ajena | `GET /api/reservas/{id}` con ID de reserva de otro usuario | HTTP 404 Not Found (evita enumeración de recursos). | |
| 7 | Cambio de contraseña con clave actual incorrecta | `PATCH /api/auth/contrasena` con `contrasenaActual` equivocada | HTTP 400 «La contraseña actual no es correcta.». | |
| 8 | Aprobación exitosa por Administrador | `PATCH /api/reservas/{id}/estado` con token de Administrador | HTTP 200 con estado `Aprobada`. | |

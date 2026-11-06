using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservaUPLA.API.Seguridad;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Common;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.API.Controllers;

/// <summary>
/// Endpoints de reservas (RF-03 a RF-07). Requiere autenticación JWT.
/// Controlador delgado: la lógica está en <see cref="IReservaService"/> y las reglas en la entidad Reserva.
/// // LOGIN // RN-01 // RN-05 // RN-06
/// </summary>
[Route("api/reservas")]
[Authorize]
public class ReservasController : ApiControllerBase
{
    private readonly IReservaService _servicio;
    private readonly IRolActualProvider _rolActual;

    public ReservasController(IReservaService servicio, IRolActualProvider rolActual)
    {
        _servicio = servicio;
        _rolActual = rolActual;
    }

    /// <summary>RF-03: POST api/reservas — registra una reserva Pendiente.</summary>
    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] ReservaCrearDto dto)
    {
        var rol = _rolActual.ObtenerRolActual();
        var usuarioId = _rolActual.ObtenerUsuarioIdActual();
        return ResponderCreado(await _servicio.CrearAsync(dto, rol, usuarioId));
    }

    /// <summary>RF-05: GET api/reservas?estado=&amp;ambienteId=&amp;fecha= — lista con filtros opcionales.</summary>
    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] string? estado, [FromQuery] string? ambienteId, [FromQuery] string? fecha)
    {
        var rol = _rolActual.ObtenerRolActual();
        var usuarioId = _rolActual.ObtenerUsuarioIdActual();
        return Responder(await _servicio.ListarAsync(estado, ambienteId, fecha, rol, usuarioId));
    }

    /// <summary>RF-04: GET api/reservas/disponibilidad — ¿está libre el ambiente en ese horario?</summary>
    [HttpGet("disponibilidad")]
    public async Task<IActionResult> Disponibilidad(
        [FromQuery] string? ambienteId, [FromQuery] string? fecha,
        [FromQuery] string? horaInicio, [FromQuery] string? horaFin) =>
        Responder(await _servicio.ValidarDisponibilidadAsync(ambienteId, fecha, horaInicio, horaFin));

    /// <summary>RF-06: GET api/reservas/{id} — detalle de una reserva.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObtenerPorId(Guid id)
    {
        var rol = _rolActual.ObtenerRolActual();
        var usuarioId = _rolActual.ObtenerUsuarioIdActual();
        return Responder(await _servicio.ObtenerPorIdAsync(id, rol, usuarioId));
    }

    /// <summary>
    /// RF-07: PATCH api/reservas/{id}/estado — cambia el estado de una reserva.
    /// RN-05: Doble defensa; el controlador rechaza con 403 si un no-administrador intenta aprobar o rechazar.
    /// </summary>
    [HttpPatch("{id:guid}/estado")]
    public async Task<IActionResult> CambiarEstado(Guid id, [FromBody] CambioEstadoDto dto)
    {
        var rol = _rolActual.ObtenerRolActual();
        var usuarioId = _rolActual.ObtenerUsuarioIdActual();

        // RN-05: Doble defensa a nivel de controlador
        var esAprobarORechazar = string.Equals(dto.NuevoEstado, "Aprobada", StringComparison.OrdinalIgnoreCase)
                              || string.Equals(dto.NuevoEstado, "Rechazada", StringComparison.OrdinalIgnoreCase);

        if (esAprobarORechazar && rol != RolUsuario.Administrador)
        {
            var problema = new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Acción no permitida",
                Detail = "Solo un usuario con rol Administrador puede aprobar o rechazar reservas.",
                Instance = Request.Path
            };
            problema.Extensions["codigo"] = CodigoRegla.RN05;
            return new ObjectResult(problema) { StatusCode = StatusCodes.Status403Forbidden };
        }

        return Responder(await _servicio.CambiarEstadoAsync(id, dto.NuevoEstado, rol, usuarioId));
    }
}

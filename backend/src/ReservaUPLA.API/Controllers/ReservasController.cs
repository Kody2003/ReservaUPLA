using Microsoft.AspNetCore.Mvc;
using ReservaUPLA.API.Seguridad;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.API.Controllers;

/// <summary>
/// Endpoints de reservas (RF-03 a RF-07). Controlador delgado: la lógica está en
/// <see cref="IReservaService"/> y las reglas en la entidad Reserva.
/// </summary>
[Route("api/reservas")]
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
    public async Task<IActionResult> Crear([FromBody] ReservaCrearDto dto) =>
        ResponderCreado(await _servicio.CrearAsync(dto));

    /// <summary>RF-05: GET api/reservas?estado=&amp;ambienteId=&amp;fecha= — lista con filtros opcionales.</summary>
    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] string? estado, [FromQuery] string? ambienteId, [FromQuery] string? fecha) =>
        Responder(await _servicio.ListarAsync(estado, ambienteId, fecha));

    /// <summary>RF-04: GET api/reservas/disponibilidad — ¿está libre el ambiente en ese horario?</summary>
    [HttpGet("disponibilidad")]
    public async Task<IActionResult> Disponibilidad(
        [FromQuery] string? ambienteId, [FromQuery] string? fecha,
        [FromQuery] string? horaInicio, [FromQuery] string? horaFin) =>
        Responder(await _servicio.ValidarDisponibilidadAsync(ambienteId, fecha, horaInicio, horaFin));

    /// <summary>RF-06: GET api/reservas/{id} — detalle de una reserva.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObtenerPorId(Guid id) =>
        Responder(await _servicio.ObtenerPorIdAsync(id));

    /// <summary>
    /// RF-07: PATCH api/reservas/{id}/estado — cambia el estado.
    /// RN-05: el rol sale de la cabecera X-Admin-Key; el servicio y la entidad deciden si puede.
    /// </summary>
    [HttpPatch("{id:guid}/estado")]
    public async Task<IActionResult> CambiarEstado(Guid id, [FromBody] CambioEstadoDto dto) =>
        Responder(await _servicio.CambiarEstadoAsync(id, dto.NuevoEstado, _rolActual.ObtenerRolActual()));
}

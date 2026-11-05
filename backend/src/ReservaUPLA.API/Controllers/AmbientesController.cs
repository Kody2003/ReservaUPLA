using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.API.Controllers;

/// <summary>
/// Endpoints de ambientes (RF-02). Requiere autenticación JWT.
/// // RF-02 // LOGIN
/// </summary>
[Route("api/ambientes")]
[Authorize]
public class AmbientesController : ApiControllerBase
{
    private readonly IAmbienteService _servicio;

    public AmbientesController(IAmbienteService servicio)
    {
        _servicio = servicio;
    }

    /// <summary>RF-02: POST api/ambientes — registra un ambiente (solo Administrador).</summary>
    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Crear([FromBody] AmbienteCrearDto dto) =>
        ResponderCreado(await _servicio.CrearAsync(dto));

    /// <summary>GET api/ambientes — lista ambientes para cualquier usuario autenticado.</summary>
    [HttpGet]
    public async Task<IActionResult> Listar() =>
        Responder(await _servicio.ListarAsync());
}

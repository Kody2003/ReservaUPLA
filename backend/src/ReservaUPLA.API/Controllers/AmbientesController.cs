using Microsoft.AspNetCore.Mvc;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.API.Controllers;

/// <summary>Endpoints de ambientes (RF-02). Solo recibe y delega en <see cref="IAmbienteService"/>.</summary>
[Route("api/ambientes")]
public class AmbientesController : ApiControllerBase
{
    private readonly IAmbienteService _servicio;

    public AmbientesController(IAmbienteService servicio)
    {
        _servicio = servicio;
    }

    /// <summary>RF-02: POST api/ambientes — registra un ambiente.</summary>
    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] AmbienteCrearDto dto) =>
        ResponderCreado(await _servicio.CrearAsync(dto));

    /// <summary>GET api/ambientes — lista ambientes.</summary>
    [HttpGet]
    public async Task<IActionResult> Listar() =>
        Responder(await _servicio.ListarAsync());
}

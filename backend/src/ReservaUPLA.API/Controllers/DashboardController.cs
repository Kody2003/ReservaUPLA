using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.API.Controllers;

/// <summary>
/// Endpoint del dashboard (RF-08). Solo accesible por el rol Administrador.
/// // RF-08 // LOGIN
/// </summary>
[Route("api/dashboard")]
[Authorize(Roles = "Administrador")]
public class DashboardController : ApiControllerBase
{
    private readonly IDashboardService _servicio;

    public DashboardController(IDashboardService servicio)
    {
        _servicio = servicio;
    }

    /// <summary>RF-08: GET api/dashboard — totales por estado y ambiente más utilizado.</summary>
    [HttpGet]
    public async Task<IActionResult> Obtener() =>
        Responder(await _servicio.ObtenerAsync());
}

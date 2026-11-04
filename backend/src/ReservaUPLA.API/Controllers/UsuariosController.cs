using Microsoft.AspNetCore.Mvc;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.API.Controllers;

/// <summary>
/// Endpoints de usuarios (RF-01). Controlador delgado: no tiene lógica de negocio,
/// solo recibe la petición y delega en <see cref="IUsuarioService"/>.
/// </summary>
[Route("api/usuarios")]
public class UsuariosController : ApiControllerBase
{
    private readonly IUsuarioService _servicio;

    public UsuariosController(IUsuarioService servicio)
    {
        _servicio = servicio;
    }

    /// <summary>RF-01: POST api/usuarios — registra un usuario.</summary>
    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] UsuarioCrearDto dto) =>
        ResponderCreado(await _servicio.CrearAsync(dto));

    /// <summary>GET api/usuarios — lista usuarios.</summary>
    [HttpGet]
    public async Task<IActionResult> Listar() =>
        Responder(await _servicio.ListarAsync());
}

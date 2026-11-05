using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.API.Controllers;

/// <summary>
/// Endpoints de usuarios (RF-01). Requiere autenticación JWT.
/// // RF-01 // LOGIN
/// </summary>
[Route("api/usuarios")]
[Authorize]
public class UsuariosController : ApiControllerBase
{
    private readonly IUsuarioService _servicio;

    public UsuariosController(IUsuarioService servicio)
    {
        _servicio = servicio;
    }

    /// <summary>RF-01: POST api/usuarios — registra un usuario nuevo (restringido a Administrador).</summary>
    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Crear([FromBody] UsuarioCrearDto dto) =>
        ResponderCreado(await _servicio.CrearAsync(dto));

    /// <summary>
    /// GET api/usuarios — lista usuarios para administración o selectores.
    /// Si el usuario no es Administrador, expone únicamente los campos mínimos (id y nombre).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var resultado = await _servicio.ListarAsync();
        if (!resultado.Exito || resultado.Valor == null)
            return Responder(resultado);

        if (User.IsInRole("Administrador"))
            return Ok(resultado.Valor);

        // Retorna datos mínimos para selectores protegiendo correos y roles
        var datosMinimos = resultado.Valor
            .Select(u => new UsuarioDto(u.Id, u.NombreCompleto, string.Empty, string.Empty, u.Activo))
            .ToList();

        return Ok(datosMinimos);
    }
}

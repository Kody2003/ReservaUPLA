using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservaUPLA.API.Seguridad;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.API.Controllers;

/// <summary>
/// Endpoints de autenticación y gestión de credenciales (Login con JWT y cambio de clave).
/// // LOGIN
/// </summary>
[Route("api/auth")]
public class AuthController : ApiControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUsuarioRepository _usuarios;
    private readonly IRolActualProvider _rolActual;
    private readonly IWebHostEnvironment _env;

    public AuthController(
        IAuthService authService,
        IUsuarioRepository usuarios,
        IRolActualProvider rolActual,
        IWebHostEnvironment env)
    {
        _authService = authService;
        _usuarios = usuarios;
        _rolActual = rolActual;
        _env = env;
    }

    /// <summary>
    /// POST api/auth/login — Inicio de sesión con correo y contraseña.
    /// Devuelve el token JWT y los datos del perfil si las credenciales son válidas.
    /// // LOGIN // RN-02
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> IniciarSesion([FromBody] LoginDto dto) =>
        Responder(await _authService.IniciarSesionAsync(dto.Correo, dto.Contrasena));

    /// <summary>
    /// GET api/auth/yo — Obtiene la información del usuario autenticado mediante los claims del token.
    /// // LOGIN
    /// </summary>
    [HttpGet("yo")]
    [Authorize]
    public async Task<IActionResult> ObtenerUsuarioActual()
    {
        var id = _rolActual.ObtenerUsuarioIdActual();
        if (id == null)
            return Unauthorized();

        var usuario = await _usuarios.ObtenerPorIdAsync(id.Value);
        if (usuario == null)
            return NotFound();

        return Ok(usuario.ToDto());
    }

    /// <summary>
    /// PATCH api/auth/contrasena — Permite al usuario autenticado cambiar su contraseña actual por una nueva.
    /// // LOGIN
    /// </summary>
    [HttpPatch("contrasena")]
    [Authorize]
    public async Task<IActionResult> CambiarContrasena([FromBody] CambioContrasenaDto dto)
    {
        var id = _rolActual.ObtenerUsuarioIdActual();
        if (id == null)
            return Unauthorized();

        return Responder(await _authService.CambiarContrasenaAsync(id.Value, dto.Actual, dto.Nueva));
    }

    /// <summary>
    /// POST api/auth/demo — Inicio de sesión rápido para perfiles de prueba (solo en entorno de desarrollo).
    /// // LOGIN // DEMO
    /// 
    /// JUSTIFICACIÓN DE SEGURIDAD:
    /// Este endpoint NO representa una vulnerabilidad de seguridad en el sistema por las siguientes razones:
    /// 1. Únicamente se encuentra habilitado cuando el servidor corre en ambiente de desarrollo (Environment.IsDevelopment()).
    ///    En producción o staging responde 404 (NotFound), impidiendo cualquier uso indebido.
    /// 2. Las contraseñas reales nunca se exponen, no viajan por la red ni se almacenan en el código del frontend.
    /// 3. Permite la evaluación académica ágil entre distintos roles sin comprometer credenciales en repositorios.
    /// </summary>
    [HttpPost("demo")]
    [AllowAnonymous]
    public async Task<IActionResult> IniciarSesionDemo([FromBody] LoginDemoDto dto)
    {
        if (!_env.IsDevelopment())
            return NotFound();

        return Responder(await _authService.IniciarSesionDemoAsync(dto.Rol));
    }
}

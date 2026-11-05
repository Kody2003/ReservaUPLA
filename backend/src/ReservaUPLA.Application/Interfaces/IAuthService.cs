using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;

namespace ReservaUPLA.Application.Interfaces;

/// <summary>
/// Casos de uso de autenticación y gestión de contraseñas.
/// // LOGIN
/// </summary>
public interface IAuthService
{
    /// <summary>Valida credenciales, comprueba estado activo y genera el token de sesión.</summary>
    Task<Result<LoginRespuestaDto>> IniciarSesionAsync(string? correo, string? contrasena);

    /// <summary>Valida la contraseña actual y aplica reglas de seguridad para asignar una nueva.</summary>
    Task<Result<bool>> CambiarContrasenaAsync(Guid usuarioId, string? actual, string? nueva);

    /// <summary>Inicia sesión con un usuario de demostración preconfigurado (solo en desarrollo). // DEMO</summary>
    Task<Result<LoginRespuestaDto>> IniciarSesionDemoAsync(string? rol);
}

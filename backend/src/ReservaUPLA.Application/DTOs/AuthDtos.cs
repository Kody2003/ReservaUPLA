namespace ReservaUPLA.Application.DTOs;

/// <summary>
/// Credenciales enviadas por el cliente para iniciar sesión.
/// // LOGIN
/// </summary>
public record LoginDto(string? Correo, string? Contrasena);

/// <summary>
/// Respuesta tras un inicio de sesión exitoso.
/// Contiene el token JWT, expiración y los datos mínimos del usuario para la sesión frontend.
/// // LOGIN
/// </summary>
public record LoginRespuestaDto(
    string Token,
    DateTime Expiracion,
    Guid Id,
    string NombreCompleto,
    string Correo,
    string Rol);

/// <summary>
/// Datos requeridos para el cambio de contraseña de un usuario autenticado.
/// // LOGIN
/// </summary>
public record CambioContrasenaDto(string? Actual, string? Nueva);

/// <summary>
/// Petición para el acceso rápido de demostración en entorno de desarrollo.
/// // LOGIN // DEMO
/// </summary>
public record LoginDemoDto(string? Rol);

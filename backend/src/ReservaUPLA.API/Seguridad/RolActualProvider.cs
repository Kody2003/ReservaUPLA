using System.Security.Claims;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.API.Seguridad;

/// <summary>
/// Extrae la identidad (ID) y el rol del usuario a partir de los claims del token JWT de la petición HTTP.
/// Reemplaza el esquema anterior basado en la cabecera X-Admin-Key.
/// // LOGIN // RN-05
/// </summary>
public class RolActualProvider : IRolActualProvider
{
    private readonly IHttpContextAccessor _http;

    public RolActualProvider(IHttpContextAccessor http)
    {
        _http = http;
    }

    /// <summary>
    /// RN-05: Lee el rol desde el claim "role" o ClaimTypes.Role.
    /// Si no está autenticado o el claim no es válido, devuelve Solicitante por defecto.
    /// </summary>
    public RolUsuario ObtenerRolActual()
    {
        var usuario = _http.HttpContext?.User;
        if (usuario == null || !(usuario.Identity?.IsAuthenticated ?? false))
            return RolUsuario.Solicitante;

        var rolClaim = usuario.FindFirst(ClaimTypes.Role)?.Value
            ?? usuario.FindFirst("role")?.Value;

        if (!string.IsNullOrEmpty(rolClaim) && Enum.TryParse<RolUsuario>(rolClaim, true, out var rol))
            return rol;

        return RolUsuario.Solicitante;
    }

    /// <summary>
    /// Obtiene el GUID del usuario a partir del claim "sub" o ClaimTypes.NameIdentifier.
    /// Devuelve null si no se encuentra autenticado.
    /// </summary>
    public Guid? ObtenerUsuarioIdActual()
    {
        var usuario = _http.HttpContext?.User;
        if (usuario == null || !(usuario.Identity?.IsAuthenticated ?? false))
            return null;

        var idClaim = usuario.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? usuario.FindFirst("sub")?.Value;

        if (!string.IsNullOrEmpty(idClaim) && Guid.TryParse(idClaim, out var id))
            return id;

        return null;
    }
}

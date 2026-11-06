using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.API.Seguridad;

/// <summary>
/// Contrato para obtener la identidad y rol del usuario autenticado en la petición HTTP actual.
/// // LOGIN // RN-05
/// </summary>
public interface IRolActualProvider
{
    /// <summary>Obtiene el rol del usuario autenticado a partir de los claims del token JWT.</summary>
    RolUsuario ObtenerRolActual();

    /// <summary>Obtiene el ID (UUID) del usuario autenticado a partir de los claims del token JWT.</summary>
    Guid? ObtenerUsuarioIdActual();
}

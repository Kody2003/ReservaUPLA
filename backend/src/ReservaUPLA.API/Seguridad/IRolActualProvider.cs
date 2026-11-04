using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.API.Seguridad;

/// <summary>
/// Responde una sola pregunta: "¿qué rol tiene quien hace esta petición?".
/// Es una interfaz para poder cambiar la autenticación simple de hoy por JWT mañana
/// sin tocar los controladores.
/// </summary>
public interface IRolActualProvider
{
    RolUsuario ObtenerRolActual();
}

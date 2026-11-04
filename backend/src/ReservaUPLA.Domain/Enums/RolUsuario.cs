namespace ReservaUPLA.Domain.Enums;

/// <summary>
/// Rol que puede tener un usuario (RF-01). Sirve para saber quién puede hacer qué.
/// RN-05: solo el rol Administrador puede aprobar o rechazar reservas.
/// </summary>
public enum RolUsuario
{
    Solicitante = 1,
    Administrador = 2,
    ResponsableAmbiente = 3
}

namespace ReservaUPLA.Domain.Enums;

/// <summary>
/// Situación actual de un ambiente (RF-02). Solo un ambiente "Disponible" se puede reservar.
/// </summary>
public enum EstadoAmbiente
{
    Disponible = 1,
    Mantenimiento = 2,
    Inactivo = 3
}

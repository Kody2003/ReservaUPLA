namespace ReservaUPLA.Domain.Enums;

/// <summary>
/// Ciclo de vida de una reserva (RF-07).
/// Pendiente -> Aprobada | Rechazada | Cancelada ;  Aprobada -> Cancelada.
/// RN-06: Rechazada es un estado final, ya no se puede modificar.
/// </summary>
public enum EstadoReserva
{
    Pendiente = 1,
    Aprobada = 2,
    Rechazada = 3,
    Cancelada = 4
}

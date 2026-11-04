using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Interfaces;

/// <summary>Contrato para guardar y consultar reservas (implementado en Infrastructure).</summary>
public interface IReservaRepository
{
    /// <summary>RF-06: busca una reserva con su usuario y ambiente cargados. Null si no existe.</summary>
    Task<Reserva?> ObtenerPorIdAsync(Guid id);

    /// <summary>RF-05: lista reservas; cada filtro es opcional (null = no filtrar).</summary>
    Task<IReadOnlyList<Reserva>> ListarAsync(EstadoReserva? estado, Guid? ambienteId, DateOnly? fecha);

    /// <summary>
    /// RN-01 / RF-04: ¿existe otra reserva Aprobada del mismo ambiente y fecha cuyo horario se cruza?
    /// "excluirReservaId" sirve al aprobar: la reserva no debe compararse consigo misma.
    /// </summary>
    Task<bool> ExisteSolapamientoAprobadoAsync(Guid ambienteId, DateOnly fecha, TimeOnly inicio, TimeOnly fin, Guid? excluirReservaId);

    /// <summary>RF-08: cuenta reservas por estado (null = todas).</summary>
    Task<int> ContarAsync(EstadoReserva? estado);

    /// <summary>RF-08: ambiente con más reservas Aprobadas (null si aún no hay ninguna).</summary>
    Task<AmbienteUsoDto?> AmbienteMasUtilizadoAsync();

    Task AgregarAsync(Reserva reserva);

    /// <summary>Guarda los cambios de una reserva que ya fue leída del repositorio (ej. cambio de estado).</summary>
    Task ActualizarAsync(Reserva reserva);
}

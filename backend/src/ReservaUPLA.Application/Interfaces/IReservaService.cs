using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Interfaces;

/// <summary>Casos de uso de reservas (RF-03 a RF-07).</summary>
public interface IReservaService
{
    /// <summary>RF-03: registra una reserva Pendiente. El rol y usuarioId identifican al autor (Fase 2).</summary>
    Task<Result<ReservaDto>> CrearAsync(ReservaCrearDto dto, RolUsuario? rolActor = null, Guid? usuarioIdActor = null);

    /// <summary>RF-04: dice si un ambiente está libre en una fecha y horario.</summary>
    Task<Result<DisponibilidadDto>> ValidarDisponibilidadAsync(string? ambienteId, string? fecha, string? horaInicio, string? horaFin);

    /// <summary>RF-05: lista reservas con filtros opcionales. Solicitante solo ve las suyas (Fase 2).</summary>
    Task<Result<IReadOnlyList<ReservaDto>>> ListarAsync(string? estado, string? ambienteId, string? fecha, RolUsuario? rolActor = null, Guid? usuarioIdActor = null);

    /// <summary>RF-06: detalle de una reserva. Solicitante solo ve las suyas; detalle ajeno devuelve 404 (Fase 2).</summary>
    Task<Result<ReservaDto>> ObtenerPorIdAsync(Guid id, RolUsuario? rolActor = null, Guid? usuarioIdActor = null);

    /// <summary>RF-07: cambia el estado a Aprobada, Rechazada o Cancelada según el rol y autor (Fase 2).</summary>
    Task<Result<ReservaDto>> CambiarEstadoAsync(Guid id, string? nuevoEstado, RolUsuario rolActor, Guid? usuarioIdActor = null);
}

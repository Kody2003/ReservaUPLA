using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Interfaces;

/// <summary>Casos de uso de reservas (RF-03 a RF-07).</summary>
public interface IReservaService
{
    /// <summary>RF-03: registra una reserva Pendiente.</summary>
    Task<Result<ReservaDto>> CrearAsync(ReservaCrearDto dto);

    /// <summary>RF-04: dice si un ambiente está libre en una fecha y horario.</summary>
    Task<Result<DisponibilidadDto>> ValidarDisponibilidadAsync(string? ambienteId, string? fecha, string? horaInicio, string? horaFin);

    /// <summary>RF-05: lista reservas con filtros opcionales (texto tal como llega por la URL).</summary>
    Task<Result<IReadOnlyList<ReservaDto>>> ListarAsync(string? estado, string? ambienteId, string? fecha);

    /// <summary>RF-06: detalle de una reserva.</summary>
    Task<Result<ReservaDto>> ObtenerPorIdAsync(Guid id);

    /// <summary>RF-07: cambia el estado a Aprobada, Rechazada o Cancelada según el rol de quien lo pide.</summary>
    Task<Result<ReservaDto>> CambiarEstadoAsync(Guid id, string? nuevoEstado, RolUsuario rolActor);
}

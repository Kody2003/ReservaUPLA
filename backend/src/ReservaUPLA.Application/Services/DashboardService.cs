using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Services;

/// <summary>
/// RF-08: arma los números del dashboard (total, pendientes, aprobadas, rechazadas
/// y ambiente más utilizado) pidiéndole los conteos al repositorio.
/// </summary>
public class DashboardService : IDashboardService
{
    private readonly IReservaRepository _reservas;

    public DashboardService(IReservaRepository reservas)
    {
        _reservas = reservas;
    }

    /// <summary>RF-08: calcula el resumen de reservas.</summary>
    public async Task<Result<DashboardDto>> ObtenerAsync()
    {
        var total = await _reservas.ContarAsync(null);
        var pendientes = await _reservas.ContarAsync(EstadoReserva.Pendiente);
        var aprobadas = await _reservas.ContarAsync(EstadoReserva.Aprobada);
        var rechazadas = await _reservas.ContarAsync(EstadoReserva.Rechazada);
        var masUtilizado = await _reservas.AmbienteMasUtilizadoAsync();

        return Result<DashboardDto>.Ok(new DashboardDto(total, pendientes, aprobadas, rechazadas, masUtilizado));
    }
}

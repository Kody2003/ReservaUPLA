using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;

namespace ReservaUPLA.Application.Interfaces;

/// <summary>Caso de uso del dashboard (RF-08).</summary>
public interface IDashboardService
{
    Task<Result<DashboardDto>> ObtenerAsync();
}

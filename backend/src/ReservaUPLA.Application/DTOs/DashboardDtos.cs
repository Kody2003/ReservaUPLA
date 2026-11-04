namespace ReservaUPLA.Application.DTOs;

/// <summary>Ambiente con la cantidad de reservas Aprobadas que tiene (para el ambiente más utilizado).</summary>
public record AmbienteUsoDto(Guid AmbienteId, string Nombre, int TotalReservas);

/// <summary>
/// Números del dashboard (RF-08). "Total" cuenta todas las reservas, incluidas las Canceladas.
/// [SUPUESTO] "Ambiente más utilizado" = el que tiene más reservas Aprobadas.
/// </summary>
public record DashboardDto(int Total, int Pendientes, int Aprobadas, int Rechazadas, AmbienteUsoDto? AmbienteMasUtilizado);

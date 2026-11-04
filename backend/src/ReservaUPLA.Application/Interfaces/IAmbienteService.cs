using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;

namespace ReservaUPLA.Application.Interfaces;

/// <summary>Casos de uso de ambientes (RF-02).</summary>
public interface IAmbienteService
{
    Task<Result<AmbienteDto>> CrearAsync(AmbienteCrearDto dto);
    Task<Result<IReadOnlyList<AmbienteDto>>> ListarAsync();
}

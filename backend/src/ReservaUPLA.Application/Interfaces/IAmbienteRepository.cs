using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Interfaces;

/// <summary>Contrato para guardar y leer ambientes (implementado en Infrastructure).</summary>
public interface IAmbienteRepository
{
    Task<Ambiente?> ObtenerPorIdAsync(Guid id);
    Task<IReadOnlyList<Ambiente>> ListarAsync();
    Task AgregarAsync(Ambiente ambiente);
}

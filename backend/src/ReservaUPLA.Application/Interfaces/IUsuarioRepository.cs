using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Interfaces;

/// <summary>
/// Contrato para guardar y leer usuarios. Vive en Application y lo implementa Infrastructure:
/// así los servicios no saben si abajo hay PostgreSQL, memoria o lo que sea.
/// </summary>
public interface IUsuarioRepository
{
    Task<Usuario?> ObtenerPorIdAsync(Guid id);
    Task<Usuario?> ObtenerPorCorreoAsync(string correo);
    Task<bool> ExisteCorreoAsync(string correo);
    Task<IReadOnlyList<Usuario>> ListarAsync();
    Task AgregarAsync(Usuario usuario);
    Task ActualizarAsync(Usuario usuario);
}

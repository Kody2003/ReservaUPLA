using Microsoft.EntityFrameworkCore;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Infrastructure.Persistence;

namespace ReservaUPLA.Infrastructure.Repositories;

/// <summary>
/// Implementación de <see cref="IUsuarioRepository"/> con EF Core y PostgreSQL.
/// Es el único lugar donde se escriben consultas de usuarios.
/// </summary>
public class UsuarioRepository : IUsuarioRepository
{
    private readonly ReservaUplaDbContext _db;

    public UsuarioRepository(ReservaUplaDbContext db)
    {
        _db = db;
    }

    /// <summary>Busca un usuario por Id (null si no existe).</summary>
    public Task<Usuario?> ObtenerPorIdAsync(Guid id) =>
        _db.Usuarios.FirstOrDefaultAsync(u => u.Id == id);

    /// <summary>Indica si ya hay un usuario con ese correo (el correo se guarda en minúsculas).</summary>
    public Task<bool> ExisteCorreoAsync(string correo) =>
        _db.Usuarios.AnyAsync(u => u.Correo == correo);

    /// <summary>Lista todos los usuarios ordenados por nombre. AsNoTracking: solo lectura, más liviano.</summary>
    public async Task<IReadOnlyList<Usuario>> ListarAsync() =>
        await _db.Usuarios.AsNoTracking().OrderBy(u => u.NombreCompleto).ToListAsync();

    /// <summary>RF-01: guarda un usuario nuevo.</summary>
    public async Task AgregarAsync(Usuario usuario)
    {
        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();
    }
}

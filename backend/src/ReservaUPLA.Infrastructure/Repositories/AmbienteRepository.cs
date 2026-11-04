using Microsoft.EntityFrameworkCore;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Infrastructure.Persistence;

namespace ReservaUPLA.Infrastructure.Repositories;

/// <summary>Implementación de <see cref="IAmbienteRepository"/> con EF Core y PostgreSQL.</summary>
public class AmbienteRepository : IAmbienteRepository
{
    private readonly ReservaUplaDbContext _db;

    public AmbienteRepository(ReservaUplaDbContext db)
    {
        _db = db;
    }

    /// <summary>Busca un ambiente por Id (null si no existe).</summary>
    public Task<Ambiente?> ObtenerPorIdAsync(Guid id) =>
        _db.Ambientes.FirstOrDefaultAsync(a => a.Id == id);

    /// <summary>Lista todos los ambientes ordenados por nombre.</summary>
    public async Task<IReadOnlyList<Ambiente>> ListarAsync() =>
        await _db.Ambientes.AsNoTracking().OrderBy(a => a.Nombre).ToListAsync();

    /// <summary>RF-02: guarda un ambiente nuevo.</summary>
    public async Task AgregarAsync(Ambiente ambiente)
    {
        _db.Ambientes.Add(ambiente);
        await _db.SaveChangesAsync();
    }
}

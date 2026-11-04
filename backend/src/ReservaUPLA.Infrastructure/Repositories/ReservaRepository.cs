using Microsoft.EntityFrameworkCore;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;
using ReservaUPLA.Infrastructure.Persistence;

namespace ReservaUPLA.Infrastructure.Repositories;

/// <summary>
/// Implementación de <see cref="IReservaRepository"/> con EF Core y PostgreSQL.
/// Aquí está la consulta SQL (en LINQ) de RN-01 y las consultas del listado y del dashboard.
/// </summary>
public class ReservaRepository : IReservaRepository
{
    private readonly ReservaUplaDbContext _db;

    public ReservaRepository(ReservaUplaDbContext db)
    {
        _db = db;
    }

    /// <summary>RF-06: busca una reserva con su usuario y ambiente. Queda "rastreada" para poder modificarla.</summary>
    public Task<Reserva?> ObtenerPorIdAsync(Guid id) =>
        _db.Reservas
            .Include(r => r.Usuario)
            .Include(r => r.Ambiente)
            .FirstOrDefaultAsync(r => r.Id == id);

    /// <summary>RF-05: lista reservas aplicando solo los filtros que vengan con valor.</summary>
    public async Task<IReadOnlyList<Reserva>> ListarAsync(EstadoReserva? estado, Guid? ambienteId, DateOnly? fecha)
    {
        IQueryable<Reserva> consulta = _db.Reservas
            .AsNoTracking()
            .Include(r => r.Usuario)
            .Include(r => r.Ambiente);

        if (estado.HasValue)
        {
            var e = estado.Value;
            consulta = consulta.Where(r => r.Estado == e);
        }
        if (ambienteId.HasValue)
        {
            var a = ambienteId.Value;
            consulta = consulta.Where(r => r.AmbienteId == a);
        }
        if (fecha.HasValue)
        {
            var f = fecha.Value;
            consulta = consulta.Where(r => r.Fecha == f);
        }

        return await consulta
            .OrderByDescending(r => r.Fecha)
            .ThenBy(r => r.HoraInicio)
            .ToListAsync();
    }

    /// <summary>
    /// RN-01 / RF-04: ¿hay otra reserva Aprobada, del mismo ambiente y fecha, que se cruce?
    /// Fórmula: inicioNueva &lt; finExistente &amp;&amp; finNueva &gt; inicioExistente.
    /// </summary>
    public Task<bool> ExisteSolapamientoAprobadoAsync(
        Guid ambienteId, DateOnly fecha, TimeOnly inicio, TimeOnly fin, Guid? excluirReservaId)
    {
        return _db.Reservas.AnyAsync(r =>
            r.AmbienteId == ambienteId
            && r.Fecha == fecha
            && r.Estado == EstadoReserva.Aprobada                       // RN-01: solo cuentan las Aprobadas
            && inicio < r.HoraFin && fin > r.HoraInicio                 // RN-01: fórmula de solapamiento
            && (excluirReservaId == null || r.Id != excluirReservaId)); // no compararse consigo misma
    }

    /// <summary>RF-08: cuenta reservas (todas si estado es null).</summary>
    public Task<int> ContarAsync(EstadoReserva? estado)
    {
        if (!estado.HasValue) return _db.Reservas.CountAsync();

        var e = estado.Value;
        return _db.Reservas.CountAsync(r => r.Estado == e);
    }

    /// <summary>RF-08: ambiente con más reservas Aprobadas. En empate gana el de Id menor (resultado estable).</summary>
    public async Task<AmbienteUsoDto?> AmbienteMasUtilizadoAsync()
    {
        var mejor = await _db.Reservas
            .Where(r => r.Estado == EstadoReserva.Aprobada)
            .GroupBy(r => r.AmbienteId)
            .Select(g => new { AmbienteId = g.Key, Total = g.Count() })
            .OrderByDescending(x => x.Total)
            .ThenBy(x => x.AmbienteId)
            .FirstOrDefaultAsync();

        if (mejor is null) return null;

        var nombre = await _db.Ambientes
            .Where(a => a.Id == mejor.AmbienteId)
            .Select(a => a.Nombre)
            .FirstAsync();

        return new AmbienteUsoDto(mejor.AmbienteId, nombre, mejor.Total);
    }

    /// <summary>RF-03: guarda una reserva nueva.</summary>
    public async Task AgregarAsync(Reserva reserva)
    {
        _db.Reservas.Add(reserva);
        await _db.SaveChangesAsync();
    }

    /// <summary>
    /// Guarda los cambios (ej. el nuevo estado). La reserva ya está rastreada porque se leyó con
    /// ObtenerPorIdAsync, así que EF detecta solo qué cambió y basta con SaveChanges.
    /// </summary>
    public Task ActualizarAsync(Reserva reserva) => _db.SaveChangesAsync();
}

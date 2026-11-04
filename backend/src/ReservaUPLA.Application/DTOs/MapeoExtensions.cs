using System.Globalization;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.DTOs;

/// <summary>
/// Convierte entidades en DTOs. Está separado para que los servicios no repitan este código
/// y para que la entidad nunca salga directamente por la API.
/// </summary>
public static class MapeoExtensions
{
    /// <summary>Usuario -> UsuarioDto.</summary>
    public static UsuarioDto ToDto(this Usuario u) =>
        new(u.Id, u.NombreCompleto, u.Correo, u.Rol.ToString(), u.Activo);

    /// <summary>Ambiente -> AmbienteDto.</summary>
    public static AmbienteDto ToDto(this Ambiente a) =>
        new(a.Id, a.Nombre, a.Tipo, a.Capacidad, a.Ubicacion, a.Estado.ToString());

    /// <summary>
    /// Reserva -> ReservaDto. Los nombres vienen de las navegaciones cargadas con Include;
    /// al crear una reserva nueva se pasan a mano porque todavía no hay navegaciones cargadas.
    /// </summary>
    public static ReservaDto ToDto(this Reserva r, string? usuarioNombre = null, string? ambienteNombre = null) =>
        new(
            r.Id,
            r.Fecha.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            r.HoraInicio.ToString("HH:mm", CultureInfo.InvariantCulture),
            r.HoraFin.ToString("HH:mm", CultureInfo.InvariantCulture),
            r.Motivo,
            r.Estado.ToString(),
            r.UsuarioId,
            usuarioNombre ?? r.Usuario?.NombreCompleto ?? string.Empty,
            r.AmbienteId,
            ambienteNombre ?? r.Ambiente?.Nombre ?? string.Empty);
}

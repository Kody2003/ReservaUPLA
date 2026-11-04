namespace ReservaUPLA.Application.DTOs;

/// <summary>
/// Datos para registrar una reserva (RF-03). Fecha como "AAAA-MM-DD" y horas como "HH:mm".
/// Los ids llegan como texto para poder avisar con claridad si falta alguno (RN-02).
/// </summary>
public record ReservaCrearDto(string? UsuarioId, string? AmbienteId, string? Fecha, string? HoraInicio, string? HoraFin, string? Motivo);

/// <summary>Reserva lista para mostrarse (RF-05 y RF-06): incluye los nombres del usuario y del ambiente.</summary>
public record ReservaDto(
    Guid Id,
    string Fecha,
    string HoraInicio,
    string HoraFin,
    string Motivo,
    string Estado,
    Guid UsuarioId,
    string UsuarioNombre,
    Guid AmbienteId,
    string AmbienteNombre);

/// <summary>Pedido de cambio de estado (RF-07). NuevoEstado: Aprobada, Rechazada o Cancelada.</summary>
public record CambioEstadoDto(string? NuevoEstado);

/// <summary>Respuesta de la validación de disponibilidad (RF-04).</summary>
/// <param name="Disponible">true si se puede reservar en ese horario.</param>
/// <param name="Mensaje">Explicación en español para mostrar junto al formulario.</param>
/// <param name="Codigo">Regla que impide la reserva (ej. RN-01). Vacío si está disponible.</param>
public record DisponibilidadDto(bool Disponible, string Mensaje, string Codigo);

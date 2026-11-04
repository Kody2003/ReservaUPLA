namespace ReservaUPLA.Application.DTOs;

/// <summary>Datos para registrar un ambiente (RF-02). Campos opcionales para validar RN-02 en el servicio.</summary>
public record AmbienteCrearDto(string? Nombre, string? Tipo, int? Capacidad, string? Ubicacion, string? Estado);

/// <summary>Datos de un ambiente que la API devuelve al frontend.</summary>
public record AmbienteDto(Guid Id, string Nombre, string Tipo, int Capacidad, string Ubicacion, string Estado);

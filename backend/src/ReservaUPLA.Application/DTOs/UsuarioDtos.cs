namespace ReservaUPLA.Application.DTOs;

/// <summary>
/// Datos que envía el frontend para registrar un usuario (RF-01).
/// Los campos son "string?" a propósito: así el servicio valida RN-02 y devuelve mensajes en español.
/// Contrasena es obligatoria y se hashea antes de persistir (nunca viaja en texto plano a la BD).
/// // LOGIN // RF-01
/// </summary>
public record UsuarioCrearDto(
    string? NombreCompleto,
    string? Correo,
    string? Rol,
    bool? Activo,
    string? Contrasena = null);

/// <summary>Datos de un usuario que la API devuelve al frontend. No expone la entidad directamente.</summary>
public record UsuarioDto(Guid Id, string NombreCompleto, string Correo, string Rol, bool Activo);

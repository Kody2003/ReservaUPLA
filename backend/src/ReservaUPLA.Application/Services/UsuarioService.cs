using System.Net.Mail;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Common;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Services;

/// <summary>
/// Casos de uso de usuarios (RF-01). Valida los datos, aplica RN-02 y guarda usando el repositorio.
/// No sabe nada de HTTP ni de PostgreSQL: por eso se puede probar con repositorios falsos (Moq).
/// </summary>
public class UsuarioService : IUsuarioService
{
    private readonly IUsuarioRepository _usuarios;

    public UsuarioService(IUsuarioRepository usuarios)
    {
        _usuarios = usuarios;
    }

    /// <summary>RF-01: registra un usuario nuevo.</summary>
    public async Task<Result<UsuarioDto>> CrearAsync(UsuarioCrearDto dto)
    {
        // RN-02: todos los campos son obligatorios
        if (string.IsNullOrWhiteSpace(dto.NombreCompleto))
            return Result<UsuarioDto>.Falla(TipoError.Validacion, "El nombre completo es obligatorio.", CodigoRegla.RN02);
        if (string.IsNullOrWhiteSpace(dto.Correo))
            return Result<UsuarioDto>.Falla(TipoError.Validacion, "El correo es obligatorio.", CodigoRegla.RN02);
        if (!Conversiones.TryParseEnum<RolUsuario>(dto.Rol, out var rol))
            return Result<UsuarioDto>.Falla(TipoError.Validacion,
                "El rol es obligatorio y debe ser Solicitante, Administrador o ResponsableAmbiente.", CodigoRegla.RN02);

        var nombre = dto.NombreCompleto.Trim();
        var correo = dto.Correo.Trim().ToLowerInvariant();

        // Tamaños que caben en la base de datos (evita un error 500 por texto demasiado largo)
        if (Conversiones.Excede(nombre, 150))
            return Result<UsuarioDto>.Falla(TipoError.Validacion, "El nombre completo no puede superar 150 caracteres.");
        if (Conversiones.Excede(correo, 150))
            return Result<UsuarioDto>.Falla(TipoError.Validacion, "El correo no puede superar 150 caracteres.");

        if (!CorreoValido(correo))
            return Result<UsuarioDto>.Falla(TipoError.Validacion, "El correo no es válido. Ejemplo: nombre@upla.edu.pe");

        // [SUPUESTO] Dos usuarios no pueden compartir correo
        if (await _usuarios.ExisteCorreoAsync(correo))
            return Result<UsuarioDto>.Falla(TipoError.Conflicto, "Ya existe un usuario registrado con ese correo.");

        var usuario = Usuario.Crear(nombre, correo, rol, dto.Activo ?? true);
        await _usuarios.AgregarAsync(usuario);
        return Result<UsuarioDto>.Ok(usuario.ToDto());
    }

    /// <summary>Lista todos los usuarios (se usa para llenar la lista de la pantalla y el selector de reservas).</summary>
    public async Task<Result<IReadOnlyList<UsuarioDto>>> ListarAsync()
    {
        var lista = await _usuarios.ListarAsync();
        return Result<IReadOnlyList<UsuarioDto>>.Ok(lista.Select(u => u.ToDto()).ToList());
    }

    /// <summary>Comprueba que el texto tenga forma de correo (algo@dominio.ext).</summary>
    private static bool CorreoValido(string correo)
    {
        return MailAddress.TryCreate(correo, out var direccion)
               && direccion.Address == correo
               && correo.Contains('.', StringComparison.Ordinal);
    }
}

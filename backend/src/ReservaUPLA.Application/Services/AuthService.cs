using System.Net.Mail;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Common;

namespace ReservaUPLA.Application.Services;

/// <summary>
/// Implementación de la lógica de autenticación y seguridad de credenciales.
/// // LOGIN
/// </summary>
public class AuthService : IAuthService
{
    private readonly IUsuarioRepository _usuarios;
    private readonly IPasswordHasher _hasher;
    private readonly ITokenService _tokenService;

    public AuthService(
        IUsuarioRepository usuarios,
        IPasswordHasher hasher,
        ITokenService tokenService)
    {
        _usuarios = usuarios;
        _hasher = hasher;
        _tokenService = tokenService;
    }

    /// <summary>
    /// Valida credenciales, comprueba estado activo y devuelve el token de sesión.
    /// // LOGIN // RN-02
    /// </summary>
    public async Task<Result<LoginRespuestaDto>> IniciarSesionAsync(string? correo, string? contrasena)
    {
        // RN-02: campos obligatorios
        if (string.IsNullOrWhiteSpace(correo))
            return Result<LoginRespuestaDto>.Falla(TipoError.Validacion, "El correo es obligatorio.", CodigoRegla.RN02);

        if (string.IsNullOrWhiteSpace(contrasena))
            return Result<LoginRespuestaDto>.Falla(TipoError.Validacion, "La contraseña es obligatoria.", CodigoRegla.RN02);

        var correoNormalizado = correo.Trim().ToLowerInvariant();

        if (!CorreoValido(correoNormalizado))
            return Result<LoginRespuestaDto>.Falla(TipoError.Validacion, "El formato del correo no es válido.");

        var usuario = await _usuarios.ObtenerPorCorreoAsync(correoNormalizado);

        // Fallo genérico: no revela si el correo existe o no para evitar enumeración de usuarios
        if (usuario == null)
            return Result<LoginRespuestaDto>.Falla(TipoError.Validacion, "Correo o contraseña incorrectos.");

        // Un usuario sin hash no puede iniciar sesión
        if (string.IsNullOrWhiteSpace(usuario.PasswordHash) || !_hasher.Verificar(contrasena, usuario.PasswordHash))
            return Result<LoginRespuestaDto>.Falla(TipoError.Validacion, "Correo o contraseña incorrectos.");

        // Mensaje específico si la cuenta está inactiva
        if (!usuario.Activo)
            return Result<LoginRespuestaDto>.Falla(TipoError.Prohibido, "Tu cuenta está desactivada. Comunícate con el administrador.");

        var (token, expira) = _tokenService.Generar(usuario);

        var respuesta = new LoginRespuestaDto(
            token,
            expira,
            usuario.Id,
            usuario.NombreCompleto,
            usuario.Correo,
            usuario.Rol.ToString());

        return Result<LoginRespuestaDto>.Ok(respuesta);
    }

    /// <summary>
    /// Cambia la contraseña verificando la actual y aplicando las reglas de seguridad a la nueva.
    /// // LOGIN
    /// </summary>
    public async Task<Result<bool>> CambiarContrasenaAsync(Guid usuarioId, string? actual, string? nueva)
    {
        if (string.IsNullOrWhiteSpace(actual))
            return Result<bool>.Falla(TipoError.Validacion, "La contraseña actual es obligatoria.", CodigoRegla.RN02);

        if (string.IsNullOrWhiteSpace(nueva))
            return Result<bool>.Falla(TipoError.Validacion, "La nueva contraseña es obligatoria.", CodigoRegla.RN02);

        var usuario = await _usuarios.ObtenerPorIdAsync(usuarioId);
        if (usuario == null)
            return Result<bool>.Falla(TipoError.NoEncontrado, "Usuario no encontrado.");

        if (string.IsNullOrWhiteSpace(usuario.PasswordHash) || !_hasher.Verificar(actual, usuario.PasswordHash))
            return Result<bool>.Falla(TipoError.Validacion, "La contraseña actual no es correcta.");

        if (actual == nueva)
            return Result<bool>.Falla(TipoError.Validacion, "La nueva contraseña debe ser distinta de la actual.");

        // Reglas de contraseña: mínimo 8 caracteres, al menos una letra y un número
        if (nueva.Length < 8 || !nueva.Any(char.IsLetter) || !nueva.Any(char.IsDigit))
            return Result<bool>.Falla(TipoError.Validacion, "La contraseña debe tener al menos 8 caracteres, una letra y un número.");

        var nuevoHash = _hasher.Hashear(nueva);
        usuario.ActualizarPasswordHash(nuevoHash);
        await _usuarios.ActualizarAsync(usuario);

        return Result<bool>.Ok(true);
    }

    /// <summary>
    /// Inicia sesión con usuarios precargados según el rol solicitado (solo para desarrollo).
    /// // LOGIN // DEMO
    /// </summary>
    public async Task<Result<LoginRespuestaDto>> IniciarSesionDemoAsync(string? rol)
    {
        if (string.IsNullOrWhiteSpace(rol))
            return Result<LoginRespuestaDto>.Falla(TipoError.Validacion, "Debe especificar un rol de demostración.");

        var correoDemo = rol.Trim().ToLowerInvariant() switch
        {
            "administrador" => "marta.quispe@ejemplo.edu.pe",
            "solicitante" => "ana.torres@ejemplo.edu.pe",
            "responsableambiente" => "carlos.huaman@ejemplo.edu.pe",
            "inactivo" => "pedro.salas@ejemplo.edu.pe",
            _ => null
        };

        if (correoDemo == null)
            return Result<LoginRespuestaDto>.Falla(TipoError.Validacion, "Rol de demostración no reconocido.");

        var usuario = await _usuarios.ObtenerPorCorreoAsync(correoDemo);
        if (usuario == null)
            return Result<LoginRespuestaDto>.Falla(TipoError.NoEncontrado, "El usuario de prueba no está registrado en la base de datos.");

        // Aplica la misma comprobación de cuenta inactiva que el login normal
        if (!usuario.Activo)
            return Result<LoginRespuestaDto>.Falla(TipoError.Prohibido, "Tu cuenta está desactivada. Comunícate con el administrador.");

        var (token, expira) = _tokenService.Generar(usuario);

        var respuesta = new LoginRespuestaDto(
            token,
            expira,
            usuario.Id,
            usuario.NombreCompleto,
            usuario.Correo,
            usuario.Rol.ToString());

        return Result<LoginRespuestaDto>.Ok(respuesta);
    }

    private static bool CorreoValido(string correo)
    {
        return MailAddress.TryCreate(correo, out var direccion)
               && direccion.Address == correo
               && correo.Contains('.', StringComparison.Ordinal);
    }
}

using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Interfaces;

/// <summary>
/// Contrato para la generación de tokens de acceso (JWT).
/// Permite autenticar peticiones subsecuentes sin almacenar estado en el servidor (stateless).
/// // LOGIN
/// </summary>
public interface ITokenService
{
    /// <summary>Genera el token JWT firmado con los claims del usuario y calcula su fecha de expiración UTC.</summary>
    (string Token, DateTime ExpiracionUtc) Generar(Usuario usuario);
}

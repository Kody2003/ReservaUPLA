using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Infrastructure.Security;

/// <summary>
/// Emite tokens JWT firmados con HMAC-SHA256 (HS256).
/// Lee los parámetros de configuración Jwt:* y añade los claims esenciales del usuario.
/// // LOGIN
/// </summary>
public class TokenService : ITokenService
{
    private readonly IConfiguration _configuracion;

    public TokenService(IConfiguration configuracion)
    {
        _configuracion = configuracion;
    }

    /// <summary>Genera el token JWT y su tiempo de vida a partir de los datos del usuario.</summary>
    public (string Token, DateTime ExpiracionUtc) Generar(Usuario usuario)
    {
        var clave = _configuracion["Jwt:Key"]
            ?? throw new InvalidOperationException("Falta configurar 'Jwt:Key' en la aplicación.");

        if (clave.Length < 32)
            throw new InvalidOperationException("La clave 'Jwt:Key' debe tener al menos 32 caracteres.");

        var emisor = _configuracion["Jwt:Issuer"] ?? "ReservaUPLA";
        var audiencia = _configuracion["Jwt:Audience"] ?? "ReservaUPLAFrontend";
        var minutos = int.TryParse(_configuracion["Jwt:MinutosExpira"], out var m) && m > 0 ? m : 60;

        var expira = DateTime.UtcNow.AddMinutes(minutos);
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(clave));
        var credenciales = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Name, usuario.NombreCompleto),
            new Claim(ClaimTypes.Name, usuario.NombreCompleto),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Correo),
            new Claim(ClaimTypes.Email, usuario.Correo),
            new Claim("role", usuario.Rol.ToString()),
            new Claim(ClaimTypes.Role, usuario.Rol.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expira,
            Issuer = emisor,
            Audience = audiencia,
            SigningCredentials = credenciales
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(tokenDescriptor);

        return (handler.WriteToken(token), expira);
    }
}

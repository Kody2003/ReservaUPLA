using System.Security.Cryptography;
using System.Text;
using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.Infrastructure.Security;

/// <summary>
/// Implementación de <see cref="IPasswordHasher"/> usando PBKDF2 (Rfc2898DeriveBytes).
/// Genera una sal criptográfica aleatoria de 16 bytes y aplica 100,000 iteraciones con SHA-256.
/// El resultado se almacena en formato: "{iteraciones}.{salBase64}.{hashBase64}".
/// La verificación se realiza en tiempo constante para mitigar ataques de temporización (timing attacks).
/// // LOGIN
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    private const int TamanoSal = 16;
    private const int TamanoHash = 32;
    private const int IteracionesPorDefecto = 100_000;

    /// <summary>Genera un hash seguro para la contraseña indicada.</summary>
    public string Hashear(string contrasena)
    {
        if (string.IsNullOrWhiteSpace(contrasena))
            throw new ArgumentException("La contraseña no puede estar vacía.", nameof(contrasena));

        byte[] sal = RandomNumberGenerator.GetBytes(TamanoSal);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(contrasena),
            sal,
            IteracionesPorDefecto,
            HashAlgorithmName.SHA256,
            TamanoHash);

        return $"{IteracionesPorDefecto}.{Convert.ToBase64String(sal)}.{Convert.ToBase64String(hash)}";
    }

    /// <summary>Verifica si la contraseña en texto plano coincide con el hash guardado.</summary>
    public bool Verificar(string contrasena, string hashAlmacenado)
    {
        if (string.IsNullOrWhiteSpace(contrasena) || string.IsNullOrWhiteSpace(hashAlmacenado))
            return false;

        var partes = hashAlmacenado.Split('.');
        if (partes.Length != 3)
            return false;

        if (!int.TryParse(partes[0], out var iteraciones) || iteraciones <= 0)
            return false;

        try
        {
            byte[] sal = Convert.FromBase64String(partes[1]);
            byte[] hashEsperado = Convert.FromBase64String(partes[2]);

            byte[] hashActual = Rfc2898DeriveBytes.Pbkdf2(
                Encoding.UTF8.GetBytes(contrasena),
                sal,
                iteraciones,
                HashAlgorithmName.SHA256,
                hashEsperado.Length);

            return CryptographicOperations.FixedTimeEquals(hashEsperado, hashActual);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}

using System.Security.Cryptography;
using System.Text;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.API.Seguridad;

/// <summary>
/// Autenticación MÍNIMA para cumplir RN-05 (opción más simple): una clave de administrador.
/// - La clave real se guarda en user-secrets (Admin:ApiKey), nunca en el repositorio.
/// - El frontend la manda en la cabecera "X-Admin-Key".
/// - Si coincide con la configurada -> Administrador; si no, se trata como Solicitante.
/// No es un login completo (no hay usuarios ni contraseñas); basta para esta actividad.
/// </summary>
public class RolActualProvider : IRolActualProvider
{
    public const string Cabecera = "X-Admin-Key";

    private readonly IHttpContextAccessor _http;
    private readonly IConfiguration _configuracion;

    public RolActualProvider(IHttpContextAccessor http, IConfiguration configuracion)
    {
        _http = http;
        _configuracion = configuracion;
    }

    /// <summary>RN-05: decide si quien llama es Administrador comparando la clave enviada con la configurada.</summary>
    public RolUsuario ObtenerRolActual()
    {
        var claveConfigurada = _configuracion["Admin:ApiKey"];
        if (string.IsNullOrWhiteSpace(claveConfigurada))
            return RolUsuario.Solicitante;   // sin clave configurada nadie es Administrador (más seguro)

        var claveEnviada = _http.HttpContext?.Request.Headers[Cabecera].ToString();
        if (string.IsNullOrEmpty(claveEnviada))
            return RolUsuario.Solicitante;

        // Comparación de tiempo constante: evita adivinar la clave midiendo tiempos de respuesta
        var esperada = Encoding.UTF8.GetBytes(claveConfigurada);
        var recibida = Encoding.UTF8.GetBytes(claveEnviada);
        return CryptographicOperations.FixedTimeEquals(esperada, recibida)
            ? RolUsuario.Administrador
            : RolUsuario.Solicitante;
    }
}

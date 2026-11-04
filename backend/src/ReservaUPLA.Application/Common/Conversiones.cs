using System.Globalization;

namespace ReservaUPLA.Application.Common;

/// <summary>
/// Funciones pequeñas para convertir los textos que llegan del frontend (fecha, hora, enums)
/// a tipos de .NET. Se reciben como texto a propósito: así, si algo viene mal, respondemos
/// con un mensaje claro en español en vez de un error genérico de la API.
/// </summary>
public static class Conversiones
{
    /// <summary>Convierte "2026-11-05" a DateOnly. Formato fijo AAAA-MM-DD.</summary>
    public static bool TryParseFecha(string? texto, out DateOnly fecha)
    {
        return DateOnly.TryParseExact(texto, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out fecha);
    }

    /// <summary>Convierte "08:30" (o "08:30:00") a TimeOnly.</summary>
    public static bool TryParseHora(string? texto, out TimeOnly hora)
    {
        return TimeOnly.TryParseExact(texto, new[] { "HH:mm", "HH:mm:ss" }, CultureInfo.InvariantCulture, DateTimeStyles.None, out hora);
    }

    /// <summary>
    /// Convierte un texto a enum sin distinguir mayúsculas. Rechaza números ("1") y valores
    /// que no existan, para que solo se acepten los nombres reales del enum.
    /// </summary>
    public static bool TryParseEnum<TEnum>(string? texto, out TEnum valor) where TEnum : struct, Enum
    {
        valor = default;
        if (string.IsNullOrWhiteSpace(texto)) return false;

        var limpio = texto.Trim();
        if (char.IsDigit(limpio[0])) return false;

        return Enum.TryParse(limpio, ignoreCase: true, out valor) && Enum.IsDefined(valor);
    }

    /// <summary>Indica si un texto pasa de la longitud máxima que cabe en la base de datos.</summary>
    public static bool Excede(string texto, int maximo) => texto.Trim().Length > maximo;
}

namespace ReservaUPLA.Application.Common;

/// <summary>
/// Tipo de error de negocio. El controlador lo traduce a un código HTTP:
/// Validacion -> 400, NoEncontrado -> 404, Prohibido -> 403, Conflicto -> 409.
/// </summary>
public enum TipoError
{
    Validacion,
    NoEncontrado,
    Conflicto,
    Prohibido
}

/// <summary>
/// Resultado de una operación de los servicios: o trae un valor (éxito) o trae un error.
/// Existe para NO usar excepciones en errores de negocio (ej. "horario cruzado"):
/// una excepción es para lo inesperado; un error de negocio es parte normal del flujo.
/// </summary>
public sealed class Result<T>
{
    public bool Exito { get; }
    public T? Valor { get; }
    public string Error { get; }
    public TipoError Tipo { get; }
    /// <summary>Código de la regla que falló (ej. "RN-01"). Vacío si no aplica.</summary>
    public string Codigo { get; }

    private Result(bool exito, T? valor, string error, TipoError tipo, string codigo)
    {
        Exito = exito;
        Valor = valor;
        Error = error;
        Tipo = tipo;
        Codigo = codigo;
    }

    /// <summary>Operación exitosa con su valor.</summary>
    public static Result<T> Ok(T valor) => new(true, valor, string.Empty, TipoError.Validacion, string.Empty);

    /// <summary>Operación fallida: tipo de error, mensaje para el usuario y (opcional) código de regla.</summary>
    public static Result<T> Falla(TipoError tipo, string error, string codigo = "") => new(false, default, error, tipo, codigo);
}

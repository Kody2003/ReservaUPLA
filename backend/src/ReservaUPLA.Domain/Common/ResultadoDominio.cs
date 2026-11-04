namespace ReservaUPLA.Domain.Common;

/// <summary>
/// Resultado simple de una operación del dominio: o salió bien, o falló con un código de regla
/// y un mensaje. Existe porque el Domain no puede depender de Application (donde vive Result&lt;T&gt;)
/// y aun así queremos evitar excepciones para errores de negocio.
/// </summary>
public class ResultadoDominio
{
    public bool Exito { get; }
    /// <summary>Código de la regla que falló (ver <see cref="CodigoRegla"/>). Vacío si hubo éxito.</summary>
    public string Codigo { get; }
    /// <summary>Mensaje en español pensado para mostrarse al usuario. Vacío si hubo éxito.</summary>
    public string Error { get; }

    protected ResultadoDominio(bool exito, string codigo, string error)
    {
        Exito = exito;
        Codigo = codigo;
        Error = error;
    }

    /// <summary>Operación exitosa.</summary>
    public static ResultadoDominio Ok() => new(true, string.Empty, string.Empty);

    /// <summary>Operación fallida: indica qué regla se rompió y por qué.</summary>
    public static ResultadoDominio Falla(string codigo, string error) => new(false, codigo, error);
}

/// <summary>
/// Igual que <see cref="ResultadoDominio"/> pero además trae un valor cuando salió bien
/// (por ejemplo, la Reserva recién creada).
/// </summary>
public sealed class ResultadoDominio<T> : ResultadoDominio
{
    public T? Valor { get; }

    private ResultadoDominio(T? valor, bool exito, string codigo, string error)
        : base(exito, codigo, error)
    {
        Valor = valor;
    }

    /// <summary>Operación exitosa con su valor.</summary>
    public static ResultadoDominio<T> Ok(T valor) => new(valor, true, string.Empty, string.Empty);

    /// <summary>Operación fallida (sin valor).</summary>
    public new static ResultadoDominio<T> Falla(string codigo, string error) => new(default, false, codigo, error);
}

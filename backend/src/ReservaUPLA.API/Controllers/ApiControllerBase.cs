using Microsoft.AspNetCore.Mvc;
using ReservaUPLA.Application.Common;

namespace ReservaUPLA.API.Controllers;

/// <summary>
/// Clase base de los controladores. Traduce un Result&lt;T&gt; de Application a una respuesta HTTP,
/// así cada controlador queda "delgado": solo recibe la petición y llama al servicio.
/// Los errores se envían como ProblemDetails (campo "detail" = mensaje en español).
/// </summary>
[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    /// <summary>Éxito -> 200 con el valor. Error -> ProblemDetails con el código que corresponda.</summary>
    protected IActionResult Responder<T>(Result<T> resultado) =>
        resultado.Exito ? Ok(resultado.Valor) : ConvertirError(resultado);

    /// <summary>Éxito -> 201 Created con el valor. Error -> ProblemDetails.</summary>
    protected IActionResult ResponderCreado<T>(Result<T> resultado) =>
        resultado.Exito ? StatusCode(StatusCodes.Status201Created, resultado.Valor) : ConvertirError(resultado);

    /// <summary>Convierte el tipo de error de negocio en código HTTP y arma el ProblemDetails.</summary>
    private ObjectResult ConvertirError<T>(Result<T> resultado)
    {
        var (estado, titulo) = resultado.Tipo switch
        {
            TipoError.NoEncontrado => (StatusCodes.Status404NotFound, "No encontrado"),
            TipoError.Prohibido => (StatusCodes.Status403Forbidden, "Acción no permitida"),
            TipoError.Conflicto => (StatusCodes.Status409Conflict, "Conflicto con las reglas de negocio"),
            _ => (StatusCodes.Status400BadRequest, "Datos no válidos")
        };

        var problema = new ProblemDetails
        {
            Status = estado,
            Title = titulo,
            Detail = resultado.Error,
            Instance = Request.Path
        };
        if (!string.IsNullOrEmpty(resultado.Codigo))
            problema.Extensions["codigo"] = resultado.Codigo;   // ej. "RN-01"

        return new ObjectResult(problema) { StatusCode = estado };
    }
}

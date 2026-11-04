using Microsoft.AspNetCore.Mvc;

namespace ReservaUPLA.API.Middleware;

/// <summary>
/// Red de seguridad global: si algo inesperado revienta (ej. se cae la base de datos),
/// responde un ProblemDetails en español con código 500 en vez de mostrar el error técnico.
/// Los errores de negocio NO pasan por aquí: esos viajan como Result y no lanzan excepciones.
/// </summary>
public class ExcepcionesMiddleware
{
    private readonly RequestDelegate _siguiente;
    private readonly ILogger<ExcepcionesMiddleware> _logger;

    public ExcepcionesMiddleware(RequestDelegate siguiente, ILogger<ExcepcionesMiddleware> logger)
    {
        _siguiente = siguiente;
        _logger = logger;
    }

    /// <summary>Ejecuta el resto del pipeline y atrapa cualquier excepción no controlada.</summary>
    public async Task InvokeAsync(HttpContext contexto)
    {
        try
        {
            await _siguiente(contexto);
        }
        catch (Exception ex)
        {
            // El detalle técnico queda en el log del servidor, no en la respuesta.
            _logger.LogError(ex, "Error no controlado en {Metodo} {Ruta}", contexto.Request.Method, contexto.Request.Path);

            if (contexto.Response.HasStarted) throw;

            var problema = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Error interno del servidor",
                Detail = "Ocurrió un error inesperado. Intenta de nuevo; si el problema continúa, avisa al administrador.",
                Instance = contexto.Request.Path
            };

            contexto.Response.Clear();
            contexto.Response.StatusCode = StatusCodes.Status500InternalServerError;
            contexto.Response.ContentType = "application/problem+json";
            await contexto.Response.WriteAsJsonAsync(problema);
        }
    }
}

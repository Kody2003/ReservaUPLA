using Microsoft.OpenApi.Models;
using ReservaUPLA.API.Middleware;
using ReservaUPLA.API.Seguridad;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Application.Services;
using ReservaUPLA.Infrastructure;

// Punto de arranque de la API: aquí se "arma" la aplicación (servicios) y se define el pipeline.
var builder = WebApplication.CreateBuilder(args);

// La cadena de conexión NUNCA va en el repositorio: viene de user-secrets (desarrollo)
// o de una variable de entorno (ConnectionStrings__Default) en otros entornos.
var cadenaConexion = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException(
        "Falta la cadena de conexión 'ConnectionStrings:Default'. " +
        "Guárdala con 'dotnet user-secrets set' (mira el README).");

builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();

// Swagger: documentación interactiva en /swagger. Incluye un botón para enviar X-Admin-Key (RN-05).
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opciones =>
{
    opciones.SwaggerDoc("v1", new OpenApiInfo { Title = "ReservaUPLA API", Version = "v1" });
    opciones.AddSecurityDefinition("AdminKey", new OpenApiSecurityScheme
    {
        Name = RolActualProvider.Cabecera,
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Description = "Clave de administrador (Admin:ApiKey). Sin ella, aprobar o rechazar devuelve 403 (RN-05)."
    });
    opciones.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "AdminKey" } },
            Array.Empty<string>()
        }
    });
});

// CORS: permite que el frontend (Vite, puerto 5173) llame a esta API desde el navegador.
var origenesPermitidos = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
                         ?? new[] { "http://localhost:5173" };
builder.Services.AddCors(opciones =>
    opciones.AddPolicy("Frontend", politica =>
        politica.WithOrigins(origenesPermitidos).AllowAnyHeader().AllowAnyMethod()));

// Infrastructure: DbContext (PostgreSQL) + repositorios
builder.Services.AddInfrastructure(cadenaConexion);

// Application: servicios (casos de uso)
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<IAmbienteService, AmbienteService>();
builder.Services.AddScoped<IReservaService, ReservaService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

// Seguridad mínima (RN-05)
builder.Services.AddScoped<IRolActualProvider, RolActualProvider>();

var app = builder.Build();

// El middleware de excepciones va primero para atrapar errores de todo lo que viene después.
app.UseMiddleware<ExcepcionesMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.MapControllers();

app.Run();

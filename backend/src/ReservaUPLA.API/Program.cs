using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ReservaUPLA.API.Middleware;
using ReservaUPLA.API.Seguridad;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Application.Services;
using ReservaUPLA.Infrastructure;
using ReservaUPLA.Infrastructure.Persistence;

// Punto de arranque de la API: configuración de servicios, autenticación JWT y pipeline de peticiones.
// // LOGIN // RN-05
var builder = WebApplication.CreateBuilder(args);

// Cadena de conexión a PostgreSQL
var cadenaConexion = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException(
        "Falta la cadena de conexión 'ConnectionStrings:Default'. " +
        "Guárdala con 'dotnet user-secrets set' (mira el README).");

// Clave secreta para la firma y verificación de tokens JWT
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
{
    throw new InvalidOperationException(
        "Falta la clave JWT 'Jwt:Key' o mide menos de 32 caracteres. " +
        "Configúrala con 'dotnet user-secrets set \"Jwt:Key\" \"<CLAVE_DE_32_O_MAS_CARACTERES>\" --project src/ReservaUPLA.API'.");
}

builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();

// Autenticación con JWT Bearer // LOGIN
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ReservaUPLA";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ReservaUPLAFrontend";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opciones =>
    {
        opciones.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        // Respuestas en español con formato ProblemDetails para 401 y 403
        opciones.Events = new JwtBearerEvents
        {
            OnChallenge = async contexto =>
            {
                contexto.HandleResponse();
                contexto.Response.StatusCode = StatusCodes.Status401Unauthorized;
                contexto.Response.ContentType = "application/problem+json";
                var problema = new ProblemDetails
                {
                    Status = StatusCodes.Status401Unauthorized,
                    Title = "No autenticado",
                    Detail = "Debes iniciar sesión para acceder a este recurso.",
                    Instance = contexto.Request.Path
                };
                await contexto.Response.WriteAsJsonAsync(problema);
            },
            OnForbidden = async contexto =>
            {
                contexto.Response.StatusCode = StatusCodes.Status403Forbidden;
                contexto.Response.ContentType = "application/problem+json";
                var problema = new ProblemDetails
                {
                    Status = StatusCodes.Status403Forbidden,
                    Title = "Acción no permitida",
                    Detail = "No tienes permisos suficientes para realizar esta acción.",
                    Instance = contexto.Request.Path
                };
                await contexto.Response.WriteAsJsonAsync(problema);
            }
        };
    });

builder.Services.AddAuthorization();

// Documentación interactiva Swagger con soporte para Bearer Token
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opciones =>
{
    opciones.SwaggerDoc("v1", new OpenApiInfo { Title = "ReservaUPLA API", Version = "v1" });
    opciones.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        Description = "Ingresa tu token JWT obtenido en /api/auth/login. Formato: Bearer {token}"
    });
    opciones.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// CORS: permite llamadas desde el frontend de Vite
var origenesPermitidos = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
                         ?? new[] { "http://localhost:5173" };
builder.Services.AddCors(opciones =>
    opciones.AddPolicy("Frontend", politica =>
        politica.WithOrigins(origenesPermitidos).AllowAnyHeader().AllowAnyMethod()));

// Infrastructure: DbContext (PostgreSQL) + repositorios + seguridad
builder.Services.AddInfrastructure(cadenaConexion);

// Application: servicios de casos de uso
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<IAmbienteService, AmbienteService>();
builder.Services.AddScoped<IReservaService, ReservaService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Proveedor de identidad y rol del token
builder.Services.AddScoped<IRolActualProvider, RolActualProvider>();

var app = builder.Build();

// Middleware de excepciones no controladas
app.UseMiddleware<ExcepcionesMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    // Seeder en desarrollo: actualiza hashes demo a usuarios existentes
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ReservaUplaDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    var passDemo = builder.Configuration["Seed:PasswordDemo"];
    await DesarrolloSeeder.InicializarAsync(db, hasher, passDemo);
}

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

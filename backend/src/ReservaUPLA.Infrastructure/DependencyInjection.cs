using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Infrastructure.Persistence;
using ReservaUPLA.Infrastructure.Repositories;
using ReservaUPLA.Infrastructure.Security;

namespace ReservaUPLA.Infrastructure;

/// <summary>
/// Registra en el contenedor de dependencias todo lo de Infrastructure (DbContext, repositorios y seguridad).
/// Así Program.cs solo escribe una línea y no necesita conocer las clases concretas.
/// // LOGIN
/// </summary>
public static class DependencyInjection
{
    /// <summary>Agrega DbContext (PostgreSQL con Npgsql), los tres repositorios y los servicios de seguridad.</summary>
    /// <param name="cadenaConexion">Viene de user-secrets o variables de entorno, nunca del repositorio.</param>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string cadenaConexion)
    {
        services.AddDbContext<ReservaUplaDbContext>(opciones => opciones.UseNpgsql(cadenaConexion));

        // Scoped = una instancia por petición HTTP (lo normal con DbContext)
        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IAmbienteRepository, AmbienteRepository>();
        services.AddScoped<IReservaRepository, ReservaRepository>();

        // Seguridad: hashing y emisión de JWT // LOGIN
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ITokenService, TokenService>();

        return services;
    }
}

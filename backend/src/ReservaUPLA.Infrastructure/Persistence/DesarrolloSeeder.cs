using Microsoft.EntityFrameworkCore;
using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.Infrastructure.Persistence;

/// <summary>
/// Sembrador de datos para entorno de desarrollo.
/// Si un usuario demo no tiene hash de contraseña (ej. recién creado por script de BD o migración),
/// se le asigna el hash generado a partir de 'Seed:PasswordDemo' (de user-secrets).
/// // LOGIN // DEMO
/// </summary>
public static class DesarrolloSeeder
{
    private static readonly string[] CorreosDemo =
    {
        "marta.quispe@ejemplo.edu.pe",
        "ana.torres@ejemplo.edu.pe",
        "luis.rojas@ejemplo.edu.pe",
        "carlos.huaman@ejemplo.edu.pe",
        "pedro.salas@ejemplo.edu.pe"
    };

    /// <summary>Asigna el hash demo a los usuarios semilla que aún no tengan uno.</summary>
    public static async Task InicializarAsync(ReservaUplaDbContext db, IPasswordHasher hasher, string? passwordDemo)
    {
        if (string.IsNullOrWhiteSpace(passwordDemo))
            return;

        try
        {
            var usuarios = await db.Usuarios
                .Where(u => CorreosDemo.Contains(u.Correo) && string.IsNullOrEmpty(u.PasswordHash))
                .ToListAsync();

            if (usuarios.Count == 0)
                return;

            var nuevoHash = hasher.Hashear(passwordDemo);
            foreach (var usuario in usuarios)
            {
                usuario.ActualizarPasswordHash(nuevoHash);
            }

            await db.SaveChangesAsync();
        }
        catch
        {
            // Si la base de datos o columna aún no ha aplicado la migración, se silencia para permitir
            // que los comandos de migraciones o inicialización de herramientas no se interrumpan.
        }
    }
}

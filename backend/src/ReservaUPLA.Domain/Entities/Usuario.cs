using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Domain.Entities;

/// <summary>
/// Persona que usa el sistema (RF-01). Existe para saber QUIÉN solicita cada reserva
/// y quién puede aprobarla. Los setters son privados: los datos solo se asignan al crear
/// la entidad, así nadie la deja en un estado raro desde afuera.
/// </summary>
public class Usuario
{
    public Guid Id { get; private set; }
    public string NombreCompleto { get; private set; } = string.Empty;
    public string Correo { get; private set; } = string.Empty;
    public RolUsuario Rol { get; private set; }
    public bool Activo { get; private set; }

    /// <summary>
    /// Hash seguro de la contraseña (PBKDF2). NUNCA se guarda texto plano.
    /// Si está vacío o null, el usuario no puede iniciar sesión.
    /// // LOGIN
    /// </summary>
    public string? PasswordHash { get; private set; }

    /// <summary>Constructor vacío: solo lo usa EF Core para reconstruir la entidad desde la BD.</summary>
    private Usuario() { }

    /// <summary>RF-01: crea un usuario nuevo con un Id (UUID) generado aquí mismo.</summary>
    public static Usuario Crear(
        string nombreCompleto,
        string correo,
        RolUsuario rol,
        bool activo = true,
        string? passwordHash = null)
    {
        return new Usuario
        {
            Id = Guid.NewGuid(),
            NombreCompleto = nombreCompleto,
            Correo = correo,
            Rol = rol,
            Activo = activo,
            PasswordHash = passwordHash
        };
    }

    /// <summary>
    /// Actualiza el hash de la contraseña tras validaciones del servicio.
    /// // LOGIN
    /// </summary>
    public void ActualizarPasswordHash(string nuevoHash)
    {
        PasswordHash = nuevoHash;
    }
}

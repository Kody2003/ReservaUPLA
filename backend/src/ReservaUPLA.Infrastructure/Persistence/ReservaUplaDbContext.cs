using Microsoft.EntityFrameworkCore;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Infrastructure.Persistence;

/// <summary>
/// Puente entre las entidades de C# y las tablas de PostgreSQL (EF Core).
/// Aquí se usa Fluent API para decir, en código, cómo se llama cada tabla y columna,
/// qué tamaño tienen y qué restricciones llevan. Todo coincide con database/01_init.sql.
/// </summary>
public class ReservaUplaDbContext : DbContext
{
    public ReservaUplaDbContext(DbContextOptions<ReservaUplaDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Ambiente> Ambientes => Set<Ambiente>();
    public DbSet<Reserva> Reservas => Set<Reserva>();

    /// <summary>Configura tablas, columnas, claves, índices y restricciones.</summary>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ---------- usuarios (RF-01) ----------
        modelBuilder.Entity<Usuario>(e =>
        {
            e.ToTable("usuarios", t =>
                t.HasCheckConstraint("ck_usuarios_rol", "rol IN ('Solicitante','Administrador','ResponsableAmbiente')"));

            e.HasKey(u => u.Id);
            e.Property(u => u.Id).HasColumnName("id").ValueGeneratedNever();   // el Id (UUID) lo crea el dominio
            e.Property(u => u.NombreCompleto).HasColumnName("nombre_completo").HasMaxLength(150).IsRequired();
            e.Property(u => u.Correo).HasColumnName("correo").HasMaxLength(150).IsRequired();
            e.Property(u => u.Rol).HasColumnName("rol").HasConversion<string>().HasMaxLength(30).IsRequired();
            e.Property(u => u.Activo).HasColumnName("activo").IsRequired();

            // [SUPUESTO] el correo no se repite
            e.HasIndex(u => u.Correo).IsUnique().HasDatabaseName("ux_usuarios_correo");
        });

        // ---------- ambientes (RF-02) ----------
        modelBuilder.Entity<Ambiente>(e =>
        {
            e.ToTable("ambientes", t =>
            {
                t.HasCheckConstraint("ck_ambientes_capacidad", "capacidad > 0");
                t.HasCheckConstraint("ck_ambientes_estado", "estado IN ('Disponible','Mantenimiento','Inactivo')");
            });

            e.HasKey(a => a.Id);
            e.Property(a => a.Id).HasColumnName("id").ValueGeneratedNever();
            e.Property(a => a.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
            e.Property(a => a.Tipo).HasColumnName("tipo").HasMaxLength(50).IsRequired();
            e.Property(a => a.Capacidad).HasColumnName("capacidad").IsRequired();
            e.Property(a => a.Ubicacion).HasColumnName("ubicacion").HasMaxLength(150).IsRequired();
            e.Property(a => a.Estado).HasColumnName("estado").HasConversion<string>().HasMaxLength(20).IsRequired();
        });

        // ---------- reservas (RF-03) ----------
        modelBuilder.Entity<Reserva>(e =>
        {
            e.ToTable("reservas", t =>
            {
                t.HasCheckConstraint("ck_reservas_hora_fin", "hora_fin > hora_inicio");   // RN-03 también en la BD
                t.HasCheckConstraint("ck_reservas_horario_permitido",
                    "hora_inicio >= TIME '07:00' AND hora_fin <= TIME '22:00'");          // RN-04 también en la BD
                t.HasCheckConstraint("ck_reservas_estado",
                    "estado IN ('Pendiente','Aprobada','Rechazada','Cancelada')");
            });

            e.HasKey(r => r.Id);
            e.Property(r => r.Id).HasColumnName("id").ValueGeneratedNever();
            e.Property(r => r.Fecha).HasColumnName("fecha").HasColumnType("date").IsRequired();
            e.Property(r => r.HoraInicio).HasColumnName("hora_inicio").HasColumnType("time").IsRequired();
            e.Property(r => r.HoraFin).HasColumnName("hora_fin").HasColumnType("time").IsRequired();
            e.Property(r => r.Motivo).HasColumnName("motivo").HasMaxLength(300).IsRequired();
            e.Property(r => r.Estado).HasColumnName("estado").HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(r => r.UsuarioId).HasColumnName("usuario_id").IsRequired();
            e.Property(r => r.AmbienteId).HasColumnName("ambiente_id").IsRequired();

            // Relaciones: una reserva pertenece a un usuario y a un ambiente.
            // Restrict = no se puede borrar un usuario/ambiente que ya tiene reservas.
            e.HasOne(r => r.Usuario).WithMany().HasForeignKey(r => r.UsuarioId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(r => r.Ambiente).WithMany().HasForeignKey(r => r.AmbienteId).OnDelete(DeleteBehavior.Restrict);

            // Índice para acelerar la búsqueda de solapamientos (RN-01) y los filtros del listado
            e.HasIndex(r => new { r.AmbienteId, r.Fecha, r.Estado }).HasDatabaseName("ix_reservas_ambiente_fecha_estado");
        });
    }
}

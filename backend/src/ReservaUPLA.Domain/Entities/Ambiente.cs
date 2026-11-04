using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Domain.Entities;

/// <summary>
/// Espacio físico que se puede reservar: aula, laboratorio, auditorio, etc. (RF-02).
/// </summary>
public class Ambiente
{
    public Guid Id { get; private set; }
    public string Nombre { get; private set; } = string.Empty;
    public string Tipo { get; private set; } = string.Empty;
    public int Capacidad { get; private set; }
    public string Ubicacion { get; private set; } = string.Empty;
    public EstadoAmbiente Estado { get; private set; }

    /// <summary>Constructor vacío: solo lo usa EF Core.</summary>
    private Ambiente() { }

    /// <summary>RF-02: crea un ambiente nuevo. La capacidad (&gt; 0) se valida en el servicio.</summary>
    public static Ambiente Crear(string nombre, string tipo, int capacidad, string ubicacion, EstadoAmbiente estado)
    {
        return new Ambiente
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            Tipo = tipo,
            Capacidad = capacidad,
            Ubicacion = ubicacion,
            Estado = estado
        };
    }
}

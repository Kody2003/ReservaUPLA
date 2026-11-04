using ReservaUPLA.Domain.Common;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Domain.Entities;

/// <summary>
/// Solicitud para usar un Ambiente en una fecha y horario (RF-03).
/// Es la entidad más importante: aquí viven las reglas RN-03, RN-04, RN-05 y RN-06
/// y el ciclo de vida de los estados. Así las reglas no dependen de la base de datos ni de la API.
/// </summary>
public class Reserva
{
    /// <summary>RN-04: hora más temprana permitida.</summary>
    public static readonly TimeOnly HoraMinima = new(7, 0);
    /// <summary>RN-04: hora más tarde permitida (para la hora de fin).</summary>
    public static readonly TimeOnly HoraMaxima = new(22, 0);

    /// <summary>Mensaje de RN-01, compartido por Domain y Application para que sea siempre el mismo.</summary>
    public const string MensajeSolapamiento =
        "Ya existe una reserva Aprobada para ese ambiente en esa fecha y horario. Elige otro horario u otro ambiente.";

    public Guid Id { get; private set; }
    public DateOnly Fecha { get; private set; }
    public TimeOnly HoraInicio { get; private set; }
    public TimeOnly HoraFin { get; private set; }
    public string Motivo { get; private set; } = string.Empty;
    public EstadoReserva Estado { get; private set; }
    public Guid UsuarioId { get; private set; }
    public Guid AmbienteId { get; private set; }

    /// <summary>Navegación: el usuario que pidió la reserva (EF la llena con Include).</summary>
    public Usuario Usuario { get; private set; } = null!;
    /// <summary>Navegación: el ambiente reservado (EF la llena con Include).</summary>
    public Ambiente Ambiente { get; private set; } = null!;

    /// <summary>Constructor vacío: solo lo usa EF Core.</summary>
    private Reserva() { }

    /// <summary>
    /// RN-01 (fórmula de solapamiento): dos horarios del mismo día se cruzan si
    /// inicioNueva &lt; finExistente Y finNueva &gt; inicioExistente.
    /// Si uno termina justo cuando el otro empieza (09:00 y 09:00) NO se cruzan.
    /// </summary>
    public static bool HorariosSeCruzan(TimeOnly inicioNueva, TimeOnly finNueva, TimeOnly inicioExistente, TimeOnly finExistente)
    {
        // RN-01
        return inicioNueva < finExistente && finNueva > inicioExistente;
    }

    /// <summary>
    /// Valida el horario de una reserva: RN-03 (fin &gt; inicio) y RN-04 (entre 07:00 y 22:00).
    /// Se usa al crear la reserva y al consultar disponibilidad (RF-04).
    /// </summary>
    public static ResultadoDominio ValidarHorario(TimeOnly inicio, TimeOnly fin)
    {
        // RN-03: la hora de fin debe ser mayor que la de inicio
        if (fin <= inicio)
            return ResultadoDominio.Falla(CodigoRegla.RN03, "La hora de fin debe ser mayor que la hora de inicio.");

        // RN-04: solo se puede reservar entre 07:00 y 22:00
        if (inicio < HoraMinima || fin > HoraMaxima)
            return ResultadoDominio.Falla(CodigoRegla.RN04, "El horario permitido es de 07:00 a 22:00.");

        return ResultadoDominio.Ok();
    }

    /// <summary>
    /// RF-03: crea una reserva nueva en estado Pendiente, aplicando RN-02, RN-03 y RN-04.
    /// RN-01 (solapamiento) NO se revisa aquí porque necesita consultar la base de datos;
    /// lo hace el servicio de Application.
    /// </summary>
    public static ResultadoDominio<Reserva> Crear(
        DateOnly fecha, TimeOnly horaInicio, TimeOnly horaFin, string motivo, Guid usuarioId, Guid ambienteId)
    {
        // RN-02: todos los campos son obligatorios
        if (string.IsNullOrWhiteSpace(motivo))
            return ResultadoDominio<Reserva>.Falla(CodigoRegla.RN02, "El motivo de la reserva es obligatorio.");
        if (usuarioId == Guid.Empty)
            return ResultadoDominio<Reserva>.Falla(CodigoRegla.RN02, "Debes seleccionar el usuario que solicita la reserva.");
        if (ambienteId == Guid.Empty)
            return ResultadoDominio<Reserva>.Falla(CodigoRegla.RN02, "Debes seleccionar el ambiente a reservar.");

        // RN-03 y RN-04
        var horario = ValidarHorario(horaInicio, horaFin);
        if (!horario.Exito)
            return ResultadoDominio<Reserva>.Falla(horario.Codigo, horario.Error);

        var reserva = new Reserva
        {
            Id = Guid.NewGuid(),
            Fecha = fecha,
            HoraInicio = horaInicio,
            HoraFin = horaFin,
            Motivo = motivo.Trim(),
            Estado = EstadoReserva.Pendiente,
            UsuarioId = usuarioId,
            AmbienteId = ambienteId
        };
        return ResultadoDominio<Reserva>.Ok(reserva);
    }

    /// <summary>
    /// RF-07: aprueba la reserva. Reglas: RN-05 (solo Administrador), RN-06 (Rechazada no cambia),
    /// solo desde Pendiente, y RN-01 (no puede cruzarse con otra Aprobada).
    /// </summary>
    /// <param name="rolActor">Rol de quien pide el cambio.</param>
    /// <param name="haySolapamientoAprobado">El servicio consulta la BD y nos dice si ya hay otra Aprobada que se cruza.</param>
    public ResultadoDominio Aprobar(RolUsuario rolActor, bool haySolapamientoAprobado)
    {
        // RN-05: solo el Administrador aprueba
        if (rolActor != RolUsuario.Administrador)
            return ResultadoDominio.Falla(CodigoRegla.RN05, "Solo el Administrador puede aprobar o rechazar reservas.");

        // RN-06: una Rechazada no se puede modificar
        var bloqueo = ErrorSiRechazada();
        if (bloqueo is not null) return bloqueo;

        if (Estado != EstadoReserva.Pendiente)
            return ResultadoDominio.Falla(CodigoRegla.TransicionInvalida,
                $"Solo se puede aprobar una reserva Pendiente. Esta reserva está {Estado}.");

        // RN-01: no puede haber dos Aprobadas que se crucen
        if (haySolapamientoAprobado)
            return ResultadoDominio.Falla(CodigoRegla.RN01, MensajeSolapamiento);

        Estado = EstadoReserva.Aprobada;
        return ResultadoDominio.Ok();
    }

    /// <summary>
    /// RF-07: rechaza la reserva. Reglas: RN-05 (solo Administrador), RN-06 y solo desde Pendiente.
    /// </summary>
    public ResultadoDominio Rechazar(RolUsuario rolActor)
    {
        // RN-05
        if (rolActor != RolUsuario.Administrador)
            return ResultadoDominio.Falla(CodigoRegla.RN05, "Solo el Administrador puede aprobar o rechazar reservas.");

        // RN-06
        var bloqueo = ErrorSiRechazada();
        if (bloqueo is not null) return bloqueo;

        if (Estado != EstadoReserva.Pendiente)
            return ResultadoDominio.Falla(CodigoRegla.TransicionInvalida,
                $"Solo se puede rechazar una reserva Pendiente. Esta reserva está {Estado}.");

        Estado = EstadoReserva.Rechazada;
        return ResultadoDominio.Ok();
    }

    /// <summary>
    /// RF-07: cancela la reserva (desde Pendiente o Aprobada). RN-06: una Rechazada no se toca.
    /// [SUPUESTO] Cancelar no exige ser Administrador (RN-05 solo habla de aprobar y rechazar).
    /// </summary>
    public ResultadoDominio Cancelar()
    {
        // RN-06
        var bloqueo = ErrorSiRechazada();
        if (bloqueo is not null) return bloqueo;

        if (Estado == EstadoReserva.Cancelada)
            return ResultadoDominio.Falla(CodigoRegla.TransicionInvalida, "Esta reserva ya está Cancelada.");

        Estado = EstadoReserva.Cancelada;
        return ResultadoDominio.Ok();
    }

    /// <summary>RN-06: devuelve el error si la reserva está Rechazada; null si se puede seguir.</summary>
    private ResultadoDominio? ErrorSiRechazada()
    {
        // RN-06
        return Estado == EstadoReserva.Rechazada
            ? ResultadoDominio.Falla(CodigoRegla.RN06, "Una reserva Rechazada no se puede modificar.")
            : null;
    }
}

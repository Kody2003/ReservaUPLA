using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Common;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Services;

/// <summary>
/// Casos de uso de reservas (RF-03 a RF-07). Es el "director de orquesta": lee los datos que llegan,
/// consulta los repositorios, le pide al dominio que aplique sus reglas y devuelve un Result.
/// Aquí se verifica RN-01 (solapamiento) porque necesita consultar la base de datos.
/// </summary>
public class ReservaService : IReservaService
{
    private readonly IReservaRepository _reservas;
    private readonly IUsuarioRepository _usuarios;
    private readonly IAmbienteRepository _ambientes;

    public ReservaService(IReservaRepository reservas, IUsuarioRepository usuarios, IAmbienteRepository ambientes)
    {
        _reservas = reservas;
        _usuarios = usuarios;
        _ambientes = ambientes;
    }

    /// <summary>
    /// RF-03: registra una reserva en estado Pendiente.
    /// Fase 2: si el rol es Solicitante o ResponsableAmbiente, el UsuarioId sale del token y se ignora el del cliente.
    /// El Administrador puede reservar en nombre de otro usuario.
    /// // LOGIN // RF-03 // RN-02
    /// </summary>
    public async Task<Result<ReservaDto>> CrearAsync(ReservaCrearDto dto, RolUsuario? rolActor = null, Guid? usuarioIdActor = null)
    {
        // Fase 2: si es Solicitante o ResponsableAmbiente, el id del autor sale del token
        Guid usuarioId;
        if ((rolActor == RolUsuario.Solicitante || rolActor == RolUsuario.ResponsableAmbiente) && usuarioIdActor.HasValue && usuarioIdActor.Value != Guid.Empty)
        {
            usuarioId = usuarioIdActor.Value;
        }
        else
        {
            // RN-02: id de usuario obligatorio si reserva el Administrador o en llamadas directas
            if (!Guid.TryParse(dto.UsuarioId, out usuarioId) || usuarioId == Guid.Empty)
                return Result<ReservaDto>.Falla(TipoError.Validacion, "Debes seleccionar el usuario que solicita la reserva.", CodigoRegla.RN02);
        }

        if (!Guid.TryParse(dto.AmbienteId, out var ambienteId) || ambienteId == Guid.Empty)
            return Result<ReservaDto>.Falla(TipoError.Validacion, "Debes seleccionar el ambiente a reservar.", CodigoRegla.RN02);

        // RN-02: fecha y horas obligatorias y con formato correcto
        var lectura = LeerFechaYHoras(dto.Fecha, dto.HoraInicio, dto.HoraFin);
        if (!lectura.Exito)
            return Result<ReservaDto>.Falla(lectura.Tipo, lectura.Error, lectura.Codigo);
        var (fecha, inicio, fin) = lectura.Valor;

        var motivo = dto.Motivo?.Trim() ?? string.Empty;
        if (Conversiones.Excede(motivo, 300))
            return Result<ReservaDto>.Falla(TipoError.Validacion, "El motivo no puede superar 300 caracteres.");

        // RN-02 (motivo), RN-03 y RN-04: las aplica el dominio
        var creada = Reserva.Crear(fecha, inicio, fin, motivo, usuarioId, ambienteId);
        if (!creada.Exito)
            return Result<ReservaDto>.Falla(TipoPorCodigo(creada.Codigo), creada.Error, creada.Codigo);
        var reserva = creada.Valor!;

        // El usuario debe existir y estar activo
        var usuario = await _usuarios.ObtenerPorIdAsync(usuarioId);
        if (usuario is null)
            return Result<ReservaDto>.Falla(TipoError.NoEncontrado, "El usuario seleccionado no existe.");
        if (!usuario.Activo)
            return Result<ReservaDto>.Falla(TipoError.Validacion, "El usuario seleccionado está inactivo y no puede solicitar reservas.");

        // El ambiente debe existir y estar Disponible
        var ambiente = await _ambientes.ObtenerPorIdAsync(ambienteId);
        if (ambiente is null)
            return Result<ReservaDto>.Falla(TipoError.NoEncontrado, "El ambiente seleccionado no existe.");
        if (ambiente.Estado != EstadoAmbiente.Disponible)
            return Result<ReservaDto>.Falla(TipoError.Validacion,
                $"El ambiente '{ambiente.Nombre}' no se puede reservar porque está en estado {ambiente.Estado}.");

        // RN-01 / RF-04: no se puede pedir un horario que ya tiene una reserva Aprobada
        var haySolapamiento = await _reservas.ExisteSolapamientoAprobadoAsync(ambienteId, fecha, inicio, fin, null);
        if (haySolapamiento)
            return Result<ReservaDto>.Falla(TipoError.Conflicto, Reserva.MensajeSolapamiento, CodigoRegla.RN01);

        await _reservas.AgregarAsync(reserva);
        return Result<ReservaDto>.Ok(reserva.ToDto(usuario.NombreCompleto, ambiente.Nombre));
    }

    /// <summary>
    /// RF-04: informa si un ambiente está libre. Un horario inválido o cruzado NO es un error HTTP:
    /// se responde con Disponible = false y el motivo, para mostrarlo junto al formulario.
    /// </summary>
    public async Task<Result<DisponibilidadDto>> ValidarDisponibilidadAsync(
        string? ambienteId, string? fecha, string? horaInicio, string? horaFin)
    {
        if (!Guid.TryParse(ambienteId, out var idAmbiente) || idAmbiente == Guid.Empty)
            return Result<DisponibilidadDto>.Falla(TipoError.Validacion, "Debes indicar el ambiente a consultar.", CodigoRegla.RN02);

        var lectura = LeerFechaYHoras(fecha, horaInicio, horaFin);
        if (!lectura.Exito)
            return Result<DisponibilidadDto>.Falla(lectura.Tipo, lectura.Error, lectura.Codigo);
        var (f, inicio, fin) = lectura.Valor;

        // RN-03 y RN-04
        var horario = Reserva.ValidarHorario(inicio, fin);
        if (!horario.Exito)
            return Result<DisponibilidadDto>.Ok(new DisponibilidadDto(false, horario.Error, horario.Codigo));

        var ambiente = await _ambientes.ObtenerPorIdAsync(idAmbiente);
        if (ambiente is null)
            return Result<DisponibilidadDto>.Falla(TipoError.NoEncontrado, "El ambiente indicado no existe.");
        if (ambiente.Estado != EstadoAmbiente.Disponible)
            return Result<DisponibilidadDto>.Ok(new DisponibilidadDto(false,
                $"El ambiente '{ambiente.Nombre}' está en estado {ambiente.Estado} y no se puede reservar.", string.Empty));

        // RN-01
        if (await _reservas.ExisteSolapamientoAprobadoAsync(idAmbiente, f, inicio, fin, null))
            return Result<DisponibilidadDto>.Ok(new DisponibilidadDto(false, Reserva.MensajeSolapamiento, CodigoRegla.RN01));

        return Result<DisponibilidadDto>.Ok(new DisponibilidadDto(true, "El ambiente está disponible en ese horario.", string.Empty));
    }

    /// <summary>
    /// RF-05: lista reservas. Los filtros llegan como texto y se convierten aquí.
    /// Fase 2: un Solicitante solo ve sus propias reservas; Administrador y ResponsableAmbiente ven todo.
    /// </summary>
    public async Task<Result<IReadOnlyList<ReservaDto>>> ListarAsync(
        string? estado, string? ambienteId, string? fecha, RolUsuario? rolActor = null, Guid? usuarioIdActor = null)
    {
        EstadoReserva? estadoFiltro = null;
        if (!string.IsNullOrWhiteSpace(estado))
        {
            if (!Conversiones.TryParseEnum<EstadoReserva>(estado, out var e))
                return Result<IReadOnlyList<ReservaDto>>.Falla(TipoError.Validacion,
                    "El estado del filtro no es válido. Usa Pendiente, Aprobada, Rechazada o Cancelada.");
            estadoFiltro = e;
        }

        Guid? ambienteFiltro = null;
        if (!string.IsNullOrWhiteSpace(ambienteId))
        {
            if (!Guid.TryParse(ambienteId, out var a))
                return Result<IReadOnlyList<ReservaDto>>.Falla(TipoError.Validacion, "El ambiente del filtro no es válido.");
            ambienteFiltro = a;
        }

        DateOnly? fechaFiltro = null;
        if (!string.IsNullOrWhiteSpace(fecha))
        {
            if (!Conversiones.TryParseFecha(fecha, out var f))
                return Result<IReadOnlyList<ReservaDto>>.Falla(TipoError.Validacion, "La fecha del filtro no es válida. Usa el formato AAAA-MM-DD.");
            fechaFiltro = f;
        }

        // Fase 2: Solicitante solo ve sus reservas
        Guid? usuarioFiltro = null;
        if (rolActor == RolUsuario.Solicitante && usuarioIdActor.HasValue)
        {
            usuarioFiltro = usuarioIdActor.Value;
        }

        var lista = await _reservas.ListarAsync(estadoFiltro, ambienteFiltro, fechaFiltro, usuarioFiltro);
        return Result<IReadOnlyList<ReservaDto>>.Ok(lista.Select(r => r.ToDto()).ToList());
    }

    /// <summary>
    /// RF-06: devuelve el detalle de una reserva.
    /// Fase 2: un Solicitante solo ve sus reservas; un detalle ajeno devuelve 404 (para no revelar su existencia).
    /// </summary>
    public async Task<Result<ReservaDto>> ObtenerPorIdAsync(Guid id, RolUsuario? rolActor = null, Guid? usuarioIdActor = null)
    {
        var reserva = await _reservas.ObtenerPorIdAsync(id);
        if (reserva is null)
            return Result<ReservaDto>.Falla(TipoError.NoEncontrado, "No se encontró la reserva solicitada.");

        // Fase 2: si es Solicitante y la reserva no es suya, responder 404 (no 403) para no revelar que existe
        if (rolActor == RolUsuario.Solicitante && usuarioIdActor.HasValue && reserva.UsuarioId != usuarioIdActor.Value)
            return Result<ReservaDto>.Falla(TipoError.NoEncontrado, "No se encontró la reserva solicitada.");

        return Result<ReservaDto>.Ok(reserva.ToDto());
    }

    /// <summary>
    /// RF-07: cambia el estado. Las reglas RN-05 y RN-06 las aplican los métodos de la entidad
    /// (Aprobar, Rechazar, Cancelar); aquí solo se prepara lo que necesitan y se guarda el resultado.
    /// Fase 2: un Solicitante solo cancela las suyas; el Administrador, cualquiera.
    /// // RN-05 // RN-06
    /// </summary>
    public async Task<Result<ReservaDto>> CambiarEstadoAsync(
        Guid id, string? nuevoEstado, RolUsuario rolActor, Guid? usuarioIdActor = null)
    {
        var reserva = await _reservas.ObtenerPorIdAsync(id);
        if (reserva is null)
            return Result<ReservaDto>.Falla(TipoError.NoEncontrado, "No se encontró la reserva solicitada.");

        if (!Conversiones.TryParseEnum<EstadoReserva>(nuevoEstado, out var destino))
            return Result<ReservaDto>.Falla(TipoError.Validacion, "Debes indicar el nuevo estado: Aprobada, Rechazada o Cancelada.");

        ResultadoDominio resultado;
        switch (destino)
        {
            case EstadoReserva.Aprobada:
                // RN-01: antes de aprobar, preguntamos si ya hay otra Aprobada que se cruza
                var haySolapamiento = await _reservas.ExisteSolapamientoAprobadoAsync(
                    reserva.AmbienteId, reserva.Fecha, reserva.HoraInicio, reserva.HoraFin, reserva.Id);
                resultado = reserva.Aprobar(rolActor, haySolapamiento);   // RN-05, RN-06, RN-01
                break;
            case EstadoReserva.Rechazada:
                resultado = reserva.Rechazar(rolActor);                   // RN-05, RN-06
                break;
            case EstadoReserva.Cancelada:
                // Fase 2: un Solicitante solo cancela las suyas; el Administrador, cualquiera
                if (rolActor == RolUsuario.Solicitante && usuarioIdActor.HasValue && reserva.UsuarioId != usuarioIdActor.Value)
                    return Result<ReservaDto>.Falla(TipoError.Prohibido, "Solo puedes cancelar tus propias reservas.");

                resultado = reserva.Cancelar();                           // RN-06
                break;
            default:
                return Result<ReservaDto>.Falla(TipoError.Validacion, "Solo se puede cambiar el estado a Aprobada, Rechazada o Cancelada.");
        }

        if (!resultado.Exito)
            return Result<ReservaDto>.Falla(TipoPorCodigo(resultado.Codigo), resultado.Error, resultado.Codigo);

        await _reservas.ActualizarAsync(reserva);
        return Result<ReservaDto>.Ok(reserva.ToDto());
    }

    /// <summary>Lee y valida el formato de la fecha y las dos horas. Compartido por RF-03 y RF-04.</summary>
    private static Result<(DateOnly Fecha, TimeOnly Inicio, TimeOnly Fin)> LeerFechaYHoras(
        string? fecha, string? horaInicio, string? horaFin)
    {
        // RN-02: son obligatorias
        if (string.IsNullOrWhiteSpace(fecha) || string.IsNullOrWhiteSpace(horaInicio) || string.IsNullOrWhiteSpace(horaFin))
            return Result<(DateOnly, TimeOnly, TimeOnly)>.Falla(TipoError.Validacion,
                "La fecha, la hora de inicio y la hora de fin son obligatorias.", CodigoRegla.RN02);

        if (!Conversiones.TryParseFecha(fecha, out var f))
            return Result<(DateOnly, TimeOnly, TimeOnly)>.Falla(TipoError.Validacion, "La fecha no es válida. Usa el formato AAAA-MM-DD.");
        if (!Conversiones.TryParseHora(horaInicio, out var inicio))
            return Result<(DateOnly, TimeOnly, TimeOnly)>.Falla(TipoError.Validacion, "La hora de inicio no es válida. Usa el formato HH:mm.");
        if (!Conversiones.TryParseHora(horaFin, out var fin))
            return Result<(DateOnly, TimeOnly, TimeOnly)>.Falla(TipoError.Validacion, "La hora de fin no es válida. Usa el formato HH:mm.");

        return Result<(DateOnly, TimeOnly, TimeOnly)>.Ok((f, inicio, fin));
    }

    /// <summary>Traduce el código de regla del dominio al tipo de error (y por tanto al código HTTP).</summary>
    private static TipoError TipoPorCodigo(string codigo) => codigo switch
    {
        CodigoRegla.RN05 => TipoError.Prohibido,                 // 403
        CodigoRegla.RN01 => TipoError.Conflicto,                 // 409
        CodigoRegla.RN06 => TipoError.Conflicto,                 // 409
        CodigoRegla.TransicionInvalida => TipoError.Conflicto,   // 409
        _ => TipoError.Validacion                                // 400 (RN-02, RN-03, RN-04)
    };
}

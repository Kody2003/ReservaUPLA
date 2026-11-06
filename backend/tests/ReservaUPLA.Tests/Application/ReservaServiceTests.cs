using Moq;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Application.Services;
using ReservaUPLA.Domain.Common;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Tests.Application;

/// <summary>
/// Pruebas del ReservaService con repositorios falsos (Moq): comprueban que el servicio
/// aplique RN-01, RN-02, RN-03, RN-04, RN-05 y RN-06 sin tocar PostgreSQL.
/// Convención de nombres: Metodo_Escenario_ResultadoEsperado_RNxx
/// </summary>
public class ReservaServiceTests
{
    private readonly Mock<IReservaRepository> _reservas = new();
    private readonly Mock<IUsuarioRepository> _usuarios = new();
    private readonly Mock<IAmbienteRepository> _ambientes = new();

    private readonly Usuario _usuario = Usuario.Crear("Ana Torres", "ana@ejemplo.edu.pe", RolUsuario.Solicitante);
    private readonly Ambiente _ambiente = Ambiente.Crear("Aula 101", "Aula", 40, "Pabellón A", EstadoAmbiente.Disponible);

    /// <summary>Arma el servicio y deja listos un usuario activo y un ambiente disponible.</summary>
    private ReservaService CrearServicio()
    {
        _usuarios.Setup(r => r.ObtenerPorIdAsync(It.IsAny<Guid>())).ReturnsAsync(_usuario);
        _ambientes.Setup(r => r.ObtenerPorIdAsync(It.IsAny<Guid>())).ReturnsAsync(_ambiente);
        return new ReservaService(_reservas.Object, _usuarios.Object, _ambientes.Object);
    }

    /// <summary>Datos de entrada válidos (09:00 - 10:00); cada prueba cambia solo lo que quiere probar.</summary>
    private ReservaCrearDto DtoValido(string inicio = "09:00", string fin = "10:00", string motivo = "Clase de prueba") =>
        new(_usuario.Id.ToString(), _ambiente.Id.ToString(), "2026-11-10", inicio, fin, motivo);

    /// <summary>Hace que el repositorio responda si existe (o no) una Aprobada que se cruce.</summary>
    private void ConfigurarSolapamiento(bool existe) =>
        _reservas.Setup(r => r.ExisteSolapamientoAprobadoAsync(
                It.IsAny<Guid>(), It.IsAny<DateOnly>(), It.IsAny<TimeOnly>(), It.IsAny<TimeOnly>(), It.IsAny<Guid?>()))
            .ReturnsAsync(existe);

    private static Reserva NuevaReservaPendiente() =>
        Reserva.Crear(new DateOnly(2026, 11, 10), new TimeOnly(9, 0), new TimeOnly(10, 0), "Clase", Guid.NewGuid(), Guid.NewGuid()).Valor!;

    // ---------- RN-01 ----------

    [Fact]
    public async Task Crear_HorarioCruzado_Falla_RN01()
    {
        var servicio = CrearServicio();
        ConfigurarSolapamiento(true);   // ya hay una Aprobada que se cruza

        var resultado = await servicio.CrearAsync(DtoValido());

        Assert.False(resultado.Exito);
        Assert.Equal(CodigoRegla.RN01, resultado.Codigo);
        Assert.Equal(TipoError.Conflicto, resultado.Tipo);
        _reservas.Verify(r => r.AgregarAsync(It.IsAny<Reserva>()), Times.Never);   // no se guardó nada
    }

    [Fact]
    public async Task CambiarEstado_AprobarConHorarioCruzado_Falla_RN01()
    {
        var servicio = CrearServicio();
        var reserva = NuevaReservaPendiente();
        _reservas.Setup(r => r.ObtenerPorIdAsync(reserva.Id)).ReturnsAsync(reserva);
        ConfigurarSolapamiento(true);

        var resultado = await servicio.CambiarEstadoAsync(reserva.Id, "Aprobada", RolUsuario.Administrador);

        Assert.False(resultado.Exito);
        Assert.Equal(CodigoRegla.RN01, resultado.Codigo);
        Assert.Equal(EstadoReserva.Pendiente, reserva.Estado);
        _reservas.Verify(r => r.ActualizarAsync(It.IsAny<Reserva>()), Times.Never);
    }

    [Fact]
    public async Task Crear_HorarioLibre_Exito_RN01()
    {
        var servicio = CrearServicio();
        ConfigurarSolapamiento(false);

        var resultado = await servicio.CrearAsync(DtoValido());

        Assert.True(resultado.Exito);
        Assert.Equal("Pendiente", resultado.Valor!.Estado);
        _reservas.Verify(r => r.AgregarAsync(It.IsAny<Reserva>()), Times.Once);
    }

    // ---------- RN-02 ----------

    [Fact]
    public async Task Crear_MotivoVacio_Falla_RN02()
    {
        var servicio = CrearServicio();

        var resultado = await servicio.CrearAsync(DtoValido(motivo: ""));

        Assert.False(resultado.Exito);
        Assert.Equal(CodigoRegla.RN02, resultado.Codigo);
        Assert.Equal(TipoError.Validacion, resultado.Tipo);
    }

    // ---------- RN-03 ----------

    [Fact]
    public async Task Crear_HoraFinIgualAInicio_Falla_RN03()
    {
        var servicio = CrearServicio();

        var resultado = await servicio.CrearAsync(DtoValido(inicio: "09:00", fin: "09:00"));

        Assert.False(resultado.Exito);
        Assert.Equal(CodigoRegla.RN03, resultado.Codigo);
        Assert.Equal(TipoError.Validacion, resultado.Tipo);
    }

    // ---------- RN-04 ----------

    [Theory]
    [InlineData("06:00", "08:00")]
    [InlineData("21:00", "23:00")]
    public async Task Crear_FueraDeHorario_Falla_RN04(string inicio, string fin)
    {
        var servicio = CrearServicio();

        var resultado = await servicio.CrearAsync(DtoValido(inicio, fin));

        Assert.False(resultado.Exito);
        Assert.Equal(CodigoRegla.RN04, resultado.Codigo);
    }

    // ---------- RN-05 ----------

    [Fact]
    public async Task CambiarEstado_AprobarSinSerAdministrador_Falla_RN05()
    {
        var servicio = CrearServicio();
        var reserva = NuevaReservaPendiente();
        _reservas.Setup(r => r.ObtenerPorIdAsync(reserva.Id)).ReturnsAsync(reserva);
        ConfigurarSolapamiento(false);

        var resultado = await servicio.CambiarEstadoAsync(reserva.Id, "Aprobada", RolUsuario.Solicitante);

        Assert.False(resultado.Exito);
        Assert.Equal(CodigoRegla.RN05, resultado.Codigo);
        Assert.Equal(TipoError.Prohibido, resultado.Tipo);   // el controlador lo convierte en 403
        _reservas.Verify(r => r.ActualizarAsync(It.IsAny<Reserva>()), Times.Never);
    }

    [Fact]
    public async Task CambiarEstado_AdministradorAprueba_Exito_RN05()
    {
        var servicio = CrearServicio();
        var reserva = NuevaReservaPendiente();
        _reservas.Setup(r => r.ObtenerPorIdAsync(reserva.Id)).ReturnsAsync(reserva);
        ConfigurarSolapamiento(false);

        var resultado = await servicio.CambiarEstadoAsync(reserva.Id, "Aprobada", RolUsuario.Administrador);

        Assert.True(resultado.Exito);
        Assert.Equal("Aprobada", resultado.Valor!.Estado);
        _reservas.Verify(r => r.ActualizarAsync(reserva), Times.Once);
    }

    // ---------- RN-06 ----------

    [Fact]
    public async Task CambiarEstado_ModificarReservaRechazada_Falla_RN06()
    {
        var servicio = CrearServicio();
        var reserva = NuevaReservaPendiente();
        reserva.Rechazar(RolUsuario.Administrador);   // la dejamos Rechazada
        _reservas.Setup(r => r.ObtenerPorIdAsync(reserva.Id)).ReturnsAsync(reserva);
        ConfigurarSolapamiento(false);

        var resultado = await servicio.CambiarEstadoAsync(reserva.Id, "Aprobada", RolUsuario.Administrador);

        Assert.False(resultado.Exito);
        Assert.Equal(CodigoRegla.RN06, resultado.Codigo);
        Assert.Equal(TipoError.Conflicto, resultado.Tipo);
        Assert.Equal(EstadoReserva.Rechazada, reserva.Estado);
        _reservas.Verify(r => r.ActualizarAsync(It.IsAny<Reserva>()), Times.Never);
    }

    // ---------- FASE 2: Cada usuario ve y cancela solo lo suyo ----------

    [Fact]
    public async Task Listar_Solicitante_SoloVeLasSuyas()
    {
        // Arrange
        var servicio = CrearServicio();
        var solicitanteId = _usuario.Id;
        var reservaPropia = Reserva.Crear(new DateOnly(2026, 11, 10), new TimeOnly(9, 0), new TimeOnly(10, 0), "Mi clase", solicitanteId, _ambiente.Id).Valor!;
        _reservas.Setup(r => r.ListarAsync(null, null, null, solicitanteId))
            .ReturnsAsync(new List<Reserva> { reservaPropia });

        // Act
        var resultado = await servicio.ListarAsync(null, null, null, RolUsuario.Solicitante, solicitanteId);

        // Assert
        Assert.True(resultado.Exito);
        Assert.Single(resultado.Valor!);
        Assert.Equal(solicitanteId, resultado.Valor![0].UsuarioId);
        _reservas.Verify(r => r.ListarAsync(null, null, null, solicitanteId), Times.Once);
    }

    [Fact]
    public async Task Cancelar_ReservaAjena_Falla()
    {
        // Arrange
        var servicio = CrearServicio();
        var idPropietario = Guid.NewGuid();
        var idSolicitanteIntruso = Guid.NewGuid();
        var reservaAjena = Reserva.Crear(new DateOnly(2026, 11, 10), new TimeOnly(9, 0), new TimeOnly(10, 0), "Clase ajena", idPropietario, _ambiente.Id).Valor!;
        _reservas.Setup(r => r.ObtenerPorIdAsync(reservaAjena.Id)).ReturnsAsync(reservaAjena);

        // Act
        var resultado = await servicio.CambiarEstadoAsync(reservaAjena.Id, "Cancelada", RolUsuario.Solicitante, idSolicitanteIntruso);

        // Assert
        Assert.False(resultado.Exito);
        Assert.Equal(TipoError.Prohibido, resultado.Tipo);
        _reservas.Verify(r => r.ActualizarAsync(It.IsAny<Reserva>()), Times.Never);
    }

    [Fact]
    public async Task Crear_Solicitante_IgnoraUsuarioIdDelCliente()
    {
        // Arrange
        var servicio = CrearServicio();
        var idSolicitanteDelToken = _usuario.Id;
        var idTerceroEnPayload = Guid.NewGuid();
        var dto = new ReservaCrearDto(idTerceroEnPayload.ToString(), _ambiente.Id.ToString(), "2026-11-10", "09:00", "10:00", "Clase");
        ConfigurarSolapamiento(false);

        // Act: el cliente manda un id ajeno, pero el token lleva idSolicitanteDelToken
        var resultado = await servicio.CrearAsync(dto, RolUsuario.Solicitante, idSolicitanteDelToken);

        // Assert: la reserva se creó con el ID del token y no con el del JSON
        Assert.True(resultado.Exito);
        Assert.Equal(idSolicitanteDelToken, resultado.Valor!.UsuarioId);
        _reservas.Verify(r => r.AgregarAsync(It.Is<Reserva>(r => r.UsuarioId == idSolicitanteDelToken)), Times.Once);
    }
}

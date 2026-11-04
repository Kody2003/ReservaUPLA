using ReservaUPLA.Domain.Common;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Tests.Domain;

/// <summary>
/// Pruebas de las reglas que viven en la entidad Reserva (no necesitan base de datos ni Moq):
/// RN-01 (fórmula), RN-03, RN-04, RN-05 y RN-06.
/// Convención de nombres: Metodo_Escenario_ResultadoEsperado_RNxx
/// </summary>
public class ReservaDominioTests
{
    // ---------- ayudas para armar datos de prueba ----------

    private static readonly DateOnly Fecha = new(2026, 11, 10);

    /// <summary>Crea una reserva Pendiente válida (09:00 - 10:00).</summary>
    private static Reserva ReservaPendiente()
    {
        var resultado = Reserva.Crear(Fecha, new TimeOnly(9, 0), new TimeOnly(10, 0), "Clase", Guid.NewGuid(), Guid.NewGuid());
        return resultado.Valor!;
    }

    /// <summary>Crea una reserva y la deja Rechazada (usando un Administrador).</summary>
    private static Reserva ReservaRechazada()
    {
        var reserva = ReservaPendiente();
        reserva.Rechazar(RolUsuario.Administrador);
        return reserva;
    }

    // ---------- RN-01: fórmula de solapamiento ----------

    [Theory]
    [InlineData("08:00", "10:00", "09:00", "11:00", true)]   // se pisan a la mitad
    [InlineData("09:00", "10:00", "08:00", "12:00", true)]   // uno contiene al otro
    [InlineData("08:00", "09:00", "09:00", "10:00", false)]  // uno termina cuando empieza el otro: NO se cruzan
    [InlineData("11:00", "12:00", "08:00", "10:00", false)]  // completamente separados
    public void HorariosSeCruzan_CasosVarios_DevuelveLoEsperado_RN01(
        string inicioNueva, string finNueva, string inicioExistente, string finExistente, bool esperado)
    {
        var resultado = Reserva.HorariosSeCruzan(
            TimeOnly.Parse(inicioNueva), TimeOnly.Parse(finNueva),
            TimeOnly.Parse(inicioExistente), TimeOnly.Parse(finExistente));

        Assert.Equal(esperado, resultado);
    }

    [Fact]
    public void Aprobar_ConSolapamiento_Falla_RN01()
    {
        var reserva = ReservaPendiente();

        var resultado = reserva.Aprobar(RolUsuario.Administrador, haySolapamientoAprobado: true);

        Assert.False(resultado.Exito);
        Assert.Equal(CodigoRegla.RN01, resultado.Codigo);
        Assert.Equal(EstadoReserva.Pendiente, reserva.Estado);   // no cambió
    }

    // ---------- RN-03: HoraFin > HoraInicio ----------

    [Theory]
    [InlineData("09:00", "09:00")]   // iguales
    [InlineData("10:00", "09:00")]   // fin antes que inicio
    public void Crear_HoraFinNoMayorQueInicio_Falla_RN03(string inicio, string fin)
    {
        var resultado = Reserva.Crear(Fecha, TimeOnly.Parse(inicio), TimeOnly.Parse(fin), "Clase", Guid.NewGuid(), Guid.NewGuid());

        Assert.False(resultado.Exito);
        Assert.Equal(CodigoRegla.RN03, resultado.Codigo);
    }

    // ---------- RN-04: horario 07:00 - 22:00 ----------

    [Theory]
    [InlineData("06:30", "08:00")]   // empieza antes de las 07:00
    [InlineData("21:00", "22:30")]   // termina después de las 22:00
    public void Crear_FueraDeHorarioPermitido_Falla_RN04(string inicio, string fin)
    {
        var resultado = Reserva.Crear(Fecha, TimeOnly.Parse(inicio), TimeOnly.Parse(fin), "Clase", Guid.NewGuid(), Guid.NewGuid());

        Assert.False(resultado.Exito);
        Assert.Equal(CodigoRegla.RN04, resultado.Codigo);
    }

    [Fact]
    public void Crear_HorarioEnLosLimites_Exito_RN04()
    {
        var resultado = Reserva.Crear(Fecha, new TimeOnly(7, 0), new TimeOnly(22, 0), "Jornada completa", Guid.NewGuid(), Guid.NewGuid());

        Assert.True(resultado.Exito);
        Assert.Equal(EstadoReserva.Pendiente, resultado.Valor!.Estado);
    }

    // ---------- RN-05: solo el Administrador aprueba o rechaza ----------

    [Theory]
    [InlineData(RolUsuario.Solicitante)]
    [InlineData(RolUsuario.ResponsableAmbiente)]
    public void Aprobar_RolNoAdministrador_Falla_RN05(RolUsuario rol)
    {
        var reserva = ReservaPendiente();

        var resultado = reserva.Aprobar(rol, haySolapamientoAprobado: false);

        Assert.False(resultado.Exito);
        Assert.Equal(CodigoRegla.RN05, resultado.Codigo);
        Assert.Equal(EstadoReserva.Pendiente, reserva.Estado);
    }

    [Theory]
    [InlineData(RolUsuario.Solicitante)]
    [InlineData(RolUsuario.ResponsableAmbiente)]
    public void Rechazar_RolNoAdministrador_Falla_RN05(RolUsuario rol)
    {
        var reserva = ReservaPendiente();

        var resultado = reserva.Rechazar(rol);

        Assert.False(resultado.Exito);
        Assert.Equal(CodigoRegla.RN05, resultado.Codigo);
    }

    [Fact]
    public void Aprobar_Administrador_Exito_RN05()
    {
        var reserva = ReservaPendiente();

        var resultado = reserva.Aprobar(RolUsuario.Administrador, haySolapamientoAprobado: false);

        Assert.True(resultado.Exito);
        Assert.Equal(EstadoReserva.Aprobada, reserva.Estado);
    }

    // ---------- RN-06: una Rechazada no se puede modificar ----------

    [Fact]
    public void Aprobar_ReservaRechazada_Falla_RN06()
    {
        var reserva = ReservaRechazada();

        var resultado = reserva.Aprobar(RolUsuario.Administrador, haySolapamientoAprobado: false);

        Assert.False(resultado.Exito);
        Assert.Equal(CodigoRegla.RN06, resultado.Codigo);
        Assert.Equal(EstadoReserva.Rechazada, reserva.Estado);
    }

    [Fact]
    public void Rechazar_ReservaYaRechazada_Falla_RN06()
    {
        var reserva = ReservaRechazada();

        var resultado = reserva.Rechazar(RolUsuario.Administrador);

        Assert.False(resultado.Exito);
        Assert.Equal(CodigoRegla.RN06, resultado.Codigo);
    }

    [Fact]
    public void Cancelar_ReservaRechazada_Falla_RN06()
    {
        var reserva = ReservaRechazada();

        var resultado = reserva.Cancelar();

        Assert.False(resultado.Exito);
        Assert.Equal(CodigoRegla.RN06, resultado.Codigo);
        Assert.Equal(EstadoReserva.Rechazada, reserva.Estado);
    }

    // ---------- RN-02: campos obligatorios ----------

    [Fact]
    public void Crear_MotivoVacio_Falla_RN02()
    {
        var resultado = Reserva.Crear(Fecha, new TimeOnly(9, 0), new TimeOnly(10, 0), "   ", Guid.NewGuid(), Guid.NewGuid());

        Assert.False(resultado.Exito);
        Assert.Equal(CodigoRegla.RN02, resultado.Codigo);
    }
}

namespace ReservaUPLA.Domain.Common;

/// <summary>
/// Códigos de las reglas de negocio. Se usan para identificar QUÉ regla falló
/// (el backend los envía al frontend y las pruebas los comprueban).
/// Tener constantes evita escribir "RN-01" a mano y equivocarse (refactorización S08).
/// </summary>
public static class CodigoRegla
{
    /// <summary>RN-01: máximo una reserva Aprobada por ambiente + fecha + horario.</summary>
    public const string RN01 = "RN-01";
    /// <summary>RN-02: todos los campos son obligatorios.</summary>
    public const string RN02 = "RN-02";
    /// <summary>RN-03: HoraFin debe ser mayor que HoraInicio.</summary>
    public const string RN03 = "RN-03";
    /// <summary>RN-04: horario permitido de 07:00 a 22:00.</summary>
    public const string RN04 = "RN-04";
    /// <summary>RN-05: solo el Administrador aprueba o rechaza.</summary>
    public const string RN05 = "RN-05";
    /// <summary>RN-06: una reserva Rechazada no se puede modificar.</summary>
    public const string RN06 = "RN-06";
    /// <summary>Cambio de estado que el ciclo de vida no permite (ej. aprobar una Cancelada).</summary>
    public const string TransicionInvalida = "ESTADO";
}

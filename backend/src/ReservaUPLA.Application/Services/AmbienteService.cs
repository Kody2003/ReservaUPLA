using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Common;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Services;

/// <summary>
/// Casos de uso de ambientes (RF-02): valida los datos (RN-02, capacidad &gt; 0) y los guarda.
/// </summary>
public class AmbienteService : IAmbienteService
{
    private readonly IAmbienteRepository _ambientes;

    public AmbienteService(IAmbienteRepository ambientes)
    {
        _ambientes = ambientes;
    }

    /// <summary>RF-02: registra un ambiente nuevo.</summary>
    public async Task<Result<AmbienteDto>> CrearAsync(AmbienteCrearDto dto)
    {
        // RN-02: todos los campos son obligatorios
        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return Result<AmbienteDto>.Falla(TipoError.Validacion, "El nombre del ambiente es obligatorio.", CodigoRegla.RN02);
        if (string.IsNullOrWhiteSpace(dto.Tipo))
            return Result<AmbienteDto>.Falla(TipoError.Validacion, "El tipo de ambiente es obligatorio (ej. Aula, Laboratorio).", CodigoRegla.RN02);
        if (dto.Capacidad is null)
            return Result<AmbienteDto>.Falla(TipoError.Validacion, "La capacidad es obligatoria.", CodigoRegla.RN02);
        if (string.IsNullOrWhiteSpace(dto.Ubicacion))
            return Result<AmbienteDto>.Falla(TipoError.Validacion, "La ubicación es obligatoria.", CodigoRegla.RN02);
        if (!Conversiones.TryParseEnum<EstadoAmbiente>(dto.Estado, out var estado))
            return Result<AmbienteDto>.Falla(TipoError.Validacion,
                "El estado es obligatorio y debe ser Disponible, Mantenimiento o Inactivo.", CodigoRegla.RN02);

        // Capacidad: entero mayor que 0
        if (dto.Capacidad <= 0)
            return Result<AmbienteDto>.Falla(TipoError.Validacion, "La capacidad debe ser un número entero mayor que 0.");

        var nombre = dto.Nombre.Trim();
        var tipo = dto.Tipo.Trim();
        var ubicacion = dto.Ubicacion.Trim();

        if (Conversiones.Excede(nombre, 100))
            return Result<AmbienteDto>.Falla(TipoError.Validacion, "El nombre no puede superar 100 caracteres.");
        if (Conversiones.Excede(tipo, 50))
            return Result<AmbienteDto>.Falla(TipoError.Validacion, "El tipo no puede superar 50 caracteres.");
        if (Conversiones.Excede(ubicacion, 150))
            return Result<AmbienteDto>.Falla(TipoError.Validacion, "La ubicación no puede superar 150 caracteres.");

        var ambiente = Ambiente.Crear(nombre, tipo, dto.Capacidad.Value, ubicacion, estado);
        await _ambientes.AgregarAsync(ambiente);
        return Result<AmbienteDto>.Ok(ambiente.ToDto());
    }

    /// <summary>Lista todos los ambientes.</summary>
    public async Task<Result<IReadOnlyList<AmbienteDto>>> ListarAsync()
    {
        var lista = await _ambientes.ListarAsync();
        return Result<IReadOnlyList<AmbienteDto>>.Ok(lista.Select(a => a.ToDto()).ToList());
    }
}

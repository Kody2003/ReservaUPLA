using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;

namespace ReservaUPLA.Application.Interfaces;

/// <summary>Casos de uso de usuarios (RF-01). El controlador solo conoce esta interfaz.</summary>
public interface IUsuarioService
{
    Task<Result<UsuarioDto>> CrearAsync(UsuarioCrearDto dto);
    Task<Result<IReadOnlyList<UsuarioDto>>> ListarAsync();
}

using Moq;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Application.Services;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;
using ReservaUPLA.Infrastructure.Security;

namespace ReservaUPLA.Tests.Application;

/// <summary>
/// Pruebas unitarias de los flujos de autenticación, verificación de contraseñas y emisión de tokens.
/// // LOGIN
/// </summary>
public class AuthServiceTests
{
    private readonly Mock<IUsuarioRepository> _usuariosMock = new();
    private readonly Mock<IPasswordHasher> _hasherMock = new();
    private readonly Mock<ITokenService> _tokenServiceMock = new();

    private AuthService CrearServicio() =>
        new(_usuariosMock.Object, _hasherMock.Object, _tokenServiceMock.Object);

    [Fact]
    public async Task IniciarSesion_CredencialesCorrectas_DevuelveToken_LOGIN()
    {
        // Arrange
        var usuario = Usuario.Crear("Marta Quispe", "marta@ejemplo.edu.pe", RolUsuario.Administrador, activo: true, passwordHash: "hash-valido");
        _usuariosMock.Setup(r => r.ObtenerPorCorreoAsync("marta@ejemplo.edu.pe")).ReturnsAsync(usuario);
        _hasherMock.Setup(h => h.Verificar("ClaveSegura123", "hash-valido")).Returns(true);
        _tokenServiceMock.Setup(t => t.Generar(usuario)).Returns(("token-jwt-simulado", DateTime.UtcNow.AddMinutes(60)));

        var servicio = CrearServicio();

        // Act
        var resultado = await servicio.IniciarSesionAsync("marta@ejemplo.edu.pe", "ClaveSegura123");

        // Assert
        Assert.True(resultado.Exito);
        Assert.NotNull(resultado.Valor);
        Assert.Equal("token-jwt-simulado", resultado.Valor.Token);
        Assert.Equal("marta@ejemplo.edu.pe", resultado.Valor.Correo);
        Assert.Equal("Administrador", resultado.Valor.Rol);
    }

    [Fact]
    public async Task IniciarSesion_ContrasenaIncorrecta_DevuelveMensajeGenerico_LOGIN()
    {
        // Arrange
        var usuario = Usuario.Crear("Ana Torres", "ana@ejemplo.edu.pe", RolUsuario.Solicitante, activo: true, passwordHash: "hash-valido");
        _usuariosMock.Setup(r => r.ObtenerPorCorreoAsync("ana@ejemplo.edu.pe")).ReturnsAsync(usuario);
        _hasherMock.Setup(h => h.Verificar("ClaveErronea", "hash-valido")).Returns(false);

        var servicio = CrearServicio();

        // Act
        var resultado = await servicio.IniciarSesionAsync("ana@ejemplo.edu.pe", "ClaveErronea");

        // Assert
        Assert.False(resultado.Exito);
        Assert.Equal("Correo o contraseña incorrectos.", resultado.Error);
    }

    [Fact]
    public async Task IniciarSesion_CorreoInexistente_DevuelveMismoMensajeGenerico_LOGIN()
    {
        // Arrange
        _usuariosMock.Setup(r => r.ObtenerPorCorreoAsync("fantasma@ejemplo.edu.pe")).ReturnsAsync((Usuario?)null);

        var servicio = CrearServicio();

        // Act
        var resultado = await servicio.IniciarSesionAsync("fantasma@ejemplo.edu.pe", "CualquierClave123");

        // Assert
        Assert.False(resultado.Exito);
        Assert.Equal("Correo o contraseña incorrectos.", resultado.Error);
    }

    [Fact]
    public async Task IniciarSesion_UsuarioInactivo_NoEntra_LOGIN()
    {
        // Arrange
        var usuarioInactivo = Usuario.Crear("Pedro Salas", "pedro.salas@ejemplo.edu.pe", RolUsuario.Solicitante, activo: false, passwordHash: "hash-valido");
        _usuariosMock.Setup(r => r.ObtenerPorCorreoAsync("pedro.salas@ejemplo.edu.pe")).ReturnsAsync(usuarioInactivo);
        _hasherMock.Setup(h => h.Verificar("ClaveDemo123", "hash-valido")).Returns(true);

        var servicio = CrearServicio();

        // Act
        var resultado = await servicio.IniciarSesionAsync("pedro.salas@ejemplo.edu.pe", "ClaveDemo123");

        // Assert
        Assert.False(resultado.Exito);
        Assert.Equal(TipoError.Prohibido, resultado.Tipo);
        Assert.Equal("Tu cuenta está desactivada. Comunícate con el administrador.", resultado.Error);
    }

    [Fact]
    public async Task IniciarSesionDemo_RolInactivo_FallaIgualQueLogin_LOGIN()
    {
        // Arrange
        var pedroInactivo = Usuario.Crear("Pedro Salas (inactivo)", "pedro.salas@ejemplo.edu.pe", RolUsuario.Solicitante, activo: false, passwordHash: "hash-demo");
        _usuariosMock.Setup(r => r.ObtenerPorCorreoAsync("pedro.salas@ejemplo.edu.pe")).ReturnsAsync(pedroInactivo);

        var servicio = CrearServicio();

        // Act
        var resultado = await servicio.IniciarSesionDemoAsync("Inactivo");

        // Assert
        Assert.False(resultado.Exito);
        Assert.Equal(TipoError.Prohibido, resultado.Tipo);
        Assert.Equal("Tu cuenta está desactivada. Comunícate con el administrador.", resultado.Error);
    }

    [Fact]
    public void PasswordHasher_VerificaBien_YDosHashesSonDistintos_LOGIN()
    {
        // Arrange
        var hasher = new PasswordHasher();
        const string clave = "ContrasenaSegura2026";

        // Act
        var hash1 = hasher.Hashear(clave);
        var hash2 = hasher.Hashear(clave);

        // Assert: sales aleatorias aseguran que los hashes sean diferentes
        Assert.NotEqual(hash1, hash2);

        // Ambos hashes deben validar con la contraseña original
        Assert.True(hasher.Verificar(clave, hash1));
        Assert.True(hasher.Verificar(clave, hash2));

        // Clave errónea debe ser rechazada
        Assert.False(hasher.Verificar("OtraContrasenaDistinta", hash1));
    }

    [Fact]
    public async Task CambiarContrasena_ActualIncorrecta_Falla_LOGIN()
    {
        // Arrange
        var usuario = Usuario.Crear("Luis Rojas", "luis@ejemplo.edu.pe", RolUsuario.Solicitante, activo: true, passwordHash: "hash-actual");
        _usuariosMock.Setup(r => r.ObtenerPorIdAsync(usuario.Id)).ReturnsAsync(usuario);
        _hasherMock.Setup(h => h.Verificar("ActualIncorrecta", "hash-actual")).Returns(false);

        var servicio = CrearServicio();

        // Act
        var resultado = await servicio.CambiarContrasenaAsync(usuario.Id, "ActualIncorrecta", "NuevaClave123");

        // Assert
        Assert.False(resultado.Exito);
        Assert.Equal("La contraseña actual no es correcta.", resultado.Error);
    }

    [Fact]
    public async Task CambiarContrasena_MismaContrasena_Falla_LOGIN()
    {
        // Arrange
        var usuario = Usuario.Crear("Luis Rojas", "luis@ejemplo.edu.pe", RolUsuario.Solicitante, activo: true, passwordHash: "hash-actual");
        _usuariosMock.Setup(r => r.ObtenerPorIdAsync(usuario.Id)).ReturnsAsync(usuario);
        _hasherMock.Setup(h => h.Verificar("MismaClave123", "hash-actual")).Returns(true);

        var servicio = CrearServicio();

        // Act
        var resultado = await servicio.CambiarContrasenaAsync(usuario.Id, "MismaClave123", "MismaClave123");

        // Assert
        Assert.False(resultado.Exito);
        Assert.Equal("La nueva contraseña debe ser distinta de la actual.", resultado.Error);
    }

    [Fact]
    public async Task CambiarContrasena_DatosValidos_GuardaHashNuevo_LOGIN()
    {
        // Arrange
        var usuario = Usuario.Crear("Luis Rojas", "luis@ejemplo.edu.pe", RolUsuario.Solicitante, activo: true, passwordHash: "hash-viejo");
        _usuariosMock.Setup(r => r.ObtenerPorIdAsync(usuario.Id)).ReturnsAsync(usuario);
        _hasherMock.Setup(h => h.Verificar("ClaveVieja123", "hash-viejo")).Returns(true);
        _hasherMock.Setup(h => h.Hashear("NuevaClave2026")).Returns("hash-nuevo-generado");

        var servicio = CrearServicio();

        // Act
        var resultado = await servicio.CambiarContrasenaAsync(usuario.Id, "ClaveVieja123", "NuevaClave2026");

        // Assert
        Assert.True(resultado.Exito);
        Assert.Equal("hash-nuevo-generado", usuario.PasswordHash);
        _usuariosMock.Verify(r => r.ActualizarAsync(usuario), Times.Once);
    }
}

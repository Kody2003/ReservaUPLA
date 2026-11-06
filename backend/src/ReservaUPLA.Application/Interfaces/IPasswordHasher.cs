namespace ReservaUPLA.Application.Interfaces;

/// <summary>
/// Contrato para el hasheo y verificación segura de contraseñas.
/// Vive en Application para desacoplar la lógica de negocio del algoritmo criptográfico concreto.
/// // LOGIN
/// </summary>
public interface IPasswordHasher
{
    /// <summary>Genera un hash seguro con sal aleatoria a partir de la contraseña en texto plano.</summary>
    string Hashear(string contrasena);

    /// <summary>Comprueba en tiempo constante si la contraseña coincide con el hash almacenado.</summary>
    bool Verificar(string contrasena, string hashAlmacenado);
}

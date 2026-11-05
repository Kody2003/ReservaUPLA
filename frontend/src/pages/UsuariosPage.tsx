/**
 * UsuariosPage — Gestión de usuarios del sistema (RF-01).
 *
 * Adaptaciones (FASE 4):
 *   · Se agregó el campo opcional/obligatorio de Contraseña inicial para nuevos usuarios.
 *   · Validación didáctica de la contraseña (mínimo 8 caracteres, al menos una letra y un número).
 *   · El formulario de registro solo se muestra al Administrador (doble defensa: backend y frontend).
 */
import { useCallback, useState, type FormEvent } from "react";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { SelectInput } from "../components/ui/SelectInput";
import { TableList } from "../components/ui/TableList";
import { TextInput } from "../components/ui/TextInput";
import { useAuth } from "../contexts/AuthContext";
import { useCargarDatos } from "../hooks/useCargarDatos";
import { obtenerMensajeError } from "../services/apiClient";
import { usuariosService } from "../services/usuariosService";
import { ROLES } from "../types";
import type { Mensaje } from "../types";

const OPCIONES_ROL = ROLES.map((r) => ({ valor: r, texto: r }));
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UsuariosPage() {
  const { usuario: usuarioEnSesion } = useAuth();
  const esAdmin = usuarioEnSesion?.rol === "Administrador";

  const cargar = useCallback(() => usuariosService.listar(), []);
  const { datos: usuarios, cargando, error, recargar } = useCargarDatos(cargar);

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [rol, setRol] = useState("");
  const [activo, setActivo] = useState(true);
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  // Validación de contraseña
  const passValida = !contrasena || (contrasena.length >= 8 && /[a-zA-Z]/.test(contrasena) && /[0-9]/.test(contrasena));

  // RN-02: campos obligatorios
  const errores = {
    nombreCompleto: nombreCompleto.trim() ? "" : "Escribe el nombre completo.",
    correo: !correo.trim()
      ? "Escribe el correo."
      : FORMATO_CORREO.test(correo.trim()) ? "" : "Escribe un correo válido, por ejemplo nombre@ejemplo.edu.pe.",
    contrasena: !contrasena
      ? "Escribe una contraseña inicial para el usuario."
      : passValida
      ? ""
      : "La contraseña debe tener mínimo 8 caracteres, una letra y un número.",
    rol: rol ? "" : "Selecciona un rol.",
  };
  const hayErrores = Object.values(errores).some(Boolean);

  async function alEnviar(e: FormEvent) {
    e.preventDefault();
    setIntentado(true);
    setMensaje(null);
    if (hayErrores) return;

    setEnviando(true);
    try {
      await usuariosService.crear({
        nombreCompleto: nombreCompleto.trim(),
        correo: correo.trim(),
        rol,
        activo,
        contrasena: contrasena.trim(),
      });
      setMensaje({ tipo: "exito", texto: "Usuario registrado correctamente." });
      setNombreCompleto("");
      setCorreo("");
      setContrasena("");
      setRol("");
      setActivo(true);
      setIntentado(false);
      recargar();
    } catch (err) {
      setMensaje({ tipo: "error", texto: obtenerMensajeError(err) });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section>
      <h2>Usuarios</h2>

      {/* Formulario visible exclusivamente para el Administrador */}
      {esAdmin && (
        <form className="formulario" onSubmit={alEnviar} noValidate>
          <h3>Registrar usuario</h3>
          <TextInput
            etiqueta="Nombre completo"
            valor={nombreCompleto}
            onCambio={setNombreCompleto}
            error={intentado ? errores.nombreCompleto : ""}
            requerido
            maxLength={150}
          />
          <TextInput
            etiqueta="Correo"
            tipo="email"
            valor={correo}
            onCambio={setCorreo}
            error={intentado ? errores.correo : ""}
            requerido
            maxLength={150}
          />
          <TextInput
            etiqueta="Contraseña inicial"
            tipo="password"
            valor={contrasena}
            onCambio={setContrasena}
            error={intentado ? errores.contrasena : ""}
            requerido
            maxLength={100}
          />
          <p className="ayuda" style={{ marginTop: "-0.4rem" }}>
            Mínimo 8 caracteres, al menos una letra y un número.
          </p>

          <SelectInput
            etiqueta="Rol"
            valor={rol}
            onCambio={setRol}
            opciones={OPCIONES_ROL}
            textoVacio="Selecciona un rol"
            error={intentado ? errores.rol : ""}
            requerido
          />
          <label className="casilla">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            Usuario activo
          </label>

          <AlertMessage tipo={mensaje?.tipo ?? "info"} mensaje={mensaje?.texto ?? ""} onCerrar={() => setMensaje(null)} />
          <Button type="submit" disabled={enviando}>{enviando ? "Guardando..." : "Registrar usuario"}</Button>
        </form>
      )}

      <h3>Usuarios registrados</h3>
      <AlertMessage tipo="error" mensaje={error} />
      {cargando && <p>Cargando usuarios...</p>}
      {usuarios && (
        <TableList
          descripcion="Lista de usuarios registrados"
          filas={usuarios}
          obtenerClave={(u) => u.id}
          mensajeVacio="Todavía no hay usuarios. Registra el primero con el formulario."
          columnas={[
            { encabezado: "Nombre", render: (u) => u.nombreCompleto },
            { encabezado: "Correo", render: (u) => u.correo },
            { encabezado: "Rol", render: (u) => u.rol },
            { encabezado: "Activo", render: (u) => (u.activo ? "Sí" : "No") },
          ]}
        />
      )}
    </section>
  );
}

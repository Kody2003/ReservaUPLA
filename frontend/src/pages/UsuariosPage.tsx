import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { SelectInput } from "../components/ui/SelectInput";
import { TableList } from "../components/ui/TableList";
import { TextInput } from "../components/ui/TextInput";
import { useCargarDatos } from "../hooks/useCargarDatos";
import { obtenerMensajeError } from "../services/apiClient";
import { usuariosService } from "../services/usuariosService";
import { ROLES } from "../types";
import type { Mensaje } from "../types";

const OPCIONES_ROL = ROLES.map((r) => ({ valor: r, texto: r }));
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * RF-01: registro de usuarios y lista de usuarios registrados.
 * La página orquesta (estado, validación visual, llamada al servicio); los campos son componentes sin lógica.
 */
export function UsuariosPage() {
  const cargar = useCallback(() => usuariosService.listar(), []);
  const { datos: usuarios, cargando, error, recargar } = useCargarDatos(cargar);

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState("");
  const [activo, setActivo] = useState(true);
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  // RN-02: todos los campos son obligatorios (el backend vuelve a validar)
  const errores = {
    nombreCompleto: nombreCompleto.trim() ? "" : "Escribe el nombre completo.",
    correo: !correo.trim()
      ? "Escribe el correo."
      : FORMATO_CORREO.test(correo.trim()) ? "" : "Escribe un correo válido, por ejemplo nombre@upla.edu.pe.",
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
      await usuariosService.crear({ nombreCompleto: nombreCompleto.trim(), correo: correo.trim(), rol, activo });
      setMensaje({ tipo: "exito", texto: "Usuario registrado correctamente." });
      setNombreCompleto("");
      setCorreo("");
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

      <form className="formulario" onSubmit={alEnviar} noValidate>
        <h3>Registrar usuario</h3>
        <TextInput etiqueta="Nombre completo" valor={nombreCompleto} onCambio={setNombreCompleto}
          error={intentado ? errores.nombreCompleto : ""} requerido maxLength={150} />
        <TextInput etiqueta="Correo" tipo="email" valor={correo} onCambio={setCorreo}
          error={intentado ? errores.correo : ""} requerido maxLength={150} />
        <SelectInput etiqueta="Rol" valor={rol} onCambio={setRol} opciones={OPCIONES_ROL}
          textoVacio="Selecciona un rol" error={intentado ? errores.rol : ""} requerido />
        <label className="casilla">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          Usuario activo
        </label>

        <AlertMessage tipo={mensaje?.tipo ?? "info"} mensaje={mensaje?.texto ?? ""} onCerrar={() => setMensaje(null)} />
        <Button type="submit" disabled={enviando}>{enviando ? "Guardando..." : "Registrar usuario"}</Button>
      </form>

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

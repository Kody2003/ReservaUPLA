/**
 * UsuariosPage — Gestión de cuentas de usuario del sistema (RF-01).
 *
 * Características del rediseño:
 *   · Solo accesible para el Administrador (controlado por RutaProtegida y token JWT).
 *   · Esquema de 2 columnas:
 *       - Columna izquierda: "Registrar usuario" (nombre, correo, contraseña inicial con "Mostrar/Ocultar", rol, activo).
 *       - Columna derecha: "Usuarios registrados" con buscador de texto (nombre/correo), filtro por rol y tabla.
 *   · Roles representados con etiquetas visuales distintivas (Administrador, Solicitante, Responsable de ambiente).
 *   · Estado de cuenta Activo / Inactivo con etiqueta de color (verde / gris) y texto explícito.
 *   · Un único botón de envío ("Registrar usuario").
 *   · Máxima seguridad: las contraseñas y hashes NUNCA se exponen ni se muestran en la tabla.
 */
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { SelectInput } from "../components/ui/SelectInput";
import { TableList } from "../components/ui/TableList";
import { TextInput } from "../components/ui/TextInput";
import { useCargarDatos } from "../hooks/useCargarDatos";
import { obtenerMensajeError } from "../services/apiClient";
import { usuariosService } from "../services/usuariosService";
import { ROLES, type RolUsuario, type Usuario, type Mensaje } from "../types";

const OPCIONES_ROL = ROLES.map((r) => ({ valor: r, texto: r }));
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Ícono de lupa para el buscador. */
function IconoLupa() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/** Etiqueta de rol con estilo visual institucional. */
function RolBadge({ rol }: { rol: RolUsuario }) {
  if (rol === "Administrador") {
    return <span className="badge-rol-admin">Administrador</span>;
  }
  if (rol === "ResponsableAmbiente") {
    return <span className="badge-rol-resp">Responsable de ambiente</span>;
  }
  return <span className="badge-rol-sol">Solicitante</span>;
}

/** Etiqueta de estado activo/inactivo con color y texto. */
function EstadoCuentaBadge({ activo }: { activo: boolean }) {
  if (activo) {
    return (
      <span className="badge-activo">
        <span aria-hidden="true">●</span> Activo
      </span>
    );
  }
  return (
    <span className="badge-inactivo">
      <span aria-hidden="true">●</span> Inactivo
    </span>
  );
}

export function UsuariosPage() {
  const cargar = useCallback(() => usuariosService.listar(), []);
  const { datos: usuarios, cargando, error, recargar } = useCargarDatos(cargar);

  // --- Campos del formulario ---
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verPass, setVerPass] = useState(false);
  const [rol, setRol] = useState("");
  const [activo, setActivo] = useState(true);

  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  // --- Filtros de la tabla ---
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");

  // Validación de seguridad de la contraseña inicial
  const passValida = !contrasena || (contrasena.length >= 8 && /[a-zA-Z]/.test(contrasena) && /[0-9]/.test(contrasena));

  // RN-02: campos obligatorios
  const errores = {
    nombreCompleto: nombreCompleto.trim() ? "" : "Escribe el nombre completo.",
    correo: !correo.trim()
      ? "Escribe el correo."
      : FORMATO_CORREO.test(correo.trim())
      ? ""
      : "Escribe un correo válido, por ejemplo nombre@ejemplo.edu.pe.",
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

  // Filtrado de usuarios por texto y rol
  const usuariosFiltrados = useMemo(() => {
    if (!usuarios) return [];
    return usuarios.filter((u) => {
      const q = busqueda.trim().toLowerCase();
      const coincideTexto =
        !q ||
        u.nombreCompleto.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q);

      const coincideRol = !filtroRol || u.rol === filtroRol;
      return coincideTexto && coincideRol;
    });
  }, [usuarios, busqueda, filtroRol]);

  return (
    <section>
      <div className="titulo-fila">
        <h2>Gestión de usuarios</h2>
      </div>

      <AlertMessage tipo="error" mensaje={error} />
      <AlertMessage
        tipo={mensaje?.tipo ?? "info"}
        mensaje={mensaje?.texto ?? ""}
        onCerrar={() => setMensaje(null)}
      />

      {/* Disposición de 2 columnas para el Administrador */}
      <div className="layout-dos-columnas">
        {/* Columna Izquierda: Formulario de registro */}
        <div className="panel-tarjeta">
          <h3 className="panel-tarjeta-titulo">Registrar usuario</h3>
          <form onSubmit={alEnviar} noValidate style={{ display: "grid", gap: "0.85rem" }}>
            <TextInput
              etiqueta="Nombre completo"
              valor={nombreCompleto}
              onCambio={setNombreCompleto}
              error={intentado ? errores.nombreCompleto : ""}
              requerido
              maxLength={150}
              placeholder="Ej. María Sánchez Romero"
            />
            <TextInput
              etiqueta="Correo electrónico"
              tipo="email"
              valor={correo}
              onCambio={setCorreo}
              error={intentado ? errores.correo : ""}
              requerido
              maxLength={150}
              placeholder="Ej. maria.sanchez@ejemplo.edu.pe"
            />

            {/* Campo Contraseña inicial con botón Mostrar / Ocultar */}
            <div className={`campo${intentado && errores.contrasena ? " campo-con-error" : ""}`}>
              <label htmlFor="usr-contrasena" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Contraseña inicial <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <div className="campo-password">
                <input
                  id="usr-contrasena"
                  type={verPass ? "text" : "password"}
                  autoComplete="new-password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  disabled={enviando}
                  placeholder="Mínimo 8 caracteres, letra y número"
                  aria-describedby={intentado && errores.contrasena ? "err-usr-pass" : undefined}
                />
                <button
                  type="button"
                  className="login-btn-mostrar"
                  aria-pressed={verPass}
                  aria-label={verPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setVerPass((v) => !v)}
                >
                  {verPass ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {intentado && errores.contrasena && (
                <p id="err-usr-pass" className="campo-error" role="alert">
                  {errores.contrasena}
                </p>
              )}
            </div>

            <SelectInput
              etiqueta="Rol institucional"
              valor={rol}
              onCambio={setRol}
              opciones={OPCIONES_ROL}
              textoVacio="Selecciona un rol"
              error={intentado ? errores.rol : ""}
              requerido
            />

            <label className="casilla" style={{ marginTop: "0.2rem" }}>
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
              <span>Cuenta activa</span>
            </label>

            <div style={{ marginTop: "0.5rem" }}>
              {/* UN SOLO BOTÓN DE ENVÍO */}
              <Button type="submit" disabled={enviando} style={{ width: "100%" }}>
                {enviando ? "Guardando usuario..." : "Registrar usuario"}
              </Button>
            </div>
          </form>
        </div>

        {/* Columna Derecha: Usuarios registrados con buscador y filtro */}
        <div className="panel-tarjeta">
          <h3 className="panel-tarjeta-titulo">Usuarios registrados</h3>

          {/* Barra de herramientas: buscador y selector de rol */}
          <div className="barra-herramientas-tabla">
            <div className="input-busqueda-wrapper">
              <span className="input-busqueda-icono" aria-hidden="true">
                <IconoLupa />
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar usuarios"
              />
            </div>

            <div style={{ minWidth: "180px" }}>
              <select
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                aria-label="Filtrar por rol"
                style={{ height: "40px", borderRadius: "8px" }}
              >
                <option value="">Todos los roles</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {(busqueda || filtroRol) && (
              <Button
                variante="secundario"
                onClick={() => {
                  setBusqueda("");
                  setFiltroRol("");
                }}
              >
                Limpiar
              </Button>
            )}
          </div>

          {cargando && <p>Cargando usuarios...</p>}

          {usuarios && (
            <TableList
              descripcion="Lista de usuarios registrados en el sistema"
              filas={usuariosFiltrados}
              obtenerClave={(u: Usuario) => u.id}
              mensajeVacio={
                busqueda || filtroRol
                  ? "Ningún usuario coincide con los criterios de búsqueda."
                  : "Todavía no hay usuarios registrados en el sistema."
              }
              columnas={[
                { encabezado: "Nombre", render: (u: Usuario) => <strong>{u.nombreCompleto}</strong> },
                { encabezado: "Correo institucional", render: (u: Usuario) => u.correo },
                { encabezado: "Rol", render: (u: Usuario) => <RolBadge rol={u.rol} /> },
                { encabezado: "Estado", render: (u: Usuario) => <EstadoCuentaBadge activo={u.activo} /> },
              ]}
            />
          )}
        </div>
      </div>
    </section>
  );
}

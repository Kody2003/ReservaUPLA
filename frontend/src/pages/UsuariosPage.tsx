/**
 * UsuariosPage — Gestión de cuentas de usuario del sistema (RF-01, BLOQUE 1 y BLOQUE 2).
 *
 * Características:
 *   · Formulario unificado con Campo.tsx e Icono.tsx (usuario, correo, candado, filtro).
 *   · Contraseña inicial con botón Mostrar/Ocultar y validación de seguridad.
 *   · Validación didáctica: errores visibles solo al interactuar (onBlur) o enviar (submit).
 *   · Botón único de registro con ícono (+).
 *   · Tabla con buscador en tiempo real, selector de rol y badges de estado y roles.
 */
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { Campo } from "../components/ui/Campo";
import { Icono } from "../components/ui/Icono";
import { TableList } from "../components/ui/TableList";
import { useCargarDatos } from "../hooks/useCargarDatos";
import { obtenerMensajeError } from "../services/apiClient";
import { usuariosService } from "../services/usuariosService";
import { ROLES, formatearRol, type RolUsuario, type Usuario, type Mensaje } from "../types";

const OPCIONES_ROL = ROLES.map((r) => ({ valor: r, texto: formatearRol(r) }));
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  // Control de interacción y errores (BLOQUE 1)
  const [tocado, setTocado] = useState<Record<string, boolean>>({});
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  // --- Filtros de la tabla ---
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");

  function marcarTocado(campo: string) {
    setTocado((prev) => ({ ...prev, [campo]: true }));
  }

  // Validación de contraseña
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

  const verError = (campo: keyof typeof errores) => {
    return intentado || tocado[campo] ? errores[campo] ?? "" : "";
  };

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
      setTocado({});
      recargar();
    } catch (err) {
      setMensaje({ tipo: "error", texto: obtenerMensajeError(err) });
    } finally {
      setEnviando(false);
    }
  }

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
        <h2>
          <Icono nombre="usuario" tamano={22} style={{ marginRight: "0.5rem", verticalAlign: "middle", color: "var(--primario)" }} />
          Gestión de usuarios
        </h2>
      </div>

      <AlertMessage tipo="error" mensaje={error} />
      <AlertMessage
        tipo={mensaje?.tipo ?? "info"}
        mensaje={mensaje?.texto ?? ""}
        onCerrar={() => setMensaje(null)}
      />

      <div className="layout-dos-columnas">
        {/* Columna Izquierda: Formulario de registro */}
        <div className="panel-tarjeta">
          <h3 className="panel-tarjeta-titulo">
            <Icono nombre="mas" tamano={17} style={{ marginRight: "0.4rem", verticalAlign: "middle" }} />
            Registrar usuario
          </h3>
          <form onSubmit={alEnviar} noValidate style={{ display: "grid", gap: "0.85rem" }}>
            <Campo
              etiqueta="Nombre completo"
              valor={nombreCompleto}
              onCambio={(v) => {
                setNombreCompleto(v);
                marcarTocado("nombreCompleto");
              }}
              onBlur={() => marcarTocado("nombreCompleto")}
              error={verError("nombreCompleto")}
              placeholder="Ej. María Sánchez Romero"
              maxLength={150}
              requerido
            />

            <Campo
              etiqueta="Correo institucional"
              tipo="email"
              valor={correo}
              onCambio={(v) => {
                setCorreo(v);
                marcarTocado("correo");
              }}
              onBlur={() => marcarTocado("correo")}
              error={verError("correo")}
              placeholder="Ej. maria.sanchez@ejemplo.edu.pe"
              maxLength={150}
              requerido
            />

            <Campo
              etiqueta="Contraseña inicial"
              tipo={verPass ? "text" : "password"}
              valor={contrasena}
              onCambio={(v) => {
                setContrasena(v);
                marcarTocado("contrasena");
              }}
              onBlur={() => marcarTocado("contrasena")}
              error={verError("contrasena")}
              placeholder="Mínimo 8 caracteres, letra y número"
              accionDerecha={
                <button
                  type="button"
                  className="login-btn-mostrar"
                  aria-pressed={verPass}
                  aria-label={verPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  title={verPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setVerPass((v) => !v)}
                >
                  <Icono nombre={verPass ? "ojo-tachado" : "ojo"} tamano={18} />
                </button>
              }
              requerido
            />

            <Campo
              etiqueta="Rol institucional"
              tipo="select"
              valor={rol}
              onCambio={(v) => {
                setRol(v);
                marcarTocado("rol");
              }}
              onBlur={() => marcarTocado("rol")}
              opciones={OPCIONES_ROL}
              textoVacio="Selecciona un rol"
              error={verError("rol")}
              requerido
            />

            <label className="casilla" style={{ marginTop: "0.2rem" }}>
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
              <span>Cuenta activa</span>
            </label>

            <div style={{ marginTop: "0.5rem" }}>
              <Button type="submit" disabled={enviando} style={{ width: "100%" }}>
                {enviando ? "Guardando usuario..." : "Registrar usuario"}
              </Button>
            </div>
          </form>
        </div>

        {/* Columna Derecha: Usuarios registrados */}
        <div className="panel-tarjeta">
          <h3 className="panel-tarjeta-titulo">
            <Icono nombre="usuario" tamano={17} style={{ marginRight: "0.4rem", verticalAlign: "middle" }} />
            Usuarios registrados
          </h3>

          <div className="barra-herramientas-tabla">
            <div className="input-busqueda-wrapper">
              <span className="input-busqueda-icono" aria-hidden="true">
                <Icono nombre="lupa" />
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
                    {formatearRol(r)}
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

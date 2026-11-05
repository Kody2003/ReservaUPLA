/**
 * LoginPage — Pantalla de inicio de sesión (AJUSTE A: Rediseño de campos).
 *
 * Características del formulario:
 *  - Etiquetas en negrita con asterisco rojo de obligatorio ("Correo electrónico *", "Contraseña *").
 *  - Cajas redondeadas (radio ~12px, altura ~48px) con fondo --superficie y borde --borde.
 *  - Íconos interiores a la izquierda: sobre para correo y candado para contraseña (SVG inline con aria-hidden).
 *  - Placeholders suaves: "Ingrese su correo institucional" e "Ingrese su contraseña".
 *  - Botón interactivo de texto "Mostrar" / "Ocultar" a la derecha de la contraseña en color --primario y negrita.
 *  - Anillo de foco accesible al enfocar cada campo.
 *  - Validación didáctica: error visual al perder el foco (onBlur) o al enviar (submit) estando vacío ("Campo obligatorio"),
 *    o si el formato de correo no es válido ("Ingrese un correo válido"). Sin errores al cargar.
 *  - Accesibilidad: aria-describedby hacia los mensajes de error y aria-invalid en los inputs.
 *  - Compatibilidad total con modo claro y oscuro (variables CSS) con contraste WCAG AA.
 *  - Conserva chips demo (autocompletado visual con puntos "••••••••"), error genérico y redirección por rol.
 */
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Icono } from "../components/ui/Icono";
import { login, loginDemo, AuthError } from "../services/authService";
import type { LoginRespuesta } from "../types";

/** Correos de los usuarios de demostración precargados en base de datos. */
const CORREOS_DEMO: Record<string, string> = {
  Administrador: "marta.quispe@ejemplo.edu.pe",
  Solicitante: "ana.torres@ejemplo.edu.pe",
  ResponsableAmbiente: "carlos.huaman@ejemplo.edu.pe",
  Inactivo: "pedro.salas@ejemplo.edu.pe",
};

/** Puntos decorativos para el autocompletado visual en modo demo. */
const PUNTOS_DECORATIVOS = "••••••••";

/** Ícono de sobre / correo (SVG inline). */
function IconoSobre() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

/** Ícono de candado (SVG inline). */
function IconoCandado() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();

  // --- Campos del formulario ---
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verPass, setVerPass] = useState(false);

  // --- Errores por campo ---
  const [errorCorreo, setErrorCorreo] = useState("");
  const [errorContrasena, setErrorContrasena] = useState("");

  // --- Estado de envío ---
  const [cargando, setCargando] = useState(false);
  const [errorGral, setErrorGral] = useState("");

  // Referencias para foco accesible
  const refCorreo = useRef<HTMLInputElement>(null);
  const refContrasena = useRef<HTMLInputElement>(null);

  // Mensaje de sesión expirada
  useEffect(() => {
    try {
      const msg = sessionStorage.getItem("reservaupla.mensajeLogin");
      if (msg) {
        setErrorGral(msg);
        sessionStorage.removeItem("reservaupla.mensajeLogin");
      }
    } catch { /* nada */ }
  }, []);

  /** Redirige según el rol tras login exitoso. */
  function redirigirSegunRol(resp: LoginRespuesta) {
    iniciarSesion(resp);
    if (resp.rol === "Administrador") {
      navigate("/", { replace: true });
    } else {
      navigate("/reservas", { replace: true });
    }
  }

  /** Regla de validación del correo: vacío -> "Campo obligatorio", inválido -> "Ingrese un correo válido". */
  function validarFormatoCorreo(valor: string): string {
    if (!valor.trim()) return "Campo obligatorio";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())) {
      return "Ingrese un correo válido";
    }
    return "";
  }

  /** Regla de validación de la contraseña: vacía -> "Campo obligatorio". */
  function validarFormatoContrasena(valor: string): string {
    if (!valor) return "Campo obligatorio";
    return "";
  }

  /** Validación al perder el foco (onBlur). */
  function handleBlurCorreo() {
    setErrorCorreo(validarFormatoCorreo(correo));
  }

  function handleBlurContrasena() {
    setErrorContrasena(validarFormatoContrasena(contrasena));
  }

  /** Valida el formulario antes del envío manual. */
  function validarFormulario(): boolean {
    const errC = validarFormatoCorreo(correo);
    const errP = validarFormatoContrasena(contrasena);

    setErrorCorreo(errC);
    setErrorContrasena(errP);

    if (errC) {
      refCorreo.current?.focus();
      return false;
    }
    if (errP) {
      refContrasena.current?.focus();
      return false;
    }
    return true;
  }

  /** Envío manual con credenciales escritas por el usuario. */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorGral("");
    if (!validarFormulario()) return;

    setCargando(true);
    try {
      const resp = await login({ correo: correo.trim(), contrasena });
      redirigirSegunRol(resp);
    } catch (err) {
      if (err instanceof AuthError) {
        setErrorGral(err.message);
      } else {
        setErrorGral("Ocurrió un error inesperado. Intenta de nuevo.");
      }
    } finally {
      setCargando(false);
    }
  }

  /**
   * Acceso de demostración con chips:
   * Rellena visualmente correo y contraseña decorativa ("••••••••"), luego llama a demo.
   * // LOGIN // DEMO
   */
  async function handleChipDemo(rol: string) {
    setErrorGral("");
    setErrorCorreo("");
    setErrorContrasena("");

    setCorreo(CORREOS_DEMO[rol] ?? "");
    setContrasena(PUNTOS_DECORATIVOS);

    setCargando(true);
    try {
      const resp = await loginDemo(rol);
      redirigirSegunRol(resp);
    } catch (err) {
      if (err instanceof AuthError) {
        setErrorGral(err.message);
      } else {
        setErrorGral("No se pudo acceder en modo demo. Intenta de nuevo.");
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-pagina">
      {/* ── Panel izquierdo decorativo ── */}
      <aside className="login-izquierda" aria-hidden="true">
        <div className="login-foto" />
        <div className="login-overlay">
          <div className="login-marca-izq">
            <img
              src="/img/upla-logo.png"
              alt="Logo UPLA"
              className="login-logo-img"
            />
            <span className="login-nombre-app">ReservaUPLA</span>
          </div>

          <div className="login-bienvenida">
            <p className="login-bienvenida-label">Bienvenido a:</p>
            <h1 className="login-bienvenida-titulo">ReservaUPLA.</h1>
            <p className="login-bienvenida-sub">
              Sistema de reserva de ambientes académicos de la Universidad Peruana Los Andes.
            </p>
          </div>

          <p className="login-pie-izq">
            Proyecto académico · Construcción de Software · 2026
          </p>
        </div>
      </aside>

      {/* ── Panel derecho: formulario ── */}
      <main className="login-derecha">
        <div className="login-form-contenedor">

          {/* Logo visible solo en móvil (< 900 px) */}
          <div className="login-logo-movil" aria-hidden="true">
            <img src="/img/upla-logo.png" alt="Logo UPLA" />
            <span>ReservaUPLA</span>
          </div>

          <p className="login-titulo-panel">Bienvenido</p>
          <h2 className="login-subtitulo-panel">Iniciar sesión</h2>
          <p className="login-desc-panel">
            Ingresa tus credenciales institucionales para continuar.
          </p>

          {/* Alerta general del servidor */}
          {errorGral && (
            <div className="alerta alerta-error" role="alert" style={{ marginBottom: "1.25rem" }}>
              <span>{errorGral}</span>
              <button className="alerta-cerrar" onClick={() => setErrorGral("")} aria-label="Cerrar">×</button>
            </div>
          )}

          {/* Formulario de login con campos rediseñados (AJUSTE A) */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Campo Correo electrónico */}
            <div className="login-campo-grupo">
              <label htmlFor="correo" className="login-campo-label">
                Correo electrónico <span className="login-asterisco" aria-hidden="true">*</span>
              </label>
              <div className={`login-input-caja ${errorCorreo ? "con-error" : ""}`}>
                <span className="login-input-icono" aria-hidden="true">
                  <IconoSobre />
                </span>
                <input
                  id="correo"
                  ref={refCorreo}
                  type="email"
                  autoComplete="username"
                  placeholder="Ingrese su correo institucional"
                  className="login-input-campo"
                  value={correo}
                  onChange={(e) => {
                    setCorreo(e.target.value);
                    if (errorCorreo) setErrorCorreo(validarFormatoCorreo(e.target.value));
                  }}
                  onBlur={handleBlurCorreo}
                  disabled={cargando}
                  aria-describedby={errorCorreo ? "error-correo" : undefined}
                  aria-invalid={Boolean(errorCorreo)}
                />
              </div>
              {errorCorreo && (
                <p id="error-correo" className="login-error-texto" role="alert">
                  {errorCorreo}
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div className="login-campo-grupo" style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="contrasena" className="login-campo-label">
                Contraseña <span className="login-asterisco" aria-hidden="true">*</span>
              </label>
              <div className={`login-input-caja ${errorContrasena ? "con-error" : ""}`}>
                <span className="login-input-icono" aria-hidden="true">
                  <IconoCandado />
                </span>
                <input
                  id="contrasena"
                  ref={refContrasena}
                  type={verPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Ingrese su contraseña"
                  className="login-input-campo"
                  value={contrasena}
                  onChange={(e) => {
                    setContrasena(e.target.value);
                    if (errorContrasena) setErrorContrasena(validarFormatoContrasena(e.target.value));
                  }}
                  onBlur={handleBlurContrasena}
                  disabled={cargando}
                  aria-describedby={errorContrasena ? "error-contrasena" : undefined}
                  aria-invalid={Boolean(errorContrasena)}
                />
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
              </div>
              {errorContrasena && (
                <p id="error-contrasena" className="login-error-texto" role="alert">
                  {errorContrasena}
                </p>
              )}
            </div>

            {/* Botón de ingreso */}
            <button
              type="submit"
              className="btn btn-primario btn-login"
              disabled={cargando}
            >
              {cargando ? "Ingresando…" : "Ingresar"}
            </button>
          </form>

          {/* Chips demo (solo en desarrollo) // LOGIN // DEMO */}
          {import.meta.env.DEV && (
            <div className="demo-bloque">
              <p className="demo-titulo">Acceso rápido de demostración</p>
              <div className="demo-botones">
                {(
                  [
                    { rol: "Administrador", label: "Administrador" },
                    { rol: "Solicitante", label: "Solicitante" },
                    { rol: "ResponsableAmbiente", label: "Responsable de ambiente" },
                    { rol: "Inactivo", label: "Usuario inactivo" },
                  ] as const
                ).map(({ rol, label }) => (
                  <button
                    key={rol}
                    type="button"
                    className="btn-demo"
                    disabled={cargando}
                    onClick={() => handleChipDemo(rol)}
                    title={`Autocompleta con ${CORREOS_DEMO[rol]} y accede como ${label}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

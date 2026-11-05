/**
 * LoginPage — Pantalla de inicio de sesión (FASE 3 — LOGIN).
 *
 * Diseño de dos paneles:
 *   · Izquierdo (decorativo): foto del campus de la UPLA con overlay azul,
 *     logo, título y pie académico.
 *   · Derecho (funcional): formulario de login + acceso de demostración.
 *
 * Características:
 *   - Validación de cliente antes de enviar (correo requerido y válido,
 *     contraseña requerida). Los errores aparecen junto al campo.  // RN-02
 *   - Toggle mostrar/ocultar contraseña con aria-pressed.
 *   - Bloque demo solo visible en Vite dev (import.meta.env.DEV).
 *     La contraseña NUNCA viaja al frontend; el backend crea el token
 *     sin exponer credenciales.  // LOGIN
 *   - Tras login exitoso: Administrador → "/" ; otros → "/reservas".
 *   - En pantallas < 900 px el panel izquierdo se oculta y aparece el
 *     logo encima del formulario.
 *   - Muestra el mensaje "Tu sesión expiró…" si lo dejó apiClient en sessionStorage.
 */
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { login, loginDemo, AuthError } from "../services/authService";
import type { LoginRespuesta } from "../types";

/** Icono de ojo abierto (SVG inline) para el toggle de contraseña. */
function IconoOjo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

/** Icono de ojo tachado para indicar "ocultar contraseña". */
function IconoOjoCerrado() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export function LoginPage() {
  const navigate     = useNavigate();
  const { iniciarSesion } = useAuth();

  // --- Campos del formulario ---
  const [correo,     setCorreo]     = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verPass,    setVerPass]    = useState(false);

  // --- Errores de validación por campo ---
  const [errorCorreo,     setErrorCorreo]     = useState("");
  const [errorContrasena, setErrorContrasena] = useState("");

  // --- Estado de envío ---
  const [cargando,  setCargando]  = useState(false);
  const [errorGral, setErrorGral] = useState("");

  // Referencia para enfocar el primer campo con error
  const refCorreo     = useRef<HTMLInputElement>(null);
  const refContrasena = useRef<HTMLInputElement>(null);

  // Muestra el mensaje de sesión expirada que dejó apiClient
  useEffect(() => {
    try {
      const msg = sessionStorage.getItem("reservaupla.mensajeLogin");
      if (msg) {
        setErrorGral(msg);
        sessionStorage.removeItem("reservaupla.mensajeLogin");
      }
    } catch { /* nada */ }
  }, []);

  /** Redirige según el rol del usuario recién autenticado. */
  function redirigirSegunRol(resp: LoginRespuesta) {
    iniciarSesion(resp);
    if (resp.rol === "Administrador") {
      navigate("/", { replace: true });
    } else {
      navigate("/reservas", { replace: true });
    }
  }

  /** Valida los campos y retorna true si no hay errores. */
  function validar(): boolean {
    let ok = true;
    setErrorCorreo("");
    setErrorContrasena("");

    if (!correo.trim()) {
      setErrorCorreo("El correo es obligatorio.");  // RN-02
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setErrorCorreo("Ingresa un correo electrónico válido.");
      ok = false;
    }

    if (!contrasena) {
      setErrorContrasena("La contraseña es obligatoria.");  // RN-02
      ok = false;
    }

    if (!ok) {
      // Enfoca el primer campo con error para accesibilidad
      if (errorCorreo || !correo.trim()) refCorreo.current?.focus();
      else refContrasena.current?.focus();
    }
    return ok;
  }

  /** Maneja el envío del formulario de login. */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorGral("");
    if (!validar()) return;

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
   * Acceso de demostración: llama a POST /api/auth/demo con el rol.
   * Solo disponible en desarrollo (import.meta.env.DEV).
   * La contraseña NUNCA viaja al frontend; el backend la maneja internamente.
   * // LOGIN
   */
  async function handleDemo(rol: string) {
    setErrorGral("");
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
          {/* Logo + nombre de la app */}
          <div className="login-marca-izq">
            <img
              src="/img/upla-logo.png"
              alt="Logo UPLA"
              className="login-logo-img"
            />
            <span className="login-nombre-app">ReservaUPLA</span>
          </div>

          {/* Título central */}
          <div className="login-bienvenida">
            <p className="login-bienvenida-label">Bienvenido a:</p>
            <h1 className="login-bienvenida-titulo">ReservaUPLA.</h1>
            <p className="login-bienvenida-sub">
              Sistema de reserva de ambientes académicos de la Universidad Peruana Los Andes.
            </p>
          </div>

          {/* Pie de página académico */}
          <p className="login-pie-izq">
            Proyecto académico · Construcción de Software · 2026
          </p>
        </div>
      </aside>

      {/* ── Panel derecho: formulario ── */}
      <main className="login-derecha">
        <div className="login-form-contenedor">

          {/* Logo visible solo en móvil (< 900 px) cuando el panel izquierdo se oculta */}
          <div className="login-logo-movil" aria-hidden="true">
            <img src="/img/upla-logo.png" alt="Logo UPLA" />
            <span>ReservaUPLA</span>
          </div>

          {/* Encabezado del formulario */}
          <p className="login-titulo-panel">Bienvenido</p>
          <h2 className="login-subtitulo-panel">Iniciar sesión</h2>
          <p className="login-desc-panel">
            Ingresa tus credenciales institucionales para continuar.
          </p>

          {/* Mensaje de error global (sesión expirada, credenciales incorrectas, etc.) */}
          {errorGral && (
            <div className="alerta alerta-error" role="alert">
              <span>{errorGral}</span>
              <button className="alerta-cerrar" onClick={() => setErrorGral("")} aria-label="Cerrar">×</button>
            </div>
          )}

          {/* Formulario de login */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Campo correo */}
            <div className={`campo${errorCorreo ? " campo-con-error" : ""}`} style={{ marginBottom: "0.75rem" }}>
              <label htmlFor="correo">Correo electrónico</label>
              <input
                id="correo"
                ref={refCorreo}
                type="email"
                autoComplete="username"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                disabled={cargando}
                placeholder="tu.correo@upla.edu.pe"
                aria-describedby={errorCorreo ? "error-correo" : undefined}
                aria-invalid={!!errorCorreo}
              />
              {errorCorreo && (
                <p id="error-correo" className="campo-error" role="alert">{errorCorreo}</p>
              )}
            </div>

            {/* Campo contraseña con toggle ver/ocultar */}
            <div className={`campo${errorContrasena ? " campo-con-error" : ""}`} style={{ marginBottom: "1.25rem" }}>
              <label htmlFor="contrasena">Contraseña</label>
              <div className="campo-password">
                <input
                  id="contrasena"
                  ref={refContrasena}
                  type={verPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  disabled={cargando}
                  aria-describedby={errorContrasena ? "error-contrasena" : undefined}
                  aria-invalid={!!errorContrasena}
                />
                {/* Botón toggle: no envía el formulario (type="button") */}
                <button
                  type="button"
                  className="btn-toggle-pass"
                  aria-pressed={verPass}
                  aria-label={verPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setVerPass((v) => !v)}
                >
                  {verPass ? <IconoOjoCerrado /> : <IconoOjo />}
                </button>
              </div>
              {errorContrasena && (
                <p id="error-contrasena" className="campo-error" role="alert">{errorContrasena}</p>
              )}
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              className="btn btn-primario btn-login"
              disabled={cargando}
            >
              {cargando ? "Ingresando…" : "Ingresar"}
            </button>
          </form>

          {/* ── Bloque de acceso demo (solo en desarrollo) ── // LOGIN */}
          {import.meta.env.DEV && (
            <div className="demo-bloque">
              <p className="demo-titulo">Acceso de demostración</p>
              {/*
                Por qué esto es seguro:
                  - La contraseña NUNCA viaja al frontend.
                  - El endpoint POST /api/auth/demo no existe en producción
                    (el controlador solo se registra si IsDevelopment()).
                  - El token generado tiene la misma expiración corta (60 min)
                    que un login normal.
              */}
              <div className="demo-botones">
                {(
                  [
                    { rol: "Administrador",        label: "Administrador" },
                    { rol: "Solicitante",           label: "Solicitante" },
                    { rol: "ResponsableAmbiente",   label: "Resp. de ambiente" },
                    { rol: "Inactivo",              label: "Usuario inactivo" },
                  ] as const
                ).map(({ rol, label }) => (
                  <button
                    key={rol}
                    type="button"
                    className="btn-demo"
                    disabled={cargando}
                    onClick={() => handleDemo(rol)}
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

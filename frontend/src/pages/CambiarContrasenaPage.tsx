/**
 * CambiarContrasenaPage — Cambio de contraseña del usuario autenticado (FASE 4).
 *
 * Características:
 *  - 3 campos protegidos: Contraseña actual, Nueva contraseña y Confirmar nueva contraseña.
 *  - Botón individual de mostrar/ocultar contraseña con aria-pressed e icono SVG en cada campo.
 *  - Lista de verificación visual en tiempo real para los requisitos de seguridad:
 *      · Mínimo 8 caracteres.
 *      · Al menos una letra.
 *      · Al menos un número.
 *      · Distinta de la contraseña actual.
 *  - Validación de cliente antes del envío (RN-02 y coincidencia de confirmación).
 *  - Llamada a PATCH /api/auth/contrasena con cuerpo { actual, nueva } (coincide con AuthController).
 *  - Al tener éxito: muestra alerta de confirmación, limpia los campos y mantiene la sesión activa.
 */
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { cambiarContrasena } from "../services/authService";
import { obtenerMensajeError } from "../services/apiClient";
import type { Mensaje } from "../types";

/** Icono de ojo para toggle de visualización. */
function IconoOjo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Icono de ojo cerrado para ocultar contraseña. */
function IconoOjoCerrado() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/** Icono de check verde o equis para los requisitos. */
function IconoCheck({ cumplido }: { cumplido: boolean }) {
  return (
    <span style={{ color: cumplido ? "var(--ok)" : "var(--texto-suave)", fontWeight: 700, marginRight: "0.4rem" }}>
      {cumplido ? "✓" : "○"}
    </span>
  );
}

export function CambiarContrasenaPage() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  // Validación reactiva de reglas de contraseña
  const tieneMinimo8 = nueva.length >= 8;
  const tieneLetra = /[a-zA-Z]/.test(nueva);
  const tieneNumero = /[0-9]/.test(nueva);
  const esDistinta = Boolean(nueva && actual && nueva !== actual);
  const coinciden = Boolean(nueva && confirmar && nueva === confirmar);

  // Errores de validación previa
  const errores = {
    actual: actual ? "" : "Escribe tu contraseña actual.",
    nueva: !nueva
      ? "Escribe la nueva contraseña."
      : tieneMinimo8 && tieneLetra && tieneNumero
      ? ""
      : "La nueva contraseña debe cumplir con todos los requisitos de seguridad.",
    confirmar: !confirmar
      ? "Confirma la nueva contraseña."
      : coinciden
      ? ""
      : "Las contraseñas no coinciden.",
  };

  const hayErrores = Object.values(errores).some(Boolean);

  async function alEnviar(e: FormEvent) {
    e.preventDefault();
    setIntentado(true);
    setMensaje(null);

    if (hayErrores) return;

    if (actual === nueva) {
      setMensaje({
        tipo: "error",
        texto: "La nueva contraseña debe ser distinta de la actual.",
      });
      return;
    }

    setEnviando(true);
    try {
      // PATCH /api/auth/contrasena con cuerpo { actual, nueva } // LOGIN
      await cambiarContrasena({ actual, nueva });
      setMensaje({
        tipo: "exito",
        texto: "Contraseña actualizada correctamente. Tu sesión continúa activa.",
      });
      setActual("");
      setNueva("");
      setConfirmar("");
      setIntentado(false);
    } catch (err) {
      setMensaje({
        tipo: "error",
        texto: obtenerMensajeError(err),
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section>
      <div className="titulo-fila">
        <h2>Cambiar contraseña</h2>
        <Link to="/">Volver al inicio</Link>
      </div>

      <AlertMessage
        tipo={mensaje?.tipo ?? "info"}
        mensaje={mensaje?.texto ?? ""}
        onCerrar={() => setMensaje(null)}
      />

      <form className="formulario" onSubmit={alEnviar} noValidate style={{ maxWidth: 540 }}>
        <h3>Actualización de credenciales</h3>
        <p className="ayuda">
          Por seguridad, tu nueva contraseña debe tener al menos 8 caracteres y combinar letras y números.
        </p>

        {/* Campo 1: Contraseña actual */}
        <div className={`campo${intentado && errores.actual ? " campo-con-error" : ""}`}>
          <label htmlFor="pass-actual">Contraseña actual</label>
          <div className="campo-password">
            <input
              id="pass-actual"
              type={verActual ? "text" : "password"}
              autoComplete="current-password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              disabled={enviando}
              aria-describedby={intentado && errores.actual ? "err-actual" : undefined}
            />
            <button
              type="button"
              className="btn-toggle-pass"
              aria-pressed={verActual}
              aria-label={verActual ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
              onClick={() => setVerActual((v) => !v)}
            >
              {verActual ? <IconoOjoCerrado /> : <IconoOjo />}
            </button>
          </div>
          {intentado && errores.actual && (
            <p id="err-actual" className="campo-error" role="alert">{errores.actual}</p>
          )}
        </div>

        {/* Campo 2: Nueva contraseña */}
        <div className={`campo${intentado && errores.nueva ? " campo-con-error" : ""}`}>
          <label htmlFor="pass-nueva">Nueva contraseña</label>
          <div className="campo-password">
            <input
              id="pass-nueva"
              type={verNueva ? "text" : "password"}
              autoComplete="new-password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              disabled={enviando}
              aria-describedby={intentado && errores.nueva ? "err-nueva" : undefined}
            />
            <button
              type="button"
              className="btn-toggle-pass"
              aria-pressed={verNueva}
              aria-label={verNueva ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
              onClick={() => setVerNueva((v) => !v)}
            >
              {verNueva ? <IconoOjoCerrado /> : <IconoOjo />}
            </button>
          </div>
          {intentado && errores.nueva && (
            <p id="err-nueva" className="campo-error" role="alert">{errores.nueva}</p>
          )}

          {/* Checklist de requisitos en tiempo real */}
          <div className="checklist-requisitos" style={{
            background: "var(--fondo)",
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid var(--borde)",
            fontSize: "0.85rem",
            marginTop: "0.4rem",
            display: "grid",
            gap: "0.25rem"
          }}>
            <div><IconoCheck cumplido={tieneMinimo8} /> Mínimo 8 caracteres</div>
            <div><IconoCheck cumplido={tieneLetra} /> Al menos una letra (A-Z, a-z)</div>
            <div><IconoCheck cumplido={tieneNumero} /> Al menos un número (0-9)</div>
            {actual && <div><IconoCheck cumplido={esDistinta} /> Distinta de la contraseña actual</div>}
          </div>
        </div>

        {/* Campo 3: Confirmar contraseña */}
        <div className={`campo${intentado && errores.confirmar ? " campo-con-error" : ""}`}>
          <label htmlFor="pass-confirmar">Confirmar nueva contraseña</label>
          <div className="campo-password">
            <input
              id="pass-confirmar"
              type={verConfirmar ? "text" : "password"}
              autoComplete="new-password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              disabled={enviando}
              aria-describedby={intentado && errores.confirmar ? "err-confirmar" : undefined}
            />
            <button
              type="button"
              className="btn-toggle-pass"
              aria-pressed={verConfirmar}
              aria-label={verConfirmar ? "Ocultar confirmación" : "Mostrar confirmación"}
              onClick={() => setVerConfirmar((v) => !v)}
            >
              {verConfirmar ? <IconoOjoCerrado /> : <IconoOjo />}
            </button>
          </div>
          {intentado && errores.confirmar && (
            <p id="err-confirmar" className="campo-error" role="alert">{errores.confirmar}</p>
          )}
        </div>

        <div className="acciones" style={{ marginTop: "1rem" }}>
          <Button type="submit" disabled={enviando}>
            {enviando ? "Guardando cambios…" : "Actualizar contraseña"}
          </Button>
        </div>
      </form>
    </section>
  );
}

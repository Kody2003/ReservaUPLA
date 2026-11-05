/**
 * CambiarContrasenaPage — Cambio de contraseña del usuario autenticado (BLOQUE 1 y BLOQUE 2).
 *
 * Características:
 *  - Campos unificados con Campo.tsx e Icono.tsx (candado).
 *  - Botón individual "Mostrar" / "Ocultar" en cada campo.
 *  - Lista de verificación reactiva en tiempo real (mínimo 8 caracteres, letra, número, distinta de actual).
 *  - Errores mostrados únicamente tras interacción (onBlur) o al enviar (submit).
 *  - Botón con ícono candado.
 */
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { Campo } from "../components/ui/Campo";
import { Icono } from "../components/ui/Icono";
import { cambiarContrasena } from "../services/authService";
import { obtenerMensajeError } from "../services/apiClient";
import type { Mensaje } from "../types";

/** Ícono de verificación para el checklist. */
function IconoChecklist({ cumplido }: { cumplido: boolean }) {
  return (
    <span
      style={{
        color: cumplido ? "var(--ok)" : "var(--texto-suave)",
        fontWeight: 700,
        marginRight: "0.45rem",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {cumplido ? <Icono nombre="check" tamano={14} /> : "○"}
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

  // Control de interacción y errores (BLOQUE 1)
  const [tocado, setTocado] = useState<Record<string, boolean>>({});
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  function marcarTocado(campo: string) {
    setTocado((prev) => ({ ...prev, [campo]: true }));
  }

  // Validación reactiva de requisitos
  const tieneMinimo8 = nueva.length >= 8;
  const tieneLetra = /[a-zA-Z]/.test(nueva);
  const tieneNumero = /[0-9]/.test(nueva);
  const esDistinta = Boolean(nueva && actual && nueva !== actual);
  const coinciden = Boolean(nueva && confirmar && nueva === confirmar);

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

  const verError = (campo: keyof typeof errores) => {
    return intentado || tocado[campo] ? errores[campo] ?? "" : "";
  };

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
      await cambiarContrasena({ actual, nueva });
      setMensaje({
        tipo: "exito",
        texto: "Contraseña actualizada correctamente. Tu sesión continúa activa.",
      });
      setActual("");
      setNueva("");
      setConfirmar("");
      setIntentado(false);
      setTocado({});
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
        <h2>
          <Icono nombre="candado" tamano={22} style={{ marginRight: "0.5rem", verticalAlign: "middle", color: "var(--primario)" }} />
          Cambiar contraseña
        </h2>
        <Link className="btn btn-secundario" to="/">
          Volver al inicio
        </Link>
      </div>

      <AlertMessage
        tipo={mensaje?.tipo ?? "info"}
        mensaje={mensaje?.texto ?? ""}
        onCerrar={() => setMensaje(null)}
      />

      <div className="panel-tarjeta" style={{ maxWidth: 560 }}>
        <h3 className="panel-tarjeta-titulo">
          <Icono nombre="candado" tamano={17} style={{ marginRight: "0.4rem", verticalAlign: "middle" }} />
          Actualización de credenciales
        </h3>
        <p className="ayuda" style={{ marginBottom: "1.25rem" }}>
          Por seguridad, tu nueva contraseña debe tener al menos 8 caracteres y combinar letras y números.
        </p>

        <form onSubmit={alEnviar} noValidate style={{ display: "grid", gap: "1rem" }}>
          {/* Campo 1: Contraseña actual */}
          <Campo
            etiqueta="Contraseña actual"
            tipo={verActual ? "text" : "password"}
            valor={actual}
            onCambio={(v) => {
              setActual(v);
              marcarTocado("actual");
            }}
            onBlur={() => marcarTocado("actual")}
            error={verError("actual")}
            placeholder="Ingrese su contraseña actual"
            accionDerecha={
              <button
                type="button"
                className="login-btn-mostrar"
                aria-pressed={verActual}
                aria-label={verActual ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
                title={verActual ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
                onClick={() => setVerActual((v) => !v)}
              >
                <Icono nombre={verActual ? "ojo-tachado" : "ojo"} tamano={18} />
              </button>
            }
            requerido
          />

          {/* Campo 2: Nueva contraseña */}
          <div>
            <Campo
              etiqueta="Nueva contraseña"
              tipo={verNueva ? "text" : "password"}
              valor={nueva}
              onCambio={(v) => {
                setNueva(v);
                marcarTocado("nueva");
              }}
              onBlur={() => marcarTocado("nueva")}
              error={verError("nueva")}
              placeholder="Ingrese su nueva contraseña"
              accionDerecha={
                <button
                  type="button"
                  className="login-btn-mostrar"
                  aria-pressed={verNueva}
                  aria-label={verNueva ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
                  title={verNueva ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
                  onClick={() => setVerNueva((v) => !v)}
                >
                  <Icono nombre={verNueva ? "ojo-tachado" : "ojo"} tamano={18} />
                </button>
              }
              requerido
            />

            {/* Checklist de requisitos reactivo */}
            <div
              style={{
                background: "var(--fondo)",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid var(--borde)",
                fontSize: "0.85rem",
                marginTop: "0.4rem",
                display: "grid",
                gap: "0.3rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <IconoChecklist cumplido={tieneMinimo8} /> Mínimo 8 caracteres
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <IconoChecklist cumplido={tieneLetra} /> Al menos una letra (A-Z, a-z)
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <IconoChecklist cumplido={tieneNumero} /> Al menos un número (0-9)
              </div>
              {actual && (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <IconoChecklist cumplido={esDistinta} /> Distinta de la contraseña actual
                </div>
              )}
            </div>
          </div>

          {/* Campo 3: Confirmar nueva contraseña */}
          <Campo
            etiqueta="Confirmar nueva contraseña"
            tipo={verConfirmar ? "text" : "password"}
            valor={confirmar}
            onCambio={(v) => {
              setConfirmar(v);
              marcarTocado("confirmar");
            }}
            onBlur={() => marcarTocado("confirmar")}
            error={verError("confirmar")}
            placeholder="Confirme su nueva contraseña"
            accionDerecha={
              <button
                type="button"
                className="login-btn-mostrar"
                aria-pressed={verConfirmar}
                aria-label={verConfirmar ? "Ocultar confirmación" : "Mostrar confirmación"}
                title={verConfirmar ? "Ocultar confirmación" : "Mostrar confirmación"}
                onClick={() => setVerConfirmar((v) => !v)}
              >
                <Icono nombre={verConfirmar ? "ojo-tachado" : "ojo"} tamano={18} />
              </button>
            }
            requerido
          />

          <div style={{ marginTop: "0.5rem" }}>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Guardando cambios…" : "Actualizar contraseña"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

/**
 * Campo — Componente universal y accesible de campos de formulario (BLOQUE 1).
 *
 * Características:
 *  - Etiqueta superior en negrita con asterisco rojo (--error) para campos requeridos.
 *  - Caja redondeada (~12px), borde --borde, fondo --superficie y altura cómoda (~46px).
 *  - Ícono opcional a la izquierda con estilo unificado.
 *  - Soporta: text, email, password, number, date, time, select y textarea.
 *  - Foco accesible con borde --primario y anillo visible.
 *  - Validación didáctica: cuando hay error, borde rojo (--error) sobre fondo normal
 *    (sin fondos rosados invasivos) y mensaje claro debajo.
 *  - Accesibilidad WAI-ARIA completa: aria-required, aria-invalid y aria-describedby.
 *  - Admite children opcionales para controles altamente personalizados.
 */
import { useId, type ReactNode } from "react";

export interface OpcionSelect {
  valor: string;
  texto: string;
}

export interface CampoProps {
  id?: string;
  etiqueta: string;
  valor?: string | number;
  onCambio?: (valor: string) => void;
  onBlur?: () => void;
  tipo?: "text" | "email" | "password" | "number" | "date" | "time" | "select" | "textarea";
  requerido?: boolean;
  error?: string;
  ayuda?: string;
  icono?: ReactNode;
  accionDerecha?: ReactNode;
  placeholder?: string;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  disabled?: boolean;
  opciones?: OpcionSelect[];
  textoVacio?: string;
  rows?: number;
  className?: string;
  children?: ReactNode;
}

export function Campo({
  id: idProp,
  etiqueta,
  valor,
  onCambio,
  onBlur,
  tipo = "text",
  requerido = false,
  error,
  ayuda,
  icono,
  accionDerecha,
  placeholder,
  maxLength,
  min,
  max,
  disabled = false,
  opciones,
  textoVacio,
  rows = 3,
  className,
  children,
}: CampoProps) {
  const autoId = useId();
  const id = idProp || autoId;
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;

  const ariaDescribedBy = [
    error ? idError : null,
    ayuda && !error ? idAyuda : null,
  ].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`campo-grupo-universal ${className ?? ""}`}>
      {/* Etiqueta superior */}
      <label htmlFor={id} className="campo-etiqueta-label">
        {etiqueta}
        {requerido && (
          <span className="campo-asterisco-rojo" aria-hidden="true">
            {" "}*
          </span>
        )}
      </label>

      {/* Caja contenedora con ícono a la izquierda */}
      <div className={`campo-caja-control ${error ? "con-error" : ""} ${tipo === "textarea" ? "caja-textarea" : ""}`}>
        {icono && (
          <span className="campo-icono-izq" aria-hidden="true">
            {icono}
          </span>
        )}

        {/* Si recibe children, los renderiza dentro de la caja */}
        {children ? (
          children
        ) : tipo === "select" ? (
          <select
            id={id}
            value={valor ?? ""}
            onChange={(e) => onCambio?.(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            aria-required={requerido}
            aria-invalid={Boolean(error)}
            aria-describedby={ariaDescribedBy}
            className="campo-control-nativo select-nativo"
          >
            {textoVacio && <option value="">{textoVacio}</option>}
            {opciones?.map((opt) => (
              <option key={opt.valor} value={opt.valor}>
                {opt.texto}
              </option>
            ))}
          </select>
        ) : tipo === "textarea" ? (
          <textarea
            id={id}
            value={valor ?? ""}
            onChange={(e) => onCambio?.(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            rows={rows}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-required={requerido}
            aria-invalid={Boolean(error)}
            aria-describedby={ariaDescribedBy}
            className="campo-control-nativo textarea-nativo"
          />
        ) : (
          <input
            id={id}
            type={tipo}
            value={valor ?? ""}
            onChange={(e) => onCambio?.(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            maxLength={maxLength}
            min={min}
            max={max}
            aria-required={requerido}
            aria-invalid={Boolean(error)}
            aria-describedby={ariaDescribedBy}
            className="campo-control-nativo"
          />
        )}

        {accionDerecha && (
          <span className="campo-accion-der">
            {accionDerecha}
          </span>
        )}
      </div>

      {/* Mensaje de ayuda (cuando no hay error) */}
      {ayuda && !error && (
        <p id={idAyuda} className="campo-ayuda-texto">
          {ayuda}
        </p>
      )}

      {/* Mensaje de error debajo del campo */}
      {error && (
        <p id={idError} className="campo-error-texto" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

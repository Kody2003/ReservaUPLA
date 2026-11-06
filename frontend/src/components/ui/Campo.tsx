/**
 * Campo — Contenedor accesible para campos de formulario.
 *
 * Responsabilidad:
 *  - Renderiza etiqueta superior con indicador de obligatoriedad (asterisco rojo).
 *  - Compone y renderiza el control base adecuado según el `tipo`:
 *      · TextInput (para text, email, password, number y sus alias).
 *      · SelectInput (para select y listas desplegables).
 *      · DateInput (para date / fecha).
 *      · TimeInput (para time / hora con step).
 *      · Textarea unificado (para textarea / area).
 *  - Enlaza accesibilidad WAI-ARIA (aria-describedby, aria-invalid, aria-required).
 *  - Muestra mensajes de ayuda contextual y mensajes de error específicos debajo del campo.
 */
import { useId, type ReactNode } from "react";
import { TextInput, type TipoTextInput } from "./TextInput";
import { SelectInput, type OpcionSelect } from "./SelectInput";
import { DateInput } from "./DateInput";
import { TimeInput } from "./TimeInput";

export type { OpcionSelect, TipoTextInput };

export type TipoCampo =
  | "text"
  | "texto"
  | "email"
  | "correo"
  | "password"
  | "contrasena"
  | "number"
  | "numero"
  | "select"
  | "date"
  | "fecha"
  | "time"
  | "hora"
  | "textarea"
  | "area";

export interface CampoProps {
  id?: string;
  etiqueta: string;
  valor?: string | number;
  value?: string | number;
  onCambio?: (valor: string) => void;
  onChange?: (valor: string) => void;
  onBlur?: () => void;
  tipo?: TipoCampo;
  type?: TipoCampo;
  requerido?: boolean;
  error?: string;
  ayuda?: string;
  icono?: ReactNode;
  accionDerecha?: ReactNode;
  slotDerecha?: ReactNode;
  placeholder?: string;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
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
  value,
  onCambio,
  onChange,
  onBlur,
  tipo = "text",
  type,
  requerido = false,
  error,
  ayuda,
  accionDerecha,
  slotDerecha,
  placeholder,
  maxLength,
  min,
  max,
  step,
  disabled = false,
  opciones,
  textoVacio,
  rows = 4,
  className = "",
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

  const val = value !== undefined ? value : valor;
  const cambioHandler = onChange ?? onCambio;
  const tipoEfectivo = type ?? tipo;
  const slot = slotDerecha ?? accionDerecha;

  function renderizarControl() {
    if (children) {
      return children;
    }

    if (tipoEfectivo === "select") {
      return (
        <SelectInput
          id={id}
          value={val}
          onChange={cambioHandler}
          onBlur={onBlur}
          opciones={opciones}
          textoVacio={textoVacio}
          placeholder={placeholder}
          disabled={disabled}
          error={Boolean(error)}
          aria-invalid={Boolean(error)}
          aria-describedby={ariaDescribedBy}
          aria-required={requerido}
        />
      );
    }

    if (tipoEfectivo === "date" || tipoEfectivo === "fecha") {
      return (
        <DateInput
          id={id}
          value={val !== undefined ? String(val) : ""}
          onChange={cambioHandler}
          onBlur={onBlur}
          min={min !== undefined ? String(min) : undefined}
          max={max !== undefined ? String(max) : undefined}
          step={step}
          placeholder={placeholder}
          disabled={disabled}
          error={Boolean(error)}
          aria-invalid={Boolean(error)}
          aria-describedby={ariaDescribedBy}
          aria-required={requerido}
        />
      );
    }

    if (tipoEfectivo === "time" || tipoEfectivo === "hora") {
      return (
        <TimeInput
          id={id}
          value={val !== undefined ? String(val) : ""}
          onChange={cambioHandler}
          onBlur={onBlur}
          min={min !== undefined ? String(min) : undefined}
          max={max !== undefined ? String(max) : undefined}
          step={step}
          placeholder={placeholder}
          disabled={disabled}
          error={Boolean(error)}
          aria-invalid={Boolean(error)}
          aria-describedby={ariaDescribedBy}
          aria-required={requerido}
        />
      );
    }

    if (tipoEfectivo === "textarea" || tipoEfectivo === "area") {
      return (
        <div className={`campo-caja-control caja-textarea ${error ? "con-error" : ""}`}>
          <textarea
            id={id}
            value={val ?? ""}
            onChange={(e) => cambioHandler?.(e.target.value)}
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
        </div>
      );
    }

    const tipoTexto: TipoTextInput =
      tipoEfectivo === "correo" || tipoEfectivo === "email"
        ? "email"
        : tipoEfectivo === "contrasena" || tipoEfectivo === "password"
        ? "password"
        : tipoEfectivo === "numero" || tipoEfectivo === "number"
        ? "number"
        : "text";

    return (
      <TextInput
        id={id}
        type={tipoTexto}
        value={val}
        onChange={cambioHandler}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        min={min}
        max={max}
        step={step}
        slotDerecha={slot}
        error={Boolean(error)}
        aria-invalid={Boolean(error)}
        aria-describedby={ariaDescribedBy}
        aria-required={requerido}
      />
    );
  }

  return (
    <div className={`campo-grupo-universal ${className}`.trim()}>
      {/* Etiqueta superior */}
      <label htmlFor={id} className="campo-etiqueta-label">
        {etiqueta}
        {requerido && (
          <span className="campo-asterisco-rojo" aria-hidden="true">
            {" "}*
          </span>
        )}
      </label>

      {/* Control base renderizado según el tipo */}
      {renderizarControl()}

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

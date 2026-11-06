import type { ReactNode } from "react";

export type TipoTextInput =
  | "text"
  | "email"
  | "password"
  | "number"
  | "texto"
  | "correo"
  | "contrasena"
  | "numero";

export interface TextInputProps {
  id?: string;
  value?: string | number;
  valor?: string | number;
  onChange?: (valor: string) => void;
  onCambio?: (valor: string) => void;
  onBlur?: () => void;
  type?: TipoTextInput;
  tipo?: TipoTextInput;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  error?: boolean | string;
  slotDerecha?: ReactNode;
  accionDerecha?: ReactNode;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  "aria-required"?: boolean | "true" | "false";
  className?: string;
}

/**
 * TextInput — Control base reutilizable para entradas de texto, correo, contraseña y números.
 * Renderiza la caja de control redondeada con estilos de foco y error, y admite un slot opcional a la derecha.
 */
export function TextInput({
  id,
  value,
  valor,
  onChange,
  onCambio,
  onBlur,
  type = "text",
  tipo,
  placeholder,
  disabled = false,
  maxLength,
  min,
  max,
  step,
  error,
  slotDerecha,
  accionDerecha,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-required": ariaRequired,
  className = "",
}: TextInputProps) {
  const val = value !== undefined ? value : valor;
  const cambioHandler = onChange ?? onCambio;
  const tipoEfectivo = tipo ?? type;
  const slot = slotDerecha ?? accionDerecha;
  const tieneError = Boolean(error);

  const tipoHtml =
    tipoEfectivo === "correo"
      ? "email"
      : tipoEfectivo === "contrasena"
      ? "password"
      : tipoEfectivo === "numero"
      ? "number"
      : tipoEfectivo === "texto"
      ? "text"
      : tipoEfectivo;

  return (
    <div className={`campo-caja-control ${tieneError ? "con-error" : ""} ${className}`.trim()}>
      <input
        id={id}
        type={tipoHtml}
        value={val ?? ""}
        onChange={(e) => cambioHandler?.(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        min={min}
        max={max}
        step={step}
        aria-invalid={ariaInvalid !== undefined ? ariaInvalid : tieneError ? true : undefined}
        aria-describedby={ariaDescribedBy}
        aria-required={ariaRequired}
        className="campo-control-nativo"
      />
      {slot && <span className="campo-accion-der">{slot}</span>}
    </div>
  );
}

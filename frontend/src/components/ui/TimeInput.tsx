export interface TimeInputProps {
  id?: string;
  value?: string;
  valor?: string;
  onChange?: (valor: string) => void;
  onCambio?: (valor: string) => void;
  onBlur?: () => void;
  min?: string;
  max?: string;
  step?: number | string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean | string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  "aria-required"?: boolean | "true" | "false";
  className?: string;
}

/**
 * TimeInput — Control base reutilizable para selección de horas (type="time").
 * Renderiza la caja de control redondeada con estilos de foco y error.
 */
export function TimeInput({
  id,
  value,
  valor,
  onChange,
  onCambio,
  onBlur,
  min,
  max,
  step = 900,
  placeholder,
  disabled = false,
  error,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-required": ariaRequired,
  className = "",
}: TimeInputProps) {
  const val = value !== undefined ? value : valor;
  const cambioHandler = onChange ?? onCambio;
  const tieneError = Boolean(error);

  return (
    <div className={`campo-caja-control ${tieneError ? "con-error" : ""} ${className}`.trim()}>
      <input
        id={id}
        type="time"
        value={val ?? ""}
        onChange={(e) => cambioHandler?.(e.target.value)}
        onBlur={onBlur}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={ariaInvalid !== undefined ? ariaInvalid : tieneError ? true : undefined}
        aria-describedby={ariaDescribedBy}
        aria-required={ariaRequired}
        className="campo-control-nativo"
      />
    </div>
  );
}

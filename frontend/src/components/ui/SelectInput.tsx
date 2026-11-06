export interface OpcionSelect {
  valor: string;
  texto: string;
}

export interface SelectInputProps {
  id?: string;
  value?: string | number;
  valor?: string | number;
  onChange?: (valor: string) => void;
  onCambio?: (valor: string) => void;
  onBlur?: () => void;
  opciones?: OpcionSelect[];
  textoVacio?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean | string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  "aria-required"?: boolean | "true" | "false";
  className?: string;
}

/**
 * SelectInput — Control base reutilizable para listas desplegables.
 * Renderiza la caja de control redondeada con estilos de foco y error.
 */
export function SelectInput({
  id,
  value,
  valor,
  onChange,
  onCambio,
  onBlur,
  opciones = [],
  textoVacio,
  placeholder,
  disabled = false,
  error,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-required": ariaRequired,
  className = "",
}: SelectInputProps) {
  const val = value !== undefined ? value : valor;
  const cambioHandler = onChange ?? onCambio;
  const primerTexto = textoVacio ?? placeholder;
  const tieneError = Boolean(error);

  return (
    <div className={`campo-caja-control ${tieneError ? "con-error" : ""} ${className}`.trim()}>
      <select
        id={id}
        value={val ?? ""}
        onChange={(e) => cambioHandler?.(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={ariaInvalid !== undefined ? ariaInvalid : tieneError ? true : undefined}
        aria-describedby={ariaDescribedBy}
        aria-required={ariaRequired}
        className="campo-control-nativo select-nativo"
      >
        {primerTexto && <option value="">{primerTexto}</option>}
        {opciones.map((opt) => (
          <option key={opt.valor} value={opt.valor}>
            {opt.texto}
          </option>
        ))}
      </select>
    </div>
  );
}

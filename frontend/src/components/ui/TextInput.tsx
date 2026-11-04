import { useId } from "react";
import { Campo } from "./Campo";

interface TextInputProps {
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
  error?: string;
  tipo?: "text" | "email" | "password" | "number";
  requerido?: boolean;
  placeholder?: string;
  maxLength?: number;
  minimo?: number;
  deshabilitado?: boolean;
}

/** Campo de texto reutilizable. No tiene lógica de negocio: recibe el valor y avisa cuando cambia. */
export function TextInput({
  etiqueta, valor, onCambio, error, tipo = "text", requerido, placeholder, maxLength, minimo, deshabilitado,
}: TextInputProps) {
  const id = useId();
  return (
    <Campo id={id} etiqueta={etiqueta} requerido={requerido} error={error}>
      <input
        id={id}
        type={tipo}
        value={valor}
        placeholder={placeholder}
        maxLength={maxLength}
        min={minimo}
        disabled={deshabilitado}
        onChange={(e) => onCambio(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </Campo>
  );
}

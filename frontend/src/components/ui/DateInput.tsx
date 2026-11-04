import { useId } from "react";
import { Campo } from "./Campo";

interface DateInputProps {
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
  error?: string;
  requerido?: boolean;
}

/** Campo de fecha reutilizable. El valor siempre es "AAAA-MM-DD" (lo que espera la API). */
export function DateInput({ etiqueta, valor, onCambio, error, requerido }: DateInputProps) {
  const id = useId();
  return (
    <Campo id={id} etiqueta={etiqueta} requerido={requerido} error={error}>
      <input
        id={id}
        type="date"
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </Campo>
  );
}

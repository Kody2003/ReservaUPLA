import { useId } from "react";
import { Campo } from "./Campo";

interface TimeInputProps {
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
  error?: string;
  requerido?: boolean;
  minimo?: string;
  maximo?: string;
}

/** Campo de hora reutilizable. El valor siempre es "HH:mm". minimo/maximo ayudan al navegador a guiar (RN-04). */
export function TimeInput({ etiqueta, valor, onCambio, error, requerido, minimo, maximo }: TimeInputProps) {
  const id = useId();
  return (
    <Campo id={id} etiqueta={etiqueta} requerido={requerido} error={error}>
      <input
        id={id}
        type="time"
        value={valor}
        min={minimo}
        max={maximo}
        step={900}
        onChange={(e) => onCambio(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </Campo>
  );
}

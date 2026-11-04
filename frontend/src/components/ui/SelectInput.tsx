import { useId } from "react";
import { Campo } from "./Campo";

export interface OpcionSelect {
  valor: string;
  texto: string;
}

interface SelectInputProps {
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
  opciones: OpcionSelect[];
  textoVacio?: string;
  error?: string;
  requerido?: boolean;
  deshabilitado?: boolean;
}

/** Lista desplegable reutilizable. La primera opción (valor "") sirve como "sin selección". */
export function SelectInput({
  etiqueta, valor, onCambio, opciones, textoVacio = "Seleccione una opción", error, requerido, deshabilitado,
}: SelectInputProps) {
  const id = useId();
  return (
    <Campo id={id} etiqueta={etiqueta} requerido={requerido} error={error}>
      <select
        id={id}
        value={valor}
        disabled={deshabilitado}
        onChange={(e) => onCambio(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <option value="">{textoVacio}</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </Campo>
  );
}

import type { ReactNode } from "react";

interface CampoProps {
  id: string;
  etiqueta: string;
  requerido?: boolean;
  error?: string;
  children: ReactNode;
}

/**
 * Envoltorio común de los campos de formulario: etiqueta arriba, el control en medio
 * y el mensaje de error justo debajo (así el error queda junto al campo, como pide la usabilidad).
 * Lo reutilizan TextInput, SelectInput, DateInput y TimeInput para no repetir este código.
 */
export function Campo({ id, etiqueta, requerido, error, children }: CampoProps) {
  return (
    <div className={error ? "campo campo-con-error" : "campo"}>
      <label htmlFor={id}>
        {etiqueta}
        {requerido && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="campo-error">
          {error}
        </p>
      )}
    </div>
  );
}

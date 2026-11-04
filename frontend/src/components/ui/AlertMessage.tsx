interface AlertMessageProps {
  tipo: "error" | "exito" | "info";
  mensaje: string;
  onCerrar?: () => void;
}

/**
 * Mensaje destacado (error, éxito o información). Usa role="alert" para que los lectores
 * de pantalla lo anuncien apenas aparece. Si el mensaje está vacío no se muestra nada.
 */
export function AlertMessage({ tipo, mensaje, onCerrar }: AlertMessageProps) {
  if (!mensaje) return null;
  return (
    <div role="alert" className={`alerta alerta-${tipo}`}>
      <span>{mensaje}</span>
      {onCerrar && (
        <button type="button" className="alerta-cerrar" onClick={onCerrar} aria-label="Cerrar mensaje">
          ×
        </button>
      )}
    </div>
  );
}

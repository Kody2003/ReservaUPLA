import { useEffect, useRef } from "react";
import { Button } from "./Button";

interface ModalConfirmacionProps {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  textoCancelar?: string;
  peligroso?: boolean;
  procesando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Ventana de confirmación accesible para acciones importantes (ej. cambiar el estado de una reserva).
 * - El botón enfocado al abrir es CANCELAR (la opción segura por defecto).
 * - La tecla Escape cancela.
 * - El foco queda atrapado: Tab y Shift+Tab solo circulan entre los botones del modal.
 * - Al cerrarse, el foco vuelve al elemento que lo abrió.
 */
export function ModalConfirmacion({
  abierto, titulo, mensaje, textoConfirmar, textoCancelar = "Cancelar",
  peligroso = false, procesando = false, onConfirmar, onCancelar,
}: ModalConfirmacionProps) {
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const onCancelarRef = useRef(onCancelar);

  // Guardamos siempre la última versión de onCancelar sin reiniciar el efecto de abajo
  useEffect(() => {
    onCancelarRef.current = onCancelar;
  });

  useEffect(() => {
    if (!abierto) return;

    const elementoPrevio = document.activeElement as HTMLElement | null;
    cancelarRef.current?.focus(); // botón por defecto = Cancelar

    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancelarRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      // Foco atrapado: al llegar al último botón volvemos al primero (y al revés con Shift)
      const botones = contenedorRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])");
      if (!botones || botones.length === 0) return;
      const primero = botones[0];
      const ultimo = botones[botones.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("keydown", alPresionarTecla);
      elementoPrevio?.focus();
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="modal-fondo">
      <div
        ref={contenedorRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        aria-describedby="modal-mensaje"
      >
        <h2 id="modal-titulo">{titulo}</h2>
        <p id="modal-mensaje">{mensaje}</p>
        <div className="acciones">
          <button ref={cancelarRef} type="button" className="btn btn-secundario" onClick={onCancelar} disabled={procesando}>
            {textoCancelar}
          </button>
          <Button variante={peligroso ? "peligro" : "primario"} onClick={onConfirmar} disabled={procesando}>
            {procesando ? "Procesando..." : textoConfirmar}
          </Button>
        </div>
      </div>
    </div>
  );
}

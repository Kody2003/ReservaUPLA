import type { EstadoReserva } from "../../types";

/** Etiqueta de color con el estado de una reserva. El texto siempre se muestra: el color no es lo único que informa. */
export function EstadoBadge({ estado }: { estado: EstadoReserva }) {
  return <span className={`estado estado-${estado.toLowerCase()}`}>{estado}</span>;
}

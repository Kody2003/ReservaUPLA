import { useEffect, useState } from "react";
import { obtenerMensajeError } from "../services/apiClient";
import { reservasService } from "../services/reservasService";
import type { Disponibilidad } from "../types";

/**
 * RF-04 en el frontend: cada vez que cambian el ambiente, la fecha o las horas, espera 300 ms
 * (para no consultar en cada tecla) y le pregunta al backend si el horario está libre.
 *
 * @param habilitado false cuando faltan datos o el horario ya es inválido (RN-03/RN-04).
 * @returns disponibilidad (null si aún no hay respuesta) y verificando (true mientras espera).
 */
export function useDisponibilidad(
  ambienteId: string,
  fecha: string,
  horaInicio: string,
  horaFin: string,
  habilitado: boolean,
) {
  const [resultado, setResultado] = useState<{ clave: string; valor: Disponibilidad } | null>(null);

  // Identifica "qué consulta" es esta; sirve para ignorar respuestas viejas
  const clave = `${ambienteId}|${fecha}|${horaInicio}|${horaFin}`;

  useEffect(() => {
    if (!habilitado) return;

    let cancelado = false;
    const temporizador = setTimeout(() => {
      reservasService
        .validarDisponibilidad(ambienteId, fecha, horaInicio, horaFin)
        .then((valor) => {
          if (!cancelado) setResultado({ clave, valor });
        })
        .catch((e: unknown) => {
          if (!cancelado) {
            setResultado({ clave, valor: { disponible: false, mensaje: obtenerMensajeError(e), codigo: "" } });
          }
        });
    }, 300);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [clave, habilitado, ambienteId, fecha, horaInicio, horaFin]);

  const disponibilidad = habilitado && resultado?.clave === clave ? resultado.valor : null;
  return { disponibilidad, verificando: habilitado && disponibilidad === null };
}

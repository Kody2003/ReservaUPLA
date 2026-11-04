import { useMemo } from "react";

// Reglas de la reserva reflejadas en el frontend. La fuente de verdad sigue siendo el backend;
// esto solo da mensajes inmediatos junto al campo (prevención de errores, Nielsen).

/** RN-04: límites del horario permitido. */
export const HORA_MINIMA = "07:00";
export const HORA_MAXIMA = "22:00";

export interface ValoresReserva {
  usuarioId: string;
  ambienteId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
}

export type ErroresReserva = Partial<Record<keyof ValoresReserva, string>>;

/**
 * Función pura que revisa los valores y devuelve un mensaje por campo con problema.
 * Las horas "HH:mm" se pueden comparar como texto porque siempre llevan dos dígitos.
 */
export function validarReserva(v: ValoresReserva): ErroresReserva {
  const errores: ErroresReserva = {};

  // RN-02: todos los campos son obligatorios
  if (!v.usuarioId) errores.usuarioId = "Selecciona el usuario que solicita la reserva.";
  if (!v.ambienteId) errores.ambienteId = "Selecciona el ambiente que quieres reservar.";
  if (!v.fecha) errores.fecha = "Elige la fecha de la reserva.";
  if (!v.horaInicio) errores.horaInicio = "Indica la hora de inicio.";
  if (!v.horaFin) errores.horaFin = "Indica la hora de fin.";
  if (!v.motivo.trim()) errores.motivo = "Escribe el motivo de la reserva.";
  if (v.motivo.trim().length > 300) errores.motivo = "El motivo no puede superar 300 caracteres.";

  // RN-04: horario permitido de 07:00 a 22:00
  if (v.horaInicio && v.horaInicio < HORA_MINIMA) {
    errores.horaInicio = `La hora de inicio no puede ser antes de las ${HORA_MINIMA}.`;
  }
  if (v.horaFin && v.horaFin > HORA_MAXIMA) {
    errores.horaFin = `La hora de fin no puede ser después de las ${HORA_MAXIMA}.`;
  }

  // RN-03: la hora de fin debe ser mayor que la de inicio
  if (v.horaInicio && v.horaFin && v.horaFin <= v.horaInicio) {
    errores.horaFin = "La hora de fin debe ser mayor que la hora de inicio.";
  }

  return errores;
}

/**
 * Hook que calcula los errores de la reserva y dos banderas útiles para la página:
 * - hayErroresHorario: RN-03/RN-04 incumplidas (se usa para deshabilitar el botón y no consultar disponibilidad).
 * - hayErrores: cualquier error (se usa al intentar guardar).
 */
export function useValidacionReserva(valores: ValoresReserva) {
  const { usuarioId, ambienteId, fecha, horaInicio, horaFin, motivo } = valores;

  return useMemo(() => {
    const errores = validarReserva({ usuarioId, ambienteId, fecha, horaInicio, horaFin, motivo });
    // Un campo de hora con valor y con error significa que incumple RN-03 o RN-04
    // (si estuviera vacío, el error sería solo "obligatorio" y no cuenta aquí).
    const hayErroresHorario =
      (horaInicio !== "" && Boolean(errores.horaInicio)) || (horaFin !== "" && Boolean(errores.horaFin));
    return { errores, hayErroresHorario, hayErrores: Object.keys(errores).length > 0 };
  }, [usuarioId, ambienteId, fecha, horaInicio, horaFin, motivo]);
}

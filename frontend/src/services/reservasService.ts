import type { Disponibilidad, EstadoReserva, FiltroReservas, Reserva, ReservaCrear } from "../types";
import { apiClient } from "./apiClient";

/** Llamadas a la API de reservas (RF-03 a RF-07). */
export const reservasService = {
  /** RF-03: registra una reserva (queda Pendiente). */
  crear: (datos: ReservaCrear) => apiClient.post<Reserva>("/api/reservas", datos),

  /** RF-05: lista reservas; solo envía los filtros que tengan valor. */
  listar: (filtro: Partial<FiltroReservas> = {}) => {
    const consulta = new URLSearchParams();
    if (filtro.estado) consulta.set("estado", filtro.estado);
    if (filtro.ambienteId) consulta.set("ambienteId", filtro.ambienteId);
    if (filtro.fecha) consulta.set("fecha", filtro.fecha);
    const texto = consulta.toString();
    return apiClient.get<Reserva[]>(texto ? `/api/reservas?${texto}` : "/api/reservas");
  },

  /** RF-06: detalle de una reserva. */
  obtener: (id: string) => apiClient.get<Reserva>(`/api/reservas/${id}`),

  /** RF-04: ¿está libre el ambiente en ese horario? */
  validarDisponibilidad: (ambienteId: string, fecha: string, horaInicio: string, horaFin: string) => {
    const consulta = new URLSearchParams({ ambienteId, fecha, horaInicio, horaFin });
    return apiClient.get<Disponibilidad>(`/api/reservas/disponibilidad?${consulta.toString()}`);
  },

  /** RF-07: cambia el estado (Aprobada, Rechazada o Cancelada). */
  cambiarEstado: (id: string, nuevoEstado: EstadoReserva) =>
    apiClient.patch<Reserva>(`/api/reservas/${id}/estado`, { nuevoEstado }),
};

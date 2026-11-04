import type { Ambiente, AmbienteCrear } from "../types";
import { apiClient } from "./apiClient";

/** Llamadas a la API de ambientes (RF-02). */
export const ambientesService = {
  /** RF-02: registra un ambiente. */
  crear: (datos: AmbienteCrear) => apiClient.post<Ambiente>("/api/ambientes", datos),
  /** Lista todos los ambientes. */
  listar: () => apiClient.get<Ambiente[]>("/api/ambientes"),
};

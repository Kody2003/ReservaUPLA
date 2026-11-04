import type { Dashboard } from "../types";
import { apiClient } from "./apiClient";

/** Llamada a la API del dashboard (RF-08). */
export const dashboardService = {
  obtener: () => apiClient.get<Dashboard>("/api/dashboard"),
};

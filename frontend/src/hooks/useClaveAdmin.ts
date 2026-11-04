import { useSyncExternalStore } from "react";
import { obtenerClaveAdmin, suscribirClaveAdmin } from "../services/claveAdmin";

/**
 * Hook que entrega la clave de administrador guardada ("" si no hay) y se actualiza solo
 * cuando cambia. Sirve para habilitar o deshabilitar los botones de aprobar/rechazar (RN-05).
 * Ojo: el frontend solo sabe SI hay clave; si es correcta lo decide el backend.
 */
export function useClaveAdmin(): string {
  return useSyncExternalStore(suscribirClaveAdmin, obtenerClaveAdmin);
}

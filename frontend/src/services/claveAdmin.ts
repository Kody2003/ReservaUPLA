// Guarda la clave de administrador (RN-05) mientras la pestaña esté abierta.
// sessionStorage se borra al cerrar la pestaña, así la clave no queda guardada para siempre.
// Se avisa a la interfaz con un evento propio para que todos los componentes se actualicen.

const LLAVE = "reservaupla.claveAdmin";
const EVENTO = "reservaupla:claveAdmin";

/** Devuelve la clave guardada ("" si no hay). */
export function obtenerClaveAdmin(): string {
  return sessionStorage.getItem(LLAVE) ?? "";
}

/** Guarda la clave (o la borra si llega vacía) y avisa a quien esté escuchando. */
export function guardarClaveAdmin(clave: string): void {
  if (clave) {
    sessionStorage.setItem(LLAVE, clave);
  } else {
    sessionStorage.removeItem(LLAVE);
  }
  window.dispatchEvent(new Event(EVENTO));
}

/** Permite a un hook enterarse cuando la clave cambia. Devuelve la función para dejar de escuchar. */
export function suscribirClaveAdmin(alCambiar: () => void): () => void {
  window.addEventListener(EVENTO, alCambiar);
  return () => window.removeEventListener(EVENTO, alCambiar);
}

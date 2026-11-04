import { obtenerClaveAdmin } from "./claveAdmin";

// Cliente HTTP central: TODAS las llamadas a la API pasan por aquí.
// Así hay un único lugar donde se arma la URL, se envía la cabecera de administrador (RN-05)
// y se convierten los errores del backend en mensajes legibles.

const URL_BASE: string = import.meta.env.VITE_API_URL ?? "http://localhost:5080";

/** Error de la API con el mensaje en español que envió el backend (campo "detail"). */
export class ApiError extends Error {
  status: number;
  codigo?: string;

  constructor(mensaje: string, status: number, codigo?: string) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status;
    this.codigo = codigo;
  }
}

/** Saca un texto mostrable de cualquier error capturado en un catch. */
export function obtenerMensajeError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

/** Hace la petición, envía la clave de administrador si existe y devuelve el JSON. */
async function solicitar<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const cabeceras: Record<string, string> = { Accept: "application/json" };
  if (opciones.body) cabeceras["Content-Type"] = "application/json";

  // RN-05: el backend decide si esta clave corresponde a un Administrador
  const clave = obtenerClaveAdmin();
  if (clave) cabeceras["X-Admin-Key"] = clave;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${URL_BASE}${ruta}`, { ...opciones, headers: cabeceras });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Verifica que la API esté encendida.", 0);
  }

  if (!respuesta.ok) {
    let mensaje = "No se pudo completar la operación.";
    let codigo: string | undefined;
    try {
      // El backend responde ProblemDetails: { title, detail, status, codigo? }
      const problema = (await respuesta.json()) as { detail?: string; title?: string; codigo?: string };
      mensaje = problema.detail ?? problema.title ?? mensaje;
      codigo = problema.codigo;
    } catch {
      // la respuesta no era JSON: nos quedamos con el mensaje genérico
    }
    throw new ApiError(mensaje, respuesta.status, codigo);
  }

  return (await respuesta.json()) as T;
}

/** Métodos cortos que usan los servicios (usuarios, ambientes, reservas, dashboard). */
export const apiClient = {
  get: <T>(ruta: string) => solicitar<T>(ruta),
  post: <T>(ruta: string, cuerpo: unknown) =>
    solicitar<T>(ruta, { method: "POST", body: JSON.stringify(cuerpo) }),
  patch: <T>(ruta: string, cuerpo: unknown) =>
    solicitar<T>(ruta, { method: "PATCH", body: JSON.stringify(cuerpo) }),
};

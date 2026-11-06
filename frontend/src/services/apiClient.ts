/**
 * apiClient — Cliente HTTP central (FASE 3: actualizado para JWT).
 *
 * Cambios respecto a la versión anterior:
 *  - Se eliminó el import de obtenerClaveAdmin() y el encabezado X-Admin-Key.
 *  - Ahora envía Authorization: Bearer <token> leyendo el token de sessionStorage.
 *  - En respuesta 401 limpia la sesión y redirige al /login con un mensaje.
 *  - En respuesta 403 lanza ApiError con el mensaje del backend (ProblemDetails).
 *
 * Por qué un módulo centralizado:
 *  Hay un único lugar donde se arma la URL, se adjunta el token y se convierten
 *  los errores del backend en mensajes legibles en español.
 */

const URL_BASE: string = import.meta.env.VITE_API_URL ?? "http://localhost:5080";
const LLAVE_TOKEN   = "reservaupla.token";
const LLAVE_USUARIO = "reservaupla.usuario";

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

/** Lee el token JWT guardado en sessionStorage de forma segura. */
function leerToken(): string | null {
  try { return sessionStorage.getItem(LLAVE_TOKEN); }
  catch { return null; }
}

/**
 * Limpia la sesión y redirige al login.
 * Se llama cuando el backend responde 401 (token expirado o inválido).
 * // LOGIN
 */
function manejar401(): void {
  try {
    sessionStorage.removeItem(LLAVE_TOKEN);
    sessionStorage.removeItem(LLAVE_USUARIO);
    // Guardamos un mensaje para que LoginPage lo muestre al usuario
    sessionStorage.setItem("reservaupla.mensajeLogin", "Tu sesión expiró. Ingresa nuevamente.");
  } catch { /* nada */ }
  window.location.href = "/login";
}

/** Hace la petición con el token Bearer y devuelve el JSON. */
async function solicitar<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const cabeceras: Record<string, string> = { Accept: "application/json" };
  if (opciones.body) cabeceras["Content-Type"] = "application/json";

  // LOGIN: adjunta el JWT si hay sesión activa
  const token = leerToken();
  if (token) cabeceras["Authorization"] = `Bearer ${token}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${URL_BASE}${ruta}`, { ...opciones, headers: cabeceras });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Verifica que la API esté encendida.", 0);
  }

  // LOGIN — 401: sesión expirada o token inválido → redirige al login
  if (respuesta.status === 401) {
    manejar401();
    // La función nunca retorna: el navegador ya está navegando a /login
    throw new ApiError("Sesión no válida. Redirigiendo al login…", 401);
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

  // 204 No Content: no hay cuerpo JSON
  if (respuesta.status === 204) return undefined as unknown as T;

  return (await respuesta.json()) as T;
}

/** Métodos cortos que usan los servicios (usuarios, ambientes, reservas, dashboard). */
export const apiClient = {
  get:    <T>(ruta: string) => solicitar<T>(ruta),
  post:   <T>(ruta: string, cuerpo: unknown) =>
    solicitar<T>(ruta, { method: "POST", body: JSON.stringify(cuerpo) }),
  patch:  <T>(ruta: string, cuerpo: unknown) =>
    solicitar<T>(ruta, { method: "PATCH", body: JSON.stringify(cuerpo) }),
  delete: <T>(ruta: string) => solicitar<T>(ruta, { method: "DELETE" }),
};

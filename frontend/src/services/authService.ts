/**
 * authService — Servicio de autenticación (FASE 3 — LOGIN).
 *
 * Encapsula las llamadas HTTP a los endpoints de /api/auth.
 * No usa apiClient directamente para el login porque en ese momento
 * aún no hay token (el token es el resultado del login).
 * El resto de llamadas sí usan apiClient para que el interceptor de 401 funcione.
 */
import type { CambioContrasena, LoginCredenciales, LoginRespuesta } from "../types";
import { apiClient } from "./apiClient";

const URL_BASE: string = import.meta.env.VITE_API_URL ?? "http://localhost:5080";

/**
 * Error de autenticación con el mensaje en español del backend.
 * Reutiliza la misma forma que ApiError para que LoginPage lo muestre igual.
 */
export class AuthError extends Error {
  status: number;
  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.name = "AuthError";
    this.status = status;
  }
}

/** Extrae el mensaje de un ProblemDetails del backend. */
async function extraerMensaje(resp: Response): Promise<string> {
  try {
    const body = (await resp.json()) as { detail?: string; title?: string };
    return body.detail ?? body.title ?? "No se pudo completar la operación.";
  } catch {
    return "No se pudo completar la operación.";
  }
}

/**
 * Inicia sesión con correo y contraseña.
 * POST /api/auth/login — endpoint anónimo.
 * // LOGIN
 */
export async function login(credenciales: LoginCredenciales): Promise<LoginRespuesta> {
  let resp: Response;
  try {
    resp = await fetch(`${URL_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(credenciales),
    });
  } catch {
    throw new AuthError("No se pudo conectar con el servidor. Verifica que la API esté encendida.", 0);
  }

  if (!resp.ok) {
    const msg = await extraerMensaje(resp);
    throw new AuthError(msg, resp.status);
  }
  return resp.json() as Promise<LoginRespuesta>;
}

/**
 * Acceso de demostración: el backend asigna el rol pedido sin contraseña.
 * POST /api/auth/demo — solo existe en modo desarrollo (ver AuthController).
 * // LOGIN
 */
export async function loginDemo(rol: string): Promise<LoginRespuesta> {
  let resp: Response;
  try {
    resp = await fetch(`${URL_BASE}/api/auth/demo`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ rol }),
    });
  } catch {
    throw new AuthError("No se pudo conectar con el servidor.", 0);
  }

  if (!resp.ok) {
    const msg = await extraerMensaje(resp);
    throw new AuthError(msg, resp.status);
  }
  return resp.json() as Promise<LoginRespuesta>;
}

/**
 * Cambia la contraseña del usuario autenticado.
 * PATCH /api/auth/contrasena — requiere token Bearer (enviado por apiClient).
 * // LOGIN
 */
export async function cambiarContrasena(datos: CambioContrasena): Promise<void> {
  // apiClient.patch ya añade el token Bearer y lanza ApiError en caso de error
  await apiClient.patch<void>("/api/auth/contrasena", datos);
}

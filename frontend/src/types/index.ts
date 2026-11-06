// Tipos y catálogos compartidos. Reflejan los DTOs que devuelve el backend (en camelCase).

export const ROLES = ["Solicitante", "Administrador", "ResponsableAmbiente"] as const;
export const ESTADOS_AMBIENTE = ["Disponible", "Mantenimiento", "Inactivo"] as const;
export const ESTADOS_RESERVA = ["Pendiente", "Aprobada", "Rechazada", "Cancelada"] as const;

export type RolUsuario = (typeof ROLES)[number];
export type EstadoAmbiente = (typeof ESTADOS_AMBIENTE)[number];
export type EstadoReserva = (typeof ESTADOS_RESERVA)[number];

/** Formatea el rol institucional para mostrar en pantalla con texto legible ("Responsable de ambiente"). */
export function formatearRol(rol?: string | RolUsuario | null): string {
  if (!rol) return "";
  if (rol === "ResponsableAmbiente") return "Responsable de ambiente";
  return rol;
}

/** Usuario (RF-01). */
export interface Usuario {
  id: string;
  nombreCompleto: string;
  correo: string;
  rol: RolUsuario;
  activo: boolean;
}
export interface UsuarioCrear {
  nombreCompleto: string;
  correo: string;
  rol: string;
  activo: boolean;
  contrasena?: string;
}

/** Sesión de usuario autenticado en el frontend. // LOGIN */
export interface UsuarioSesion {
  id: string;
  nombreCompleto: string;
  correo: string;
  rol: RolUsuario;
}

/** Respuesta de inicio de sesión del backend con JWT. // LOGIN */
export interface LoginRespuesta {
  token: string;
  expiracion: string;
  id: string;
  nombreCompleto: string;
  correo: string;
  rol: RolUsuario;
}

/** Credenciales de login. // LOGIN */
export interface LoginCredenciales {
  correo: string;
  contrasena: string;
}

/** Petición de cambio de contraseña. // LOGIN */
export interface CambioContrasena {
  actual: string;
  nueva: string;
}

/** Ambiente (RF-02). */
export interface Ambiente {
  id: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  ubicacion: string;
  estado: EstadoAmbiente;
}
export interface AmbienteCrear {
  nombre: string;
  tipo: string;
  capacidad: number;
  ubicacion: string;
  estado: string;
}

/** Reserva (RF-03, RF-05, RF-06). Fecha "AAAA-MM-DD", horas "HH:mm". */
export interface Reserva {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado: EstadoReserva;
  usuarioId: string;
  usuarioNombre: string;
  ambienteId: string;
  ambienteNombre: string;
}
export interface ReservaCrear {
  usuarioId: string;
  ambienteId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
}

/** Respuesta de RF-04. */
export interface Disponibilidad {
  disponible: boolean;
  mensaje: string;
  codigo: string;
}

/** Filtros del listado de reservas (RF-05). Cadena vacía = sin filtro. */
export interface FiltroReservas {
  estado: string;
  ambienteId: string;
  fecha: string;
}

/** Dashboard (RF-08). */
export interface AmbienteUso {
  ambienteId: string;
  nombre: string;
  totalReservas: number;
}
export interface Dashboard {
  total: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  ambienteMasUtilizado: AmbienteUso | null;
}

/** Mensaje que las páginas muestran con AlertMessage. */
export interface Mensaje {
  tipo: "error" | "exito" | "info";
  texto: string;
}

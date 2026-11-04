import type { Usuario, UsuarioCrear } from "../types";
import { apiClient } from "./apiClient";

/** Llamadas a la API de usuarios (RF-01). Las páginas usan este servicio, nunca fetch directo. */
export const usuariosService = {
  /** RF-01: registra un usuario. */
  crear: (datos: UsuarioCrear) => apiClient.post<Usuario>("/api/usuarios", datos),
  /** Lista todos los usuarios. */
  listar: () => apiClient.get<Usuario[]>("/api/usuarios"),
};

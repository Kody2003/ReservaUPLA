/**
 * RutaProtegida — Componente guardián de rutas (FASE 3 y FASE 4 / AJUSTE 2).
 *
 * Qué hace:
 *  - Mientras AuthContext valida el token guardado en sessionStorage (cargando=true),
 *    muestra un spinner para evitar un parpadeo de redirección.
 *  - Si no hay usuario autenticado, redirige a /login.
 *  - Si se pasa rolesPermitidos y el rol del usuario no está incluido:
 *    redirige a la página de inicio que le corresponde según el AJUSTE 2:
 *      · Administrador → "/" (Dashboard)
 *      · Solicitante y ResponsableAmbiente → "/reservas" ("Mis reservas" o "Reservas")
 *  - Si todo está en orden, renderiza las rutas hijas mediante <Outlet />.
 */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import type { RolUsuario } from "../../types";

interface Props {
  /** Lista de roles con permiso para acceder. Si no se indica, cualquier autenticado entra. */
  rolesPermitidos?: RolUsuario[];
}

export function RutaProtegida({ rolesPermitidos }: Props) {
  const { usuario, cargando } = useAuth();

  // Espera a que termine la validación inicial del token
  if (cargando) {
    return (
      <div className="spinner-contenedor" role="status" aria-label="Verificando sesión…">
        <div className="spinner" />
      </div>
    );
  }

  // Sin sesión: redirige al login sin agregar entrada al historial
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // AJUSTE 2: Si el rol no está permitido en esta ruta, redirige a su página de inicio
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    const rutaInicio = usuario.rol === "Administrador" ? "/" : "/reservas";
    return <Navigate to={rutaInicio} replace />;
  }

  return <Outlet />;
}

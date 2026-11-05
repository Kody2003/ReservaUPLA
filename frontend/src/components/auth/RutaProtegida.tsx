/**
 * RutaProtegida — Componente guardián de rutas (FASE 3 — LOGIN).
 *
 * Qué hace:
 *  - Mientras AuthContext valida el token guardado en sessionStorage (cargando=true),
 *    muestra un spinner para evitar un parpadeo de redirección.
 *  - Si no hay usuario autenticado, redirige silenciosamente a /login.
 *  - Si se pasa la prop rolRequerido y el rol del usuario no coincide,
 *    muestra un mensaje de acceso denegado (403) con enlace para volver.
 *  - Si todo está bien, renderiza las rutas hijas mediante <Outlet />.
 *
 * Uso en App.tsx:
 *   <Route element={<RutaProtegida />}>
 *     <Route index element={<DashboardPage />} />
 *     ...
 *   </Route>
 */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import type { RolUsuario } from "../../types";

interface Props {
  /** Si se indica, solo los usuarios con ese rol pueden pasar. // RN-05 */
  rolRequerido?: RolUsuario;
}

export function RutaProtegida({ rolRequerido }: Props) {
  const { usuario, cargando } = useAuth();

  // Mientras AuthContext valida el token inicial mostramos un spinner
  if (cargando) {
    return (
      <div className="spinner-contenedor" role="status" aria-label="Verificando sesión…">
        <div className="spinner" />
      </div>
    );
  }

  // Sin sesión: redirigir al login sin dejar historia de navegación (replace)
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Rol insuficiente: mostrar mensaje de acceso denegado // RN-05
  if (rolRequerido && usuario.rol !== rolRequerido) {
    return (
      <main style={{ padding: "2rem", maxWidth: 500, margin: "0 auto" }}>
        <h2>Acceso denegado</h2>
        <p>No tienes permiso para ver esta página. Esta sección es solo para <strong>{rolRequerido}</strong>.</p>
        <a href="/" className="btn btn-secundario" style={{ display: "inline-block", marginTop: "1rem" }}>
          Volver al inicio
        </a>
      </main>
    );
  }

  // Todo correcto: renderiza la ruta hija
  return <Outlet />;
}

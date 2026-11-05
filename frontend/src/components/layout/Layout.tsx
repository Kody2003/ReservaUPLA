/**
 * Layout — Estructura común de todas las páginas (FASE 3: actualizado).
 *
 * Cambios respecto a la versión anterior:
 *   - Se eliminó AdminKeyPanel (ya no existe la clave X-Admin-Key).
 *   - Se muestra el nombre del usuario autenticado y su rol en la cabecera.
 *   - El botón "Cerrar sesión" llama a cerrarSesion() del AuthContext.
 *   - La navegación muestra todas las pestañas; en Fase 4 se filtrará por rol.
 *
 * La reescritura completa con logo UPLA, modo oscuro toggle y menú desplegable
 * se realiza en la Fase 4. // LOGIN
 */
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function Layout() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <div className="app">
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>

      <header className="cabecera">
        <div className="cabecera-fila">
          <h1 className="marca">ReservaUPLA</h1>

          {/* Información del usuario autenticado + cerrar sesión // LOGIN */}
          {usuario && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingBottom: "0.4rem" }}>
              <span style={{ color: "#cfdbe8", fontSize: "0.9rem" }}>
                <strong style={{ color: "#fff" }}>{usuario.nombreCompleto}</strong>
                &nbsp;·&nbsp;
                <span style={{ opacity: 0.8 }}>{usuario.rol}</span>
              </span>
              <button
                onClick={cerrarSesion}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                  borderRadius: "6px",
                  padding: "0.3rem 0.75rem",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>

        <nav aria-label="Principal" className="menu">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/reservas">Reservas</NavLink>
          <NavLink to="/ambientes">Ambientes</NavLink>
          <NavLink to="/usuarios">Usuarios</NavLink>
        </nav>
      </header>

      <main id="contenido" className="contenido">
        <Outlet />
      </main>

      <footer className="pie">
        Reserva de ambientes · actividad individual de Construcción de Software
      </footer>
    </div>
  );
}

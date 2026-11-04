import { NavLink, Outlet } from "react-router-dom";
import { AdminKeyPanel } from "./AdminKeyPanel";

/**
 * Estructura común de todas las páginas: cabecera con el menú, el panel de administrador,
 * el contenido (Outlet = la página actual) y un pie. Incluye un enlace para saltar al contenido (accesibilidad).
 */
export function Layout() {
  return (
    <div className="app">
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>
      <header className="cabecera">
        <div className="cabecera-fila">
          <h1 className="marca">ReservaUPLA</h1>
          <AdminKeyPanel />
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

      <footer className="pie">Reserva de ambientes · actividad individual de Construcción de Software</footer>
    </div>
  );
}

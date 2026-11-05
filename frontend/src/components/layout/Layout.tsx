/**
 * Layout — Barra superior rediseñada institucional UPLA (AJUSTE B).
 *
 * Estructura de la barra fija superior (position: sticky; top: 0):
 *   · Izquierda:
 *       - Logo UPLA (~48px de alto), sin caja ni fondo.
 *       - "ReservaUPLA" en tamaño grande (~24px, negrita).
 *       - "UNIVERSIDAD PERUANA LOS ANDES" en mayúsculas pequeñas y color suave.
 *   · Centro / izquierda:
 *       - Pestañas en una sola fila, texto blanco suave.
 *       - Pestaña activa: negrita con línea inferior de 3px en azul claro (#5AA9E6) y esquinas superiores redondeadas (sin recuadro blanco).
 *       - Pestañas inactivas: texto blanco suave que se aclara en hover.
 *       - Foco de teclado visible.
 *   · Derecha:
 *       - Botón interactivo "Modo oscuro / Modo claro" con ícono luna/sol.
 *       - Separador vertical fino.
 *       - Chip de usuario con avatar de iniciales, nombre, rol, flecha y menú desplegable accesible.
 *   · Responsive:
 *       - < 900px: se oculta el subtítulo universitario y se compacta el chip.
 *       - < 640px: la barra se compacta y las pestañas se desplazan horizontalmente (overflow-x: auto) sin romper el diseño.
 *   · Pestañas según rol:
 *       - Administrador: Dashboard, Reservas, Ambientes, Usuarios.
 *       - Responsable de Ambiente: Reservas, Ambientes.
 *       - Solicitante: Mis reservas, Nueva reserva.
 */
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTema } from "../../contexts/TemaContext";
import { MenuUsuario } from "./MenuUsuario";

/** Ícono de sol (SVG inline) para modo claro. */
function IconoSol() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/** Ícono de luna (SVG inline) para modo oscuro. */
function IconoLuna() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function Layout() {
  const { usuario } = useAuth();
  const { temaEfectivo, setTema } = useTema();

  const esOscuro = temaEfectivo === "oscuro";

  function alternarTema() {
    setTema(esOscuro ? "claro" : "oscuro");
  }

  return (
    <div className="app">
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>

      {/* Barra superior fija institucional (AJUSTE B) */}
      <header className="cabecera-upla">
        <div className="cabecera-upla-contenedor">
          {/* Bloque Izquierdo + Centro: Logo, Título y Pestañas */}
          <div className="cabecera-seccion-principal">
            {/* Logo y títulos de la UPLA */}
            <div className="cabecera-marca-grupo">
              <img
                src="/img/upla-logo.png"
                alt="Logo UPLA"
                className="cabecera-logo-upla"
              />
              <div className="cabecera-titulos">
                <span className="cabecera-titulo-app">ReservaUPLA</span>
                <span className="cabecera-subtitulo-upla">UNIVERSIDAD PERUANA LOS ANDES</span>
              </div>
            </div>

            {/* Pestañas de navegación en una sola fila */}
            <nav aria-label="Navegación principal" className="cabecera-nav-tabs">
              {usuario?.rol === "Administrador" && (
                <>
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) => `cabecera-tab-item ${isActive ? "tab-activa" : ""}`}
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/reservas"
                    className={({ isActive }) => `cabecera-tab-item ${isActive ? "tab-activa" : ""}`}
                  >
                    Reservas
                  </NavLink>
                  <NavLink
                    to="/ambientes"
                    className={({ isActive }) => `cabecera-tab-item ${isActive ? "tab-activa" : ""}`}
                  >
                    Ambientes
                  </NavLink>
                  <NavLink
                    to="/usuarios"
                    className={({ isActive }) => `cabecera-tab-item ${isActive ? "tab-activa" : ""}`}
                  >
                    Usuarios
                  </NavLink>
                </>
              )}

              {usuario?.rol === "ResponsableAmbiente" && (
                <>
                  <NavLink
                    to="/reservas"
                    className={({ isActive }) => `cabecera-tab-item ${isActive ? "tab-activa" : ""}`}
                  >
                    Reservas
                  </NavLink>
                  <NavLink
                    to="/ambientes"
                    className={({ isActive }) => `cabecera-tab-item ${isActive ? "tab-activa" : ""}`}
                  >
                    Ambientes
                  </NavLink>
                </>
              )}

              {usuario?.rol === "Solicitante" && (
                <>
                  <NavLink
                    to="/reservas"
                    className={({ isActive }) => `cabecera-tab-item ${isActive ? "tab-activa" : ""}`}
                  >
                    Mis reservas
                  </NavLink>
                  <NavLink
                    to="/reservas/nueva"
                    className={({ isActive }) => `cabecera-tab-item ${isActive ? "tab-activa" : ""}`}
                  >
                    Nueva reserva
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Bloque Derecho: Selector de tema y Chip de usuario */}
          <div className="cabecera-acciones-derecha">
            <button
              type="button"
              className="btn-tema-cabecera"
              onClick={alternarTema}
              aria-label={esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title={esOscuro ? "Modo claro" : "Modo oscuro"}
            >
              {esOscuro ? <IconoSol /> : <IconoLuna />}
              <span className="btn-tema-texto">{esOscuro ? "Modo claro" : "Modo oscuro"}</span>
            </button>

            <div className="cabecera-separador-vertical" aria-hidden="true" />

            <MenuUsuario />
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main id="contenido" className="contenido">
        <Outlet />
      </main>

      <footer className="pie">
        Reserva de ambientes · Universidad Peruana Los Andes · Construcción de Software
      </footer>
    </div>
  );
}

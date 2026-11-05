/**
 * Layout — Barra superior rediseñada institucional UPLA (BLOQUE 0 y BLOQUE 2).
 *
 * Correcciones de navegación (BLOQUE 0):
 *   · Se implementó lógica de ruta activa con useLocation para evitar que "Mis reservas"
 *     y "Nueva reserva" aparezcan activas simultáneamente en /reservas/nueva.
 *   · "Mis reservas" / "Reservas" queda activa en /reservas y en /reservas/:id (detalle),
 *     pero NUNCA en /reservas/nueva.
 *   · "Nueva reserva" se activa ÚNICAMENTE en /reservas/nueva.
 *   · aria-current="page" se asigna estrictamente a la única pestaña activa.
 *
 * Íconos integrados (BLOQUE 2):
 *   · Se agregaron íconos contextuales con Icono.tsx a las pestañas y botón de tema.
 */
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTema } from "../../contexts/TemaContext";
import { Icono } from "../ui/Icono";
import { MenuUsuario } from "./MenuUsuario";

export function Layout() {
  const { usuario } = useAuth();
  const { temaEfectivo, setTema } = useTema();
  const { pathname } = useLocation();

  const esOscuro = temaEfectivo === "oscuro";

  function alternarTema() {
    setTema(esOscuro ? "claro" : "oscuro");
  }

  /**
   * Determinación estricta de la pestaña activa (BLOQUE 0):
   * Garantiza que exista UNA SOLA pestaña activa en cualquier momento.
   */
  function esRutaActiva(tipo: "dashboard" | "reservas" | "nueva-reserva" | "ambientes" | "usuarios"): boolean {
    switch (tipo) {
      case "dashboard":
        return pathname === "/";
      case "reservas":
        // Activa en el listado /reservas y en el detalle /reservas/:id, pero NO en /reservas/nueva
        return pathname === "/reservas" || (pathname.startsWith("/reservas/") && pathname !== "/reservas/nueva");
      case "nueva-reserva":
        return pathname === "/reservas/nueva";
      case "ambientes":
        return pathname.startsWith("/ambientes");
      case "usuarios":
        return pathname.startsWith("/usuarios");
      default:
        return false;
    }
  }

  return (
    <div className="app">
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>

      {/* Barra superior fija institucional */}
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

            {/* Pestañas de navegación en una sola fila (BLOQUE 0) */}
            <nav aria-label="Navegación principal" className="cabecera-nav-tabs">
              {usuario?.rol === "Administrador" && (
                <>
                  <Link
                    to="/"
                    className={`cabecera-tab-item ${esRutaActiva("dashboard") ? "tab-activa" : ""}`}
                    aria-current={esRutaActiva("dashboard") ? "page" : undefined}
                  >
                    <Icono nombre="informe" tamano={16} style={{ marginRight: "0.4rem" }} />
                    Dashboard
                  </Link>
                  <Link
                    to="/reservas"
                    className={`cabecera-tab-item ${esRutaActiva("reservas") ? "tab-activa" : ""}`}
                    aria-current={esRutaActiva("reservas") ? "page" : undefined}
                  >
                    <Icono nombre="calendario" tamano={16} style={{ marginRight: "0.4rem" }} />
                    Reservas
                  </Link>
                  <Link
                    to="/ambientes"
                    className={`cabecera-tab-item ${esRutaActiva("ambientes") ? "tab-activa" : ""}`}
                    aria-current={esRutaActiva("ambientes") ? "page" : undefined}
                  >
                    <Icono nombre="edificio" tamano={16} style={{ marginRight: "0.4rem" }} />
                    Ambientes
                  </Link>
                  <Link
                    to="/usuarios"
                    className={`cabecera-tab-item ${esRutaActiva("usuarios") ? "tab-activa" : ""}`}
                    aria-current={esRutaActiva("usuarios") ? "page" : undefined}
                  >
                    <Icono nombre="usuario" tamano={16} style={{ marginRight: "0.4rem" }} />
                    Usuarios
                  </Link>
                </>
              )}

              {usuario?.rol === "ResponsableAmbiente" && (
                <>
                  <Link
                    to="/reservas"
                    className={`cabecera-tab-item ${esRutaActiva("reservas") ? "tab-activa" : ""}`}
                    aria-current={esRutaActiva("reservas") ? "page" : undefined}
                  >
                    <Icono nombre="calendario" tamano={16} style={{ marginRight: "0.4rem" }} />
                    Reservas
                  </Link>
                  <Link
                    to="/ambientes"
                    className={`cabecera-tab-item ${esRutaActiva("ambientes") ? "tab-activa" : ""}`}
                    aria-current={esRutaActiva("ambientes") ? "page" : undefined}
                  >
                    <Icono nombre="edificio" tamano={16} style={{ marginRight: "0.4rem" }} />
                    Ambientes
                  </Link>
                </>
              )}

              {usuario?.rol === "Solicitante" && (
                <>
                  <Link
                    to="/reservas"
                    className={`cabecera-tab-item ${esRutaActiva("reservas") ? "tab-activa" : ""}`}
                    aria-current={esRutaActiva("reservas") ? "page" : undefined}
                  >
                    <Icono nombre="calendario" tamano={16} style={{ marginRight: "0.4rem" }} />
                    Mis reservas
                  </Link>
                  <Link
                    to="/reservas/nueva"
                    className={`cabecera-tab-item ${esRutaActiva("nueva-reserva") ? "tab-activa" : ""}`}
                    aria-current={esRutaActiva("nueva-reserva") ? "page" : undefined}
                  >
                    <Icono nombre="mas" tamano={16} style={{ marginRight: "0.4rem" }} />
                    Nueva reserva
                  </Link>
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
              <Icono nombre={esOscuro ? "sol" : "luna"} tamano={17} />
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

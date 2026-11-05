/**
 * MenuUsuario — Menú desplegable accesible del usuario autenticado (FASE 4).
 *
 * Características:
 *  - Chip con avatar de iniciales (e.g. "MQ"), nombre completo, rol y flecha indicadora.
 *  - Accesibilidad WAI-ARIA completa:
 *      · aria-haspopup="menu" y aria-expanded en el botón activador.
 *      · role="menu" en el contenedor desplegable.
 *      · role="menuitem" en cada acción interactiva.
 *      · role="separator" en la línea divisoria.
 *  - Interacción por teclado:
 *      · Escape: cierra el menú y devuelve el foco al botón activador.
 *      · Flechas Arriba/Abajo: navega cíclicamente entre las opciones del menú.
 *      · Inicio / Fin: salta al primer o último elemento.
 *      · Clic fuera: cierra el menú automáticamente.
 *  - Opciones:
 *      1. Configuración (/configuracion)
 *      2. Cambiar contraseña (/cambiar-contrasena)
 *      — Separador —
 *      3. Cerrar sesión (destacada en color de peligro // LOGIN)
 */
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

/** Obtiene hasta 2 iniciales en mayúsculas a partir del nombre completo. */
function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "U";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

/** Icono de tuerca / engranaje para Configuración. */
function IconoConfiguracion() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

/** Icono de llave para Cambiar Contraseña. */
function IconoLlave() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}

/** Icono de salida para Cerrar Sesión. */
function IconoCerrarSesion() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/** Icono de flecha (chevron hacia abajo). */
function IconoFlecha({ rotada }: { rotada: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: "transform 0.2s ease",
        transform: rotada ? "rotate(180deg)" : "rotate(0deg)",
      }}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function MenuUsuario() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const [abierto, setAbierto] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  if (!usuario) return null;

  const iniciales = obtenerIniciales(usuario.nombreCompleto);

  // Cierra el menú al hacer clic fuera
  useEffect(() => {
    if (!abierto) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setAbierto(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [abierto]);

  // Manejo de teclado accesible para el menú desplegable (WAI-ARIA Menu Pattern)
  function handleKeyDownMenu(e: KeyboardEvent<HTMLDivElement>) {
    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    if (!items || items.length === 0) return;

    const listaItems = Array.from(items);
    const indiceActual = listaItems.indexOf(document.activeElement as HTMLButtonElement);

    if (e.key === "Escape") {
      e.preventDefault();
      setAbierto(false);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const siguiente = indiceActual < listaItems.length - 1 ? indiceActual + 1 : 0;
      listaItems[siguiente].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const anterior = indiceActual > 0 ? indiceActual - 1 : listaItems.length - 1;
      listaItems[anterior].focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      listaItems[0].focus();
    } else if (e.key === "End") {
      e.preventDefault();
      listaItems[listaItems.length - 1].focus();
    } else if (e.key === "Tab") {
      // Tab fuera del menú lo cierra ordenadamente
      setAbierto(false);
    }
  }

  function irA(ruta: string) {
    setAbierto(false);
    navigate(ruta);
  }

  function ejecutarCerrarSesion() {
    setAbierto(false);
    cerrarSesion();
  }

  return (
    <div className="contenedor-menu-usuario">
      {/* Botón Chip de Usuario */}
      <button
        ref={triggerRef}
        type="button"
        className={`chip-usuario ${abierto ? "chip-activo" : ""}`}
        onClick={() => setAbierto((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls="menu-desplegable-usuario"
        aria-label={`Menú de usuario de ${usuario.nombreCompleto}`}
      >
        <span className="avatar-iniciales" aria-hidden="true">
          {iniciales}
        </span>
        <div className="usuario-datos-columna">
          <span className="usuario-nombre">{usuario.nombreCompleto}</span>
          <span className="usuario-rol">{usuario.rol}</span>
        </div>
        <IconoFlecha rotada={abierto} />
      </button>

      {/* Menú Flotante */}
      {abierto && (
        <div
          ref={menuRef}
          id="menu-desplegable-usuario"
          className="menu-desplegable"
          role="menu"
          aria-label="Opciones de cuenta"
          onKeyDown={handleKeyDownMenu}
        >
          <button
            type="button"
            role="menuitem"
            className="menu-desplegable-item"
            onClick={() => irA("/configuracion")}
          >
            <IconoConfiguracion />
            <span>Configuración</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className="menu-desplegable-item"
            onClick={() => irA("/cambiar-contrasena")}
          >
            <IconoLlave />
            <span>Cambiar contraseña</span>
          </button>

          <div className="menu-desplegable-separador" role="separator" />

          <button
            type="button"
            role="menuitem"
            className="menu-desplegable-item menu-item-peligro"
            onClick={ejecutarCerrarSesion}
          >
            <IconoCerrarSesion />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}

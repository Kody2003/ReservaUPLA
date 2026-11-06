/**
 * MenuUsuario — Menú desplegable accesible del usuario autenticado (BLOQUE 2).
 *
 * Utiliza Icono.tsx para los íconos de cada opción (engranaje, candado, salida, flecha).
 */
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Icono } from "../ui/Icono";
import { formatearRol } from "../../types";

/** Obtiene hasta 2 iniciales en mayúsculas a partir del nombre completo. */
function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "U";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

export function MenuUsuario() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const [abierto, setAbierto] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  if (!usuario) return null;

  const iniciales = obtenerIniciales(usuario.nombreCompleto);

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
          <span className="usuario-rol">{formatearRol(usuario.rol)}</span>
        </div>
        <Icono
          nombre="flecha"
          tamano={14}
          style={{
            transition: "transform 0.2s ease",
            transform: abierto ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
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
            <Icono nombre="engranaje" tamano={16} aria-hidden="true" />
            <span>Configuración</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className="menu-desplegable-item"
            onClick={() => irA("/cambiar-contrasena")}
          >
            <Icono nombre="candado" tamano={16} aria-hidden="true" />
            <span>Cambiar contraseña</span>
          </button>

          <div className="menu-desplegable-separador" role="separator" />

          <button
            type="button"
            role="menuitem"
            className="menu-desplegable-item menu-item-peligro"
            onClick={ejecutarCerrarSesion}
          >
            <Icono nombre="salida" tamano={16} aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}

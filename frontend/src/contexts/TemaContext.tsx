/**
 * TemaContext — Contexto de modo claro/oscuro (FASE 3).
 *
 * Qué hace:
 *  - Expone el tema elegido ('claro' | 'oscuro' | 'sistema') y el que realmente
 *    está activo ('claro' | 'oscuro') resolviendo 'sistema' según prefers-color-scheme.
 *  - Escribe la preferencia en localStorage para que el script anti-parpadeo
 *    de index.html la lea antes de que React hidrate.
 *  - Aplica el atributo data-tema en <html> para que las variables CSS del
 *    modo oscuro se activen (selector html[data-tema="oscuro"] en index.css).
 *  - Se suscribe al MediaQuery para reaccionar si el usuario cambia el tema
 *    del SO mientras la pestaña está abierta.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Opciones de tema que el usuario puede elegir. */
export type OpcionTema = "claro" | "oscuro" | "sistema";

/** Valor que el contexto expone a los componentes. */
export interface TemaContextType {
  /** Lo que el usuario eligió (puede ser 'sistema'). */
  tema: OpcionTema;
  /** Lo que realmente está activo ahora ('claro' u 'oscuro'). */
  temaEfectivo: "claro" | "oscuro";
  /** Cambia la preferencia y la guarda en localStorage. */
  setTema: (t: OpcionTema) => void;
}

const TemaContext = createContext<TemaContextType | null>(null);
const LLAVE_LOCAL = "reservaupla.tema";

/** Resuelve si el sistema operativo prefiere modo oscuro. */
function sistemaEsOscuro(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Lee la preferencia guardada; devuelve 'sistema' si no existe o hay error. */
function leerPreferencia(): OpcionTema {
  try {
    const v = localStorage.getItem(LLAVE_LOCAL);
    if (v === "claro" || v === "oscuro" || v === "sistema") return v;
  } catch {
    // localStorage bloqueado (modo privado estricto)
  }
  return "sistema";
}

/** Aplica data-tema en <html> para activar los estilos CSS correspondientes. */
function aplicarEnHtml(efectivo: "claro" | "oscuro"): void {
  document.documentElement.setAttribute("data-tema", efectivo);
}

/** Proveedor: envuelve la aplicación en main.tsx. */
export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaEstado] = useState<OpcionTema>(leerPreferencia);

  // Calcula si el modo efectivo es claro u oscuro resolviendo 'sistema'
  const temaEfectivo: "claro" | "oscuro" = useMemo(() => {
    if (tema === "sistema") return sistemaEsOscuro() ? "oscuro" : "claro";
    return tema;
  }, [tema]);

  // Cada vez que cambia el tema efectivo, actualiza el atributo en <html>
  useEffect(() => {
    aplicarEnHtml(temaEfectivo);
  }, [temaEfectivo]);

  // Escucha cambios del SO mientras la pestaña está abierta (solo cuando tema === 'sistema')
  useEffect(() => {
    if (tema !== "sistema") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => aplicarEnHtml(mq.matches ? "oscuro" : "claro");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [tema]);

  /** Guarda la nueva preferencia en localStorage y actualiza el estado. */
  const setTema = useCallback((nueva: OpcionTema) => {
    try {
      localStorage.setItem(LLAVE_LOCAL, nueva);
    } catch {
      // Sin acceso a localStorage: el cambio igual se aplica en la sesión actual
    }
    setTemaEstado(nueva);
  }, []);

  return (
    <TemaContext.Provider value={{ tema, temaEfectivo, setTema }}>
      {children}
    </TemaContext.Provider>
  );
}

/**
 * Hook para consumir el contexto de tema desde cualquier componente.
 * Lanza error si se usa fuera de TemaProvider.
 */
export function useTema(): TemaContextType {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error("useTema debe usarse dentro de <TemaProvider>");
  return ctx;
}

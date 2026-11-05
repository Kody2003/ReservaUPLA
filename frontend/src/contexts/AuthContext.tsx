/**
 * AuthContext — Contexto de autenticación (FASE 3 — LOGIN).
 *
 * Qué hace:
 *  - Almacena el token JWT y los datos del usuario autenticado.
 *  - Usa sessionStorage (no localStorage) porque:
 *      · El token queda aislado por pestaña: si el usuario abre otra pestaña,
 *        no hereda automáticamente la sesión (reduce superficie XSS).
 *      · Al cerrar el navegador el token desaparece, lo que es más seguro que
 *        localStorage para tokens de acceso de corta duración.
 *  - Al montar, si hay un token en sessionStorage, lo valida llamando a
 *    GET /api/auth/yo. Si el backend responde 401 (token expirado o inválido)
 *    limpia la sesión y el usuario vuelve al login.
 *  - Expone iniciarSesion() y cerrarSesion() para LoginPage y el menú de usuario.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { LoginRespuesta, UsuarioSesion } from "../types";

const LLAVE_TOKEN   = "reservaupla.token";
const LLAVE_USUARIO = "reservaupla.usuario";

/** Valor que el contexto expone a los componentes. */
export interface AuthContextType {
  /** Datos del usuario autenticado, o null si no hay sesión activa. */
  usuario: UsuarioSesion | null;
  /** Token JWT en curso, o null. */
  token: string | null;
  /**
   * Guarda token y datos del usuario tras un login exitoso.
   * Se llama desde LoginPage con la respuesta del backend.
   */
  iniciarSesion: (resp: LoginRespuesta) => void;
  /** Elimina la sesión y redirige al login. */
  cerrarSesion: () => void;
  /** True mientras se valida el token guardado en sessionStorage al arrancar. */
  cargando: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Lee el token de sessionStorage de forma segura. */
function leerToken(): string | null {
  try { return sessionStorage.getItem(LLAVE_TOKEN); }
  catch { return null; }
}

/** Lee el usuario de sessionStorage de forma segura. */
function leerUsuario(): UsuarioSesion | null {
  try {
    const raw = sessionStorage.getItem(LLAVE_USUARIO);
    return raw ? (JSON.parse(raw) as UsuarioSesion) : null;
  } catch { return null; }
}

/** Guarda token y usuario en sessionStorage. */
function guardarSesion(token: string, usuario: UsuarioSesion): void {
  try {
    sessionStorage.setItem(LLAVE_TOKEN, token);
    sessionStorage.setItem(LLAVE_USUARIO, JSON.stringify(usuario));
  } catch {
    // sessionStorage no disponible: la sesión vive solo en memoria
  }
}

/** Elimina la sesión de sessionStorage. */
function limpiarSesion(): void {
  try {
    sessionStorage.removeItem(LLAVE_TOKEN);
    sessionStorage.removeItem(LLAVE_USUARIO);
  } catch { /* nada */ }
}

const URL_BASE: string = import.meta.env.VITE_API_URL ?? "http://localhost:5080";

/** Proveedor: envuelve la aplicación en main.tsx. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken]     = useState<string | null>(leerToken);
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(leerUsuario);
  const [cargando, setCargando] = useState<boolean>(true);

  /**
   * Al montar: valida el token guardado en sessionStorage.
   * Si el backend responde con 401 (token inválido o expirado), cierra la sesión.
   * Si hay error de red, deja la sesión en caché para no bloquear al usuario.
   */
  useEffect(() => {
    const tokenGuardado = leerToken();
    if (!tokenGuardado) {
      setCargando(false);
      return;
    }

    // Llama al endpoint protegido para verificar que el token sigue siendo válido
    fetch(`${URL_BASE}/api/auth/yo`, {
      headers: { Authorization: `Bearer ${tokenGuardado}` },
    })
      .then((r) => {
        if (r.status === 401) {
          // Token expirado o inválido: limpia la sesión
          limpiarSesion();
          setToken(null);
          setUsuario(null);
        }
        // 200: sesión en caché sigue siendo válida; no hace falta actualizar el estado
        // porque ya se leyó de sessionStorage en el useState inicial
      })
      .catch(() => {
        // Error de red: mantenemos la sesión en caché (el usuario puede seguir navegando
        // y el backend rechazará cada petición si el token realmente expiró)
      })
      .finally(() => setCargando(false));
  }, []); // Solo al montar

  /** Almacena la sesión tras un login exitoso. // LOGIN */
  const iniciarSesion = useCallback((resp: LoginRespuesta) => {
    const sesion: UsuarioSesion = {
      id: resp.id,
      nombreCompleto: resp.nombreCompleto,
      correo: resp.correo,
      rol: resp.rol,
    };
    guardarSesion(resp.token, sesion);
    setToken(resp.token);
    setUsuario(sesion);
  }, []);

  /** Cierra la sesión y redirige al login. // LOGIN */
  const cerrarSesion = useCallback(() => {
    limpiarSesion();
    setToken(null);
    setUsuario(null);
    // Redireccionamos con window.location para limpiar todo el estado de React
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, token, iniciarSesion, cerrarSesion, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para consumir el contexto de autenticación desde cualquier componente.
 * Lanza error si se usa fuera de AuthProvider.
 */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

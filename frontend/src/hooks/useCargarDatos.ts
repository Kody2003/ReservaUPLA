import { useCallback, useEffect, useState } from "react";
import { obtenerMensajeError } from "../services/apiClient";

/**
 * Hook que carga datos desde la API y lleva la cuenta de "cargando" y "error".
 * Existe para que cada página no repita el mismo useEffect + try/catch.
 *
 * IMPORTANTE: la función "cargar" debe ser estable (envuélvela en useCallback), si no,
 * el hook volvería a pedir los datos en cada render.
 *
 * @returns datos (o null mientras carga), cargando, error (texto) y recargar().
 */
export function useCargarDatos<T>(cargar: () => Promise<T>) {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false; // evita actualizar el estado si la página ya cambió
    setCargando(true);
    setError("");

    cargar()
      .then((resultado) => {
        if (!cancelado) setDatos(resultado);
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(obtenerMensajeError(e));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [cargar, version]);

  /** Vuelve a pedir los datos (por ejemplo, después de guardar un registro nuevo). */
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  return { datos, cargando, error, recargar };
}

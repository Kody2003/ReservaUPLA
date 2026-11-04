import type { ReactNode } from "react";

/** Define una columna: su encabezado y cómo dibujar la celda a partir de la fila. */
export interface Columna<T> {
  encabezado: string;
  render: (fila: T) => ReactNode;
}

interface TableListProps<T> {
  columnas: Columna<T>[];
  filas: T[];
  obtenerClave: (fila: T) => string;
  descripcion: string;
  mensajeVacio?: string;
}

/**
 * Tabla genérica reutilizable. No sabe qué datos muestra: recibe las columnas y las filas.
 * "descripcion" es el título oculto de la tabla para lectores de pantalla.
 */
export function TableList<T>({
  columnas, filas, obtenerClave, descripcion, mensajeVacio = "No hay registros para mostrar.",
}: TableListProps<T>) {
  if (filas.length === 0) return <p className="vacio">{mensajeVacio}</p>;

  return (
    <div className="tabla-contenedor">
      <table className="tabla">
        <caption className="solo-lectores">{descripcion}</caption>
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c.encabezado} scope="col">
                {c.encabezado}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={obtenerClave(fila)}>
              {columnas.map((c) => (
                <td key={c.encabezado}>{c.render(fila)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

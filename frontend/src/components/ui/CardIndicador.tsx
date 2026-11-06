import type { ReactNode } from "react";

export type VarianteIndicador =
  | "total"
  | "pendientes"
  | "aprobadas"
  | "rechazadas"
  | "info"
  | "aviso"
  | "ok"
  | "error";

export interface CardIndicadorProps {
  titulo: string;
  valor: string | number;
  leyenda?: string;
  descripcion?: string;
  icono?: ReactNode;
  variante?: VarianteIndicador;
  className?: string;
}

/**
 * CardIndicador — Tarjeta estadística reutilizable del Dashboard (RF-08).
 * Renderiza el borde izquierdo coloreado, encabezado con título e ícono,
 * valor grande en negrita y leyenda explicativa inferior.
 */
export function CardIndicador({
  titulo,
  valor,
  leyenda,
  descripcion,
  icono,
  variante = "total",
  className = "",
}: CardIndicadorProps) {
  const textoLeyenda = leyenda ?? descripcion;

  const varianteClase =
    variante === "pendientes" || variante === "aviso"
      ? "pendientes"
      : variante === "aprobadas" || variante === "ok"
      ? "aprobadas"
      : variante === "rechazadas" || variante === "error"
      ? "rechazadas"
      : "total";

  return (
    <div className={`dashboard-stat-card stat-card-${varianteClase} ${className}`.trim()}>
      <div className="stat-card-top">
        <span className="stat-card-titulo">{titulo}</span>
        {icono && (
          <span className={`stat-card-icono stat-icono-${varianteClase}`} aria-hidden="true">
            {icono}
          </span>
        )}
      </div>
      <p className="stat-card-valor">{valor}</p>
      {textoLeyenda && <p className="stat-card-leyenda">{textoLeyenda}</p>}
    </div>
  );
}

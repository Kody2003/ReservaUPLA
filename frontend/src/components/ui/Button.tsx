import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secundario" | "peligro";
  icono?: ReactNode;
}

/**
 * Botón reutilizable con soporte de variante e ícono integrado a la izquierda (BLOQUE 2).
 * Por defecto es type="button" para evitar envíos de formularios no deseados.
 */
export function Button({
  variante = "primario",
  type = "button",
  className = "",
  icono,
  children,
  ...resto
}: ButtonProps) {
  return (
    <button type={type} className={`btn btn-${variante} ${className}`.trim()} {...resto}>
      {icono && (
        <span className="btn-icono-izq" aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", marginRight: "0.45rem" }}>
          {icono}
        </span>
      )}
      {children}
    </button>
  );
}

import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secundario" | "peligro";
}

/**
 * Botón reutilizable. Por defecto es type="button" para que nunca envíe un formulario sin querer;
 * en los formularios se indica type="submit" explícitamente.
 */
export function Button({ variante = "primario", type = "button", className = "", ...resto }: ButtonProps) {
  return <button type={type} className={`btn btn-${variante} ${className}`.trim()} {...resto} />;
}

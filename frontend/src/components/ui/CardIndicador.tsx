interface CardIndicadorProps {
  titulo: string;
  valor: string | number;
  descripcion?: string;
}

/** Tarjeta de un indicador del dashboard (RF-08): un título, un valor grande y una nota opcional. */
export function CardIndicador({ titulo, valor, descripcion }: CardIndicadorProps) {
  return (
    <article className="indicador">
      <h3>{titulo}</h3>
      <p className="indicador-valor">{valor}</p>
      {descripcion && <p className="indicador-nota">{descripcion}</p>}
    </article>
  );
}

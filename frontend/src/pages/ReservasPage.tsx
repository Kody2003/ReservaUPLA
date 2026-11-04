import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { DateInput } from "../components/ui/DateInput";
import { EstadoBadge } from "../components/ui/EstadoBadge";
import { SelectInput } from "../components/ui/SelectInput";
import { TableList } from "../components/ui/TableList";
import { useCargarDatos } from "../hooks/useCargarDatos";
import { ambientesService } from "../services/ambientesService";
import { reservasService } from "../services/reservasService";
import { ESTADOS_RESERVA } from "../types";
import type { FiltroReservas } from "../types";

const OPCIONES_ESTADO = ESTADOS_RESERVA.map((e) => ({ valor: e, texto: e }));
const SIN_FILTROS: FiltroReservas = { estado: "", ambienteId: "", fecha: "" };

/** RF-05: listado de reservas con filtros por estado, ambiente y fecha. Cada fila lleva al detalle (RF-06). */
export function ReservasPage() {
  const [filtros, setFiltros] = useState<FiltroReservas>(SIN_FILTROS);

  // Cada vez que cambian los filtros, "cargar" cambia y el hook vuelve a pedir la lista
  const cargarReservas = useCallback(() => reservasService.listar(filtros), [filtros]);
  const { datos: reservas, cargando, error } = useCargarDatos(cargarReservas);

  const cargarAmbientes = useCallback(() => ambientesService.listar(), []);
  const { datos: ambientes } = useCargarDatos(cargarAmbientes);

  const opcionesAmbiente = (ambientes ?? []).map((a) => ({ valor: a.id, texto: a.nombre }));
  const hayFiltros = Boolean(filtros.estado || filtros.ambienteId || filtros.fecha);

  return (
    <section>
      <div className="titulo-fila">
        <h2>Reservas</h2>
        <Link className="btn btn-primario" to="/reservas/nueva">Nueva reserva</Link>
      </div>

      <div className="filtros">
        <SelectInput etiqueta="Estado" valor={filtros.estado} textoVacio="Todos"
          opciones={OPCIONES_ESTADO} onCambio={(estado) => setFiltros({ ...filtros, estado })} />
        <SelectInput etiqueta="Ambiente" valor={filtros.ambienteId} textoVacio="Todos"
          opciones={opcionesAmbiente} onCambio={(ambienteId) => setFiltros({ ...filtros, ambienteId })} />
        <DateInput etiqueta="Fecha" valor={filtros.fecha} onCambio={(fecha) => setFiltros({ ...filtros, fecha })} />
        <Button variante="secundario" disabled={!hayFiltros} onClick={() => setFiltros(SIN_FILTROS)}>
          Quitar filtros
        </Button>
      </div>

      <AlertMessage tipo="error" mensaje={error} />
      {cargando && <p>Cargando reservas...</p>}
      {reservas && (
        <TableList
          descripcion="Lista de reservas"
          filas={reservas}
          obtenerClave={(r) => r.id}
          mensajeVacio={hayFiltros ? "Ninguna reserva coincide con los filtros. Prueba quitarlos." : "Aún no hay reservas. Crea la primera con «Nueva reserva»."}
          columnas={[
            { encabezado: "Fecha", render: (r) => r.fecha },
            { encabezado: "Horario", render: (r) => `${r.horaInicio} - ${r.horaFin}` },
            { encabezado: "Ambiente", render: (r) => r.ambienteNombre },
            { encabezado: "Solicitante", render: (r) => r.usuarioNombre },
            { encabezado: "Estado", render: (r) => <EstadoBadge estado={r.estado} /> },
            { encabezado: "Detalle", render: (r) => <Link to={`/reservas/${r.id}`}>Ver detalle</Link> },
          ]}
        />
      )}
    </section>
  );
}

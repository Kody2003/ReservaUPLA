/**
 * ReservasPage — Listado de reservas con filtros por estado, ambiente y fecha (RF-05).
 *
 * Adaptaciones por rol (FASE 4 + AJUSTE 2):
 *   · Solicitante:
 *       - Título de sección "Mis reservas".
 *       - Oculta la columna "Solicitante" de la tabla (todas las reservas listadas le pertenecen).
 *   · Administrador y ResponsableAmbiente:
 *       - Título de sección "Reservas".
 *       - Muestra la columna "Solicitante" para ver a qué usuario pertenece cada reserva.
 */
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { DateInput } from "../components/ui/DateInput";
import { EstadoBadge } from "../components/ui/EstadoBadge";
import { SelectInput } from "../components/ui/SelectInput";
import { TableList } from "../components/ui/TableList";
import { useAuth } from "../contexts/AuthContext";
import { useCargarDatos } from "../hooks/useCargarDatos";
import { ambientesService } from "../services/ambientesService";
import { reservasService } from "../services/reservasService";
import { ESTADOS_RESERVA } from "../types";
import type { FiltroReservas, Reserva } from "../types";

const OPCIONES_ESTADO = ESTADOS_RESERVA.map((e) => ({ valor: e, texto: e }));
const SIN_FILTROS: FiltroReservas = { estado: "", ambienteId: "", fecha: "" };

export function ReservasPage() {
  const { usuario } = useAuth();
  const esSolicitante = usuario?.rol === "Solicitante";

  const [filtros, setFiltros] = useState<FiltroReservas>(SIN_FILTROS);

  const cargarReservas = useCallback(() => reservasService.listar(filtros), [filtros]);
  const { datos: reservas, cargando, error } = useCargarDatos(cargarReservas);

  const cargarAmbientes = useCallback(() => ambientesService.listar(), []);
  const { datos: ambientes } = useCargarDatos(cargarAmbientes);

  const opcionesAmbiente = (ambientes ?? []).map((a) => ({ valor: a.id, texto: a.nombre }));
  const hayFiltros = Boolean(filtros.estado || filtros.ambienteId || filtros.fecha);

  // Columnas dinámicas según el rol (oculta "Solicitante" si el usuario es Solicitante // AJUSTE 2)
  const columnas = [
    { encabezado: "Fecha", render: (r: Reserva) => r.fecha },
    { encabezado: "Horario", render: (r: Reserva) => `${r.horaInicio} - ${r.horaFin}` },
    { encabezado: "Ambiente", render: (r: Reserva) => r.ambienteNombre },
    ...(!esSolicitante ? [{ encabezado: "Solicitante", render: (r: Reserva) => r.usuarioNombre }] : []),
    { encabezado: "Estado", render: (r: Reserva) => <EstadoBadge estado={r.estado} /> },
    { encabezado: "Detalle", render: (r: Reserva) => <Link to={`/reservas/${r.id}`}>Ver detalle</Link> },
  ];

  return (
    <section>
      <div className="titulo-fila">
        <h2>{esSolicitante ? "Mis reservas" : "Reservas"}</h2>
        <Link className="btn btn-primario" to="/reservas/nueva">Nueva reserva</Link>
      </div>

      <div className="filtros">
        <SelectInput
          etiqueta="Estado"
          valor={filtros.estado}
          textoVacio="Todos"
          opciones={OPCIONES_ESTADO}
          onCambio={(estado) => setFiltros({ ...filtros, estado })}
        />
        <SelectInput
          etiqueta="Ambiente"
          valor={filtros.ambienteId}
          textoVacio="Todos"
          opciones={opcionesAmbiente}
          onCambio={(ambienteId) => setFiltros({ ...filtros, ambienteId })}
        />
        <DateInput
          etiqueta="Fecha"
          valor={filtros.fecha}
          onCambio={(fecha) => setFiltros({ ...filtros, fecha })}
        />
        <Button variante="secundario" disabled={!hayFiltros} onClick={() => setFiltros(SIN_FILTROS)}>
          Quitar filtros
        </Button>
      </div>

      <AlertMessage tipo="error" mensaje={error} />
      {cargando && <p>Cargando reservas...</p>}
      {reservas && (
        <TableList
          descripcion={esSolicitante ? "Lista de mis reservas registradas" : "Lista general de reservas"}
          filas={reservas}
          obtenerClave={(r) => r.id}
          mensajeVacio={
            hayFiltros
              ? "Ninguna reserva coincide con los filtros. Prueba quitarlos."
              : esSolicitante
              ? "Aún no tienes reservas registradas. Crea tu primera solicitud con «Nueva reserva»."
              : "Aún no hay reservas registradas en el sistema."
          }
          columnas={columnas}
        />
      )}
    </section>
  );
}

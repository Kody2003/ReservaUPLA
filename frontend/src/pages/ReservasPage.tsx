/**
 * ReservasPage — Listado de reservas con filtros por estado, ambiente y fecha (RF-05, BLOQUE 1 y BLOQUE 2).
 *
 * Características:
 *   · Filtros unificados con Campo.tsx e Icono.tsx (filtro, edificio, calendario).
 *   · Botón "Nueva reserva" con ícono (+).
 *   · Botón "Quitar filtros" con ícono (x).
 *   · Adaptación por rol: Solicitante ve "Mis reservas" y se omite la columna Solicitante.
 */
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { Campo } from "../components/ui/Campo";
import { EstadoBadge } from "../components/ui/EstadoBadge";
import { Icono } from "../components/ui/Icono";
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

  // Columnas dinámicas según el rol (oculta "Solicitante" si el usuario es Solicitante)
  const columnas = [
    { encabezado: "Fecha", render: (r: Reserva) => r.fecha },
    { encabezado: "Horario", render: (r: Reserva) => `${r.horaInicio} - ${r.horaFin}` },
    { encabezado: "Ambiente", render: (r: Reserva) => r.ambienteNombre },
    ...(!esSolicitante ? [{ encabezado: "Solicitante", render: (r: Reserva) => r.usuarioNombre }] : []),
    { encabezado: "Estado", render: (r: Reserva) => <EstadoBadge estado={r.estado} /> },
    {
      encabezado: "Detalle",
      render: (r: Reserva) => (
        <Link to={`/reservas/${r.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
          Ver detalle
        </Link>
      ),
    },
  ];

  return (
    <section>
      <div className="titulo-fila">
        <h2>
          <Icono nombre="calendario" tamano={22} style={{ marginRight: "0.5rem", verticalAlign: "middle", color: "var(--primario)" }} />
          {esSolicitante ? "Mis reservas" : "Reservas"}
        </h2>
        <Link
          className="btn btn-primario"
          to="/reservas/nueva"
        >
          Nueva reserva
        </Link>
      </div>

      {/* Filtros con Campo unificado */}
      <div className="panel-tarjeta" style={{ marginBottom: "1.25rem", padding: "1.1rem 1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", alignItems: "end" }}>
          <Campo
            etiqueta="Filtrar por estado"
            tipo="select"
            valor={filtros.estado}
            textoVacio="Todos los estados"
            opciones={OPCIONES_ESTADO}
            onCambio={(estado) => setFiltros({ ...filtros, estado })}
          />

          <Campo
            etiqueta="Filtrar por ambiente"
            tipo="select"
            valor={filtros.ambienteId}
            textoVacio="Todos los ambientes"
            opciones={opcionesAmbiente}
            onCambio={(ambienteId) => setFiltros({ ...filtros, ambienteId })}
          />

          <Campo
            etiqueta="Filtrar por fecha"
            tipo="date"
            valor={filtros.fecha}
            onCambio={(fecha) => setFiltros({ ...filtros, fecha })}
          />

          <div style={{ paddingBottom: "2px" }}>
            <Button
              variante="secundario"
              disabled={!hayFiltros}
              onClick={() => setFiltros(SIN_FILTROS)}
              style={{ width: "100%", height: "46px" }}
            >
              Quitar filtros
            </Button>
          </div>
        </div>
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
              ? "Ninguna reserva coincide con los filtros aplicados. Prueba quitarlos."
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

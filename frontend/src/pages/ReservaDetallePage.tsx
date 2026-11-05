/**
 * ReservaDetallePage — Consulta de detalle y cambio de estado de reserva (RF-06, RF-07).
 *
 * Adaptaciones por rol (FASE 4 + AJUSTE 2):
 *   · Administrador (RN-05):
 *       - Visualiza el solicitante original.
 *       - Dispone de botones para Aprobar y Rechazar la reserva (si está Pendiente).
 *       - Puede Cancelar la reserva.
 *   · Solicitante:
 *       - Oculta los botones Aprobar y Rechazar (solo visibles para Administrador // RN-05).
 *       - Oculta datos redundantes de otros usuarios.
 *       - Solo puede cancelar sus propias reservas (verificado por UI y reforzado por backend en Fase 2).
 *   · Regla RN-06:
 *       - Una reserva Rechazada no permite ninguna modificación adicional.
 */
import { useCallback, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { EstadoBadge } from "../components/ui/EstadoBadge";
import { ModalConfirmacion } from "../components/ui/ModalConfirmacion";
import { useAuth } from "../contexts/AuthContext";
import { useCargarDatos } from "../hooks/useCargarDatos";
import { obtenerMensajeError } from "../services/apiClient";
import { reservasService } from "../services/reservasService";
import type { EstadoReserva, Mensaje } from "../types";

type Accion = Exclude<EstadoReserva, "Pendiente">;

/** Textos del modal según la acción elegida. */
const TEXTOS: Record<Accion, { titulo: string; mensaje: string; boton: string; peligroso: boolean }> = {
  Aprobada: { titulo: "¿Aprobar esta reserva?", mensaje: "El ambiente quedará reservado en ese horario.", boton: "Aprobar", peligroso: false },
  Rechazada: { titulo: "¿Rechazar esta reserva?", mensaje: "Una reserva rechazada ya no se podrá modificar.", boton: "Rechazar", peligroso: true },
  Cancelada: { titulo: "¿Cancelar esta reserva?", mensaje: "La reserva quedará cancelada y el horario se liberará.", boton: "Cancelar reserva", peligroso: true },
};

export function ReservaDetallePage() {
  const { id = "" } = useParams<{ id: string }>();
  const ubicacion = useLocation();
  const mensajeInicial = (ubicacion.state as { exito?: string } | null)?.exito ?? "";

  const cargar = useCallback(() => reservasService.obtener(id), [id]);
  const { datos: reserva, cargando, error, recargar } = useCargarDatos(cargar);

  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "Administrador";
  const esSolicitante = usuario?.rol === "Solicitante";

  const [accion, setAccion] = useState<Accion | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(
    mensajeInicial ? { tipo: "exito", texto: mensajeInicial } : null,
  );

  async function confirmar() {
    if (!accion) return;
    setProcesando(true);
    try {
      await reservasService.cambiarEstado(id, accion);
      setMensaje({ tipo: "exito", texto: `La reserva quedó en estado ${accion}.` });
      recargar();
    } catch (err) {
      setMensaje({ tipo: "error", texto: obtenerMensajeError(err) });
    } finally {
      setProcesando(false);
      setAccion(null);
    }
  }

  const rechazada = reserva?.estado === "Rechazada";
  const puedeDecidir = reserva?.estado === "Pendiente";
  const puedeCancelar = reserva?.estado === "Pendiente" || reserva?.estado === "Aprobada";

  return (
    <section>
      <div className="titulo-fila">
        <h2>Detalle de la reserva</h2>
        <Link to="/reservas">Volver al listado</Link>
      </div>

      <AlertMessage tipo="error" mensaje={error} />
      <AlertMessage tipo={mensaje?.tipo ?? "info"} mensaje={mensaje?.texto ?? ""} onCerrar={() => setMensaje(null)} />
      {cargando && <p>Cargando reserva...</p>}

      {reserva && (
        <>
          <dl className="detalle">
            <dt>Estado</dt><dd><EstadoBadge estado={reserva.estado} /></dd>
            <dt>Ambiente</dt><dd>{reserva.ambienteNombre}</dd>
            {/* Oculta solicitante en caso de ser Solicitante // AJUSTE 2 */}
            {!esSolicitante && (
              <>
                <dt>Solicitante</dt><dd>{reserva.usuarioNombre}</dd>
              </>
            )}
            <dt>Fecha</dt><dd>{reserva.fecha}</dd>
            <dt>Horario</dt><dd>{reserva.horaInicio} - {reserva.horaFin}</dd>
            <dt>Motivo</dt><dd>{reserva.motivo}</dd>
          </dl>

          {/* RN-06: una Rechazada no se puede modificar */}
          {rechazada && <AlertMessage tipo="info" mensaje="Esta reserva fue rechazada y ya no se puede modificar." />}

          <div className="acciones">
            {/* RN-05: Solo el Administrador ve botones Aprobar y Rechazar // AJUSTE 2 */}
            {esAdmin && (
              <>
                <Button disabled={!puedeDecidir} onClick={() => setAccion("Aprobada")}>
                  Aprobar
                </Button>
                <Button variante="peligro" disabled={!puedeDecidir} onClick={() => setAccion("Rechazada")}>
                  Rechazar
                </Button>
              </>
            )}

            {/* Cancelación disponible para Solicitante (sus reservas) y Administrador/Responsable */}
            <Button
              variante="secundario"
              disabled={!puedeCancelar}
              onClick={() => setAccion("Cancelada")}
            >
              Cancelar reserva
            </Button>
          </div>
        </>
      )}

      {accion && (
        <ModalConfirmacion
          abierto
          titulo={TEXTOS[accion].titulo}
          mensaje={TEXTOS[accion].mensaje}
          textoConfirmar={TEXTOS[accion].boton}
          peligroso={TEXTOS[accion].peligroso}
          procesando={procesando}
          onConfirmar={confirmar}
          onCancelar={() => setAccion(null)}
        />
      )}
    </section>
  );
}

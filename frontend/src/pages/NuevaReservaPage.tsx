/**
 * NuevaReservaPage — Registro de una reserva (RF-03, RF-04).
 *
 * Adaptaciones por rol (FASE 4 + AJUSTE 2):
 *   · Administrador:
 *       - Puede elegir qué usuario será el solicitante de la reserva.
 *   · Solicitante y ResponsableAmbiente:
 *       - Se oculta el selector de usuario; la reserva se registra automáticamente
 *         a nombre del usuario autenticado (usuarioId tomado de AuthContext).
 *       - El backend garantiza además que el token determine el solicitante real.
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { DateInput } from "../components/ui/DateInput";
import { SelectInput } from "../components/ui/SelectInput";
import { TextInput } from "../components/ui/TextInput";
import { TimeInput } from "../components/ui/TimeInput";
import { useAuth } from "../contexts/AuthContext";
import { useCargarDatos } from "../hooks/useCargarDatos";
import { useDisponibilidad } from "../hooks/useDisponibilidad";
import { HORA_MAXIMA, HORA_MINIMA, useValidacionReserva } from "../hooks/useValidacionReserva";
import { obtenerMensajeError } from "../services/apiClient";
import { ambientesService } from "../services/ambientesService";
import { reservasService } from "../services/reservasService";
import { usuariosService } from "../services/usuariosService";

export function NuevaReservaPage() {
  const navegar = useNavigate();
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "Administrador";

  // Solo el administrador necesita la lista de usuarios para el selector
  const cargarUsuarios = useCallback(() => (esAdmin ? usuariosService.listar() : Promise.resolve([])), [esAdmin]);
  const cargarAmbientes = useCallback(() => ambientesService.listar(), []);
  const { datos: usuarios, error: errorUsuarios } = useCargarDatos(cargarUsuarios);
  const { datos: ambientes, error: errorAmbientes } = useCargarDatos(cargarAmbientes);

  const [usuarioId, setUsuarioId] = useState(usuario?.id ?? "");
  const [ambienteId, setAmbienteId] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [motivo, setMotivo] = useState("");
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  // Asegura que para no-administradores el usuarioId siempre sea el del usuario en sesión
  useEffect(() => {
    if (!esAdmin && usuario?.id) {
      setUsuarioId(usuario.id);
    }
  }, [esAdmin, usuario]);

  const { errores, hayErroresHorario, hayErrores } = useValidacionReserva({
    usuarioId,
    ambienteId,
    fecha,
    horaInicio,
    horaFin,
    motivo,
  });

  const puedeConsultar = Boolean(ambienteId && fecha && horaInicio && horaFin) && !hayErroresHorario;
  const { disponibilidad, verificando } = useDisponibilidad(ambienteId, fecha, horaInicio, horaFin, puedeConsultar);

  const noDisponible = disponibilidad !== null && !disponibilidad.disponible;
  const botonDeshabilitado = enviando || hayErroresHorario || noDisponible;

  const opcionesUsuario = (usuarios ?? [])
    .filter((u) => u.activo)
    .map((u) => ({ valor: u.id, texto: `${u.nombreCompleto} (${u.rol})` }));

  const opcionesAmbiente = (ambientes ?? [])
    .filter((a) => a.estado === "Disponible")
    .map((a) => ({ valor: a.id, texto: `${a.nombre} · capacidad ${a.capacidad}` }));

  async function alEnviar(e: FormEvent) {
    e.preventDefault();
    setIntentado(true);
    setErrorEnvio("");
    if (hayErrores) return;

    setEnviando(true);
    try {
      const creada = await reservasService.crear({
        usuarioId: esAdmin ? usuarioId : usuario?.id ?? usuarioId,
        ambienteId,
        fecha,
        horaInicio,
        horaFin,
        motivo: motivo.trim(),
      });
      navegar(`/reservas/${creada.id}`, {
        state: { exito: "Reserva registrada. Quedó en estado Pendiente hasta que el administrador la apruebe." },
      });
    } catch (err) {
      setErrorEnvio(obtenerMensajeError(err));
    } finally {
      setEnviando(false);
    }
  }

  const ver = (campo: keyof typeof errores, esDeHorario = false) =>
    intentado || esDeHorario ? errores[campo] ?? "" : "";

  return (
    <section>
      <h2>Nueva reserva</h2>
      <AlertMessage tipo="error" mensaje={errorUsuarios || errorAmbientes} />

      <form className="formulario" onSubmit={alEnviar} noValidate>
        {/* Solo el Administrador puede seleccionar qué usuario solicita // AJUSTE 2 */}
        {esAdmin && (
          <SelectInput
            etiqueta="Usuario solicitante"
            valor={usuarioId}
            onCambio={setUsuarioId}
            opciones={opcionesUsuario}
            textoVacio="Selecciona un usuario"
            error={ver("usuarioId")}
            requerido
          />
        )}

        <SelectInput
          etiqueta="Ambiente"
          valor={ambienteId}
          onCambio={setAmbienteId}
          opciones={opcionesAmbiente}
          textoVacio="Selecciona un ambiente"
          error={ver("ambienteId")}
          requerido
        />
        <DateInput etiqueta="Fecha" valor={fecha} onCambio={setFecha} error={ver("fecha")} requerido />
        <div className="fila-horas">
          <TimeInput
            etiqueta="Hora de inicio"
            valor={horaInicio}
            onCambio={setHoraInicio}
            minimo={HORA_MINIMA}
            maximo={HORA_MAXIMA}
            error={ver("horaInicio", true)}
            requerido
          />
          <TimeInput
            etiqueta="Hora de fin"
            valor={horaFin}
            onCambio={setHoraFin}
            minimo={HORA_MINIMA}
            maximo={HORA_MAXIMA}
            error={ver("horaFin", true)}
            requerido
          />
        </div>
        <p className="ayuda">Horario institucional permitido: de {HORA_MINIMA} a {HORA_MAXIMA}.</p>
        <TextInput
          etiqueta="Motivo"
          valor={motivo}
          onCambio={setMotivo}
          error={ver("motivo")}
          requerido
          maxLength={300}
        />

        {verificando && <p className="ayuda">Verificando disponibilidad...</p>}
        {disponibilidad && (
          <AlertMessage tipo={disponibilidad.disponible ? "exito" : "error"} mensaje={disponibilidad.mensaje} />
        )}
        <AlertMessage tipo="error" mensaje={errorEnvio} />

        <div className="acciones">
          <Link className="btn btn-secundario" to="/reservas">Volver al listado</Link>
          <Button type="submit" disabled={botonDeshabilitado}>
            {enviando ? "Guardando..." : "Registrar reserva"}
          </Button>
        </div>
      </form>
    </section>
  );
}

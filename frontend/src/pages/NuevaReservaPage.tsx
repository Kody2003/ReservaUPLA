/**
 * NuevaReservaPage — Formulario de registro de una reserva (RF-03, RF-04, BLOQUE 1 y BLOQUE 2).
 *
 * Características:
 *  - Campos unificados con Campo.tsx e Icono.tsx (usuario, edificio, calendario, reloj, lápiz).
 *  - Corrección de usabilidad: los errores NO se muestran al cargar la página.
 *    Solo se muestran tras tocar un campo (onBlur) o al intentar enviar el formulario (alEnviar).
 *  - Botón de envío con ícono "+" integrado.
 *  - Adaptación por rol: solo el Administrador ve el selector de usuario solicitante;
 *    los demás usuarios registran automáticamente a su propio nombre.
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { Campo } from "../components/ui/Campo";
import { Icono } from "../components/ui/Icono";
import { useAuth } from "../contexts/AuthContext";
import { useCargarDatos } from "../hooks/useCargarDatos";
import { useDisponibilidad } from "../hooks/useDisponibilidad";
import { HORA_MAXIMA, HORA_MINIMA, useValidacionReserva } from "../hooks/useValidacionReserva";
import { obtenerMensajeError } from "../services/apiClient";
import { ambientesService } from "../services/ambientesService";
import { reservasService } from "../services/reservasService";
import { usuariosService } from "../services/usuariosService";
import { formatearRol } from "../types";

export function NuevaReservaPage() {
  const navegar = useNavigate();
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "Administrador";

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

  // Estado de interacción: errores solo tras onBlur o al intentar enviar (BLOQUE 1)
  const [tocado, setTocado] = useState<Record<string, boolean>>({});
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  function marcarTocado(campo: string) {
    setTocado((prev) => ({ ...prev, [campo]: true }));
  }

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
    .map((u) => ({ valor: u.id, texto: `${u.nombreCompleto} (${formatearRol(u.rol)})` }));

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

  // Error visible solo si se ha intentado enviar o el usuario ya interactuó con el campo
  const verError = (campo: keyof typeof errores) => {
    return intentado || tocado[campo] ? errores[campo] ?? "" : "";
  };

  return (
    <section>
      <div className="titulo-fila">
        <h2>
          <Icono nombre="mas" tamano={22} style={{ marginRight: "0.5rem", verticalAlign: "middle", color: "var(--primario)" }} />
          Nueva reserva
        </h2>
        <Link className="btn btn-secundario" to="/reservas">
          Volver al listado
        </Link>
      </div>

      <AlertMessage tipo="error" mensaje={errorUsuarios || errorAmbientes} />

      <form className="formulario" onSubmit={alEnviar} noValidate style={{ maxWidth: 640 }}>
        {/* Solo el Administrador selecciona el usuario solicitante */}
        {esAdmin && (
          <Campo
            etiqueta="Usuario solicitante"
            tipo="select"
            valor={usuarioId}
            onCambio={(v) => {
              setUsuarioId(v);
              marcarTocado("usuarioId");
            }}
            onBlur={() => marcarTocado("usuarioId")}
            opciones={opcionesUsuario}
            textoVacio="Selecciona un usuario"
            error={verError("usuarioId")}
            requerido
          />
        )}

        {/* Ambiente */}
        <Campo
          etiqueta="Ambiente académico"
          tipo="select"
          valor={ambienteId}
          onCambio={(v) => {
            setAmbienteId(v);
            marcarTocado("ambienteId");
          }}
          onBlur={() => marcarTocado("ambienteId")}
          opciones={opcionesAmbiente}
          textoVacio="Selecciona un ambiente"
          error={verError("ambienteId")}
          requerido
        />

        {/* Fecha */}
        <Campo
          etiqueta="Fecha de reserva"
          tipo="date"
          valor={fecha}
          onCambio={(v) => {
            setFecha(v);
            marcarTocado("fecha");
          }}
          onBlur={() => marcarTocado("fecha")}
          error={verError("fecha")}
          requerido
        />

        {/* Horas de inicio y fin */}
        <div className="fila-horas">
          <Campo
            etiqueta="Hora de inicio"
            tipo="time"
            valor={horaInicio}
            onCambio={(v) => {
              setHoraInicio(v);
              marcarTocado("horaInicio");
            }}
            onBlur={() => marcarTocado("horaInicio")}
            min={HORA_MINIMA}
            max={HORA_MAXIMA}
            error={verError("horaInicio")}
            requerido
          />

          <Campo
            etiqueta="Hora de fin"
            tipo="time"
            valor={horaFin}
            onCambio={(v) => {
              setHoraFin(v);
              marcarTocado("horaFin");
            }}
            onBlur={() => marcarTocado("horaFin")}
            min={HORA_MINIMA}
            max={HORA_MAXIMA}
            error={verError("horaFin")}
            requerido
          />
        </div>
        {/* Texto de ayuda RN-04 eliminado (ajuste visual) — la validación se mantiene activa */}

        {/* Motivo */}
        <Campo
          etiqueta="Motivo de la reserva"
          tipo="textarea"
          valor={motivo}
          onCambio={(v) => {
            setMotivo(v);
            marcarTocado("motivo");
          }}
          onBlur={() => marcarTocado("motivo")}
          placeholder="Describe el propósito académico de la reserva..."
          maxLength={300}
          rows={4}
          error={verError("motivo")}
          requerido
        />

        {verificando && (
          <p className="ayuda" style={{ color: "var(--primario)", fontWeight: 600 }}>
            Verificando disponibilidad de horario...
          </p>
        )}
        {disponibilidad && (
          <AlertMessage tipo={disponibilidad.disponible ? "exito" : "error"} mensaje={disponibilidad.mensaje} />
        )}
        <AlertMessage tipo="error" mensaje={errorEnvio} />

        <div className="acciones" style={{ marginTop: "1rem" }}>
          <Button type="submit" disabled={botonDeshabilitado}>
            {enviando ? "Guardando..." : "Registrar reserva"}
          </Button>
        </div>
      </form>
    </section>
  );
}

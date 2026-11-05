/**
 * AmbientesPage — Gestión y consulta de ambientes académicos (RF-02, BLOQUE 1 y BLOQUE 2).
 *
 * Características:
 *   · Formulario unificado con Campo.tsx e Icono.tsx (edificio, filtro, capacidad, ubicación).
 *   · Errores didácticos mostrados únicamente al intentar enviar o al salir del campo (onBlur).
 *   · Administrador: esquema de 2 columnas con un único botón de envío con ícono (+).
 *   · Responsable de Ambiente: solo tabla al 100% del ancho con buscador y filtros.
 *   · Badges de estado con color y texto explícito (Disponible, Mantenimiento, Inactivo).
 */
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { Campo } from "../components/ui/Campo";
import { Icono } from "../components/ui/Icono";
import { TableList } from "../components/ui/TableList";
import { useAuth } from "../contexts/AuthContext";
import { useCargarDatos } from "../hooks/useCargarDatos";
import { obtenerMensajeError } from "../services/apiClient";
import { ambientesService } from "../services/ambientesService";
import { ESTADOS_AMBIENTE, type Ambiente, type Mensaje } from "../types";

const OPCIONES_ESTADO = ESTADOS_AMBIENTE.map((e) => ({ valor: e, texto: e }));

/** Etiqueta de color y texto para el estado del ambiente. */
function EstadoAmbienteBadge({ estado }: { estado: string }) {
  if (estado === "Disponible") {
    return (
      <span className="badge-disponible">
        <span aria-hidden="true">●</span> Disponible
      </span>
    );
  }
  if (estado === "Mantenimiento") {
    return (
      <span className="badge-mantenimiento">
        <span aria-hidden="true">●</span> Mantenimiento
      </span>
    );
  }
  return (
    <span className="badge-inactivo">
      <span aria-hidden="true">●</span> {estado}
    </span>
  );
}

export function AmbientesPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "Administrador";

  const cargar = useCallback(() => ambientesService.listar(), []);
  const { datos: ambientes, cargando, error, recargar } = useCargarDatos(cargar);

  // --- Campos del formulario ---
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [estado, setEstado] = useState("Disponible");

  // Control de interacción y errores (BLOQUE 1)
  const [tocado, setTocado] = useState<Record<string, boolean>>({});
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  // --- Filtros de la tabla ---
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const capacidadNumero = Number(capacidad);

  function marcarTocado(campo: string) {
    setTocado((prev) => ({ ...prev, [campo]: true }));
  }

  // RN-02: validaciones obligatorias
  const errores = {
    nombre: nombre.trim() ? "" : "Escribe el nombre del ambiente.",
    tipo: tipo.trim() ? "" : "Escribe el tipo (ej. Aula, Laboratorio).",
    capacidad: !capacidad.trim()
      ? "Escribe la capacidad."
      : Number.isInteger(capacidadNumero) && capacidadNumero > 0
      ? ""
      : "La capacidad debe ser un número entero mayor que 0.",
    ubicacion: ubicacion.trim() ? "" : "Escribe la ubicación.",
    estado: estado ? "" : "Selecciona el estado.",
  };
  const hayErrores = Object.values(errores).some(Boolean);

  const verError = (campo: keyof typeof errores) => {
    return intentado || tocado[campo] ? errores[campo] ?? "" : "";
  };

  async function alEnviar(e: FormEvent) {
    e.preventDefault();
    setIntentado(true);
    setMensaje(null);
    if (hayErrores) return;

    setEnviando(true);
    try {
      await ambientesService.crear({
        nombre: nombre.trim(),
        tipo: tipo.trim(),
        capacidad: capacidadNumero,
        ubicacion: ubicacion.trim(),
        estado,
      });
      setMensaje({ tipo: "exito", texto: "Ambiente registrado correctamente." });
      setNombre("");
      setTipo("");
      setCapacidad("");
      setUbicacion("");
      setEstado("Disponible");
      setIntentado(false);
      setTocado({});
      recargar();
    } catch (err) {
      setMensaje({ tipo: "error", texto: obtenerMensajeError(err) });
    } finally {
      setEnviando(false);
    }
  }

  const tiposUnicos = useMemo(() => {
    if (!ambientes) return [];
    const setTipos = new Set(ambientes.map((a) => a.tipo.trim()).filter(Boolean));
    return Array.from(setTipos).sort();
  }, [ambientes]);

  const ambientesFiltrados = useMemo(() => {
    if (!ambientes) return [];
    return ambientes.filter((a) => {
      const q = busqueda.trim().toLowerCase();
      const coincideTexto =
        !q ||
        a.nombre.toLowerCase().includes(q) ||
        a.ubicacion.toLowerCase().includes(q) ||
        a.tipo.toLowerCase().includes(q);

      const coincideTipo = !filtroTipo || a.tipo.toLowerCase() === filtroTipo.toLowerCase();
      return coincideTexto && coincideTipo;
    });
  }, [ambientes, busqueda, filtroTipo]);

  return (
    <section>
      <div className="titulo-fila">
        <h2>
          <Icono nombre="edificio" tamano={22} style={{ marginRight: "0.5rem", verticalAlign: "middle", color: "var(--primario)" }} />
          Gestión de ambientes
        </h2>
      </div>

      <AlertMessage tipo="error" mensaje={error} />
      <AlertMessage
        tipo={mensaje?.tipo ?? "info"}
        mensaje={mensaje?.texto ?? ""}
        onCerrar={() => setMensaje(null)}
      />

      <div className={esAdmin ? "layout-dos-columnas" : "layout-una-columna"}>
        {/* Columna Izquierda: Formulario (Solo Administrador) */}
        {esAdmin && (
          <div className="panel-tarjeta">
            <h3 className="panel-tarjeta-titulo">
              <Icono nombre="mas" tamano={17} style={{ marginRight: "0.4rem", verticalAlign: "middle" }} />
              Registrar ambiente
            </h3>
            <form onSubmit={alEnviar} noValidate style={{ display: "grid", gap: "0.85rem" }}>
              <Campo
                etiqueta="Nombre del ambiente"
                valor={nombre}
                onCambio={(v) => {
                  setNombre(v);
                  marcarTocado("nombre");
                }}
                onBlur={() => marcarTocado("nombre")}
                error={verError("nombre")}
                placeholder="Ej. Laboratorio de Cómputo 1"
                maxLength={100}
                requerido
              />

              <Campo
                etiqueta="Tipo de ambiente"
                valor={tipo}
                onCambio={(v) => {
                  setTipo(v);
                  marcarTocado("tipo");
                }}
                onBlur={() => marcarTocado("tipo")}
                error={verError("tipo")}
                placeholder="Ej. Aula, Laboratorio, Auditorio"
                maxLength={50}
                requerido
              />

              <Campo
                etiqueta="Capacidad (personas)"
                tipo="number"
                min={1}
                valor={capacidad}
                onCambio={(v) => {
                  setCapacidad(v);
                  marcarTocado("capacidad");
                }}
                onBlur={() => marcarTocado("capacidad")}
                error={verError("capacidad")}
                placeholder="Número de personas"
                requerido
              />

              <Campo
                etiqueta="Ubicación"
                valor={ubicacion}
                onCambio={(v) => {
                  setUbicacion(v);
                  marcarTocado("ubicacion");
                }}
                onBlur={() => marcarTocado("ubicacion")}
                error={verError("ubicacion")}
                placeholder="Ej. Pabellón C - 2do piso"
                maxLength={150}
                requerido
              />

              <Campo
                etiqueta="Estado inicial"
                tipo="select"
                valor={estado}
                onCambio={(v) => {
                  setEstado(v);
                  marcarTocado("estado");
                }}
                onBlur={() => marcarTocado("estado")}
                opciones={OPCIONES_ESTADO}
                error={verError("estado")}
                requerido
              />

              <div style={{ marginTop: "0.5rem" }}>
                <Button type="submit" disabled={enviando} style={{ width: "100%" }}>
                  {enviando ? "Guardando ambiente..." : "Registrar ambiente"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Columna Derecha: Ambientes registrados */}
        <div className="panel-tarjeta">
          <h3 className="panel-tarjeta-titulo">
            <Icono nombre="edificio" tamano={17} style={{ marginRight: "0.4rem", verticalAlign: "middle" }} />
            Ambientes registrados
          </h3>

          <div className="barra-herramientas-tabla">
            <div className="input-busqueda-wrapper">
              <span className="input-busqueda-icono" aria-hidden="true">
                <Icono nombre="lupa" />
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, tipo o ubicación..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar ambientes"
              />
            </div>

            <div style={{ minWidth: "180px" }}>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                aria-label="Filtrar por tipo de ambiente"
                style={{ height: "40px", borderRadius: "8px" }}
              >
                <option value="">Todos los tipos</option>
                {tiposUnicos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {(busqueda || filtroTipo) && (
              <Button
                variante="secundario"
                onClick={() => {
                  setBusqueda("");
                  setFiltroTipo("");
                }}
              >
                Limpiar
              </Button>
            )}
          </div>

          {cargando && <p>Cargando ambientes...</p>}

          {ambientes && (
            <TableList
              descripcion="Lista de ambientes académicos registrados"
              filas={ambientesFiltrados}
              obtenerClave={(a: Ambiente) => a.id}
              mensajeVacio={
                busqueda || filtroTipo
                  ? "Ningún ambiente coincide con los criterios de búsqueda."
                  : "Todavía no hay ambientes registrados en el sistema."
              }
              columnas={[
                { encabezado: "Nombre", render: (a: Ambiente) => <strong>{a.nombre}</strong> },
                { encabezado: "Tipo", render: (a: Ambiente) => a.tipo },
                { encabezado: "Capacidad", render: (a: Ambiente) => `${a.capacidad} pers.` },
                { encabezado: "Ubicación", render: (a: Ambiente) => a.ubicacion },
                { encabezado: "Estado", render: (a: Ambiente) => <EstadoAmbienteBadge estado={a.estado} /> },
              ]}
            />
          )}
        </div>
      </div>
    </section>
  );
}

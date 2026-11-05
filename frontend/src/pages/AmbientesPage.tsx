/**
 * AmbientesPage — Gestión y consulta de ambientes académicos (RF-02).
 *
 * Características del rediseño:
 *   · Administrador:
 *       - Esquema de 2 columnas: Columna izquierda "Registrar ambiente" y Columna derecha "Ambientes registrados".
 *       - Formulario en tarjeta blanca redondeada con sombra suave y un ÚNICO botón de envío ("Registrar ambiente").
 *       - Panel derecho con buscador en tiempo real, filtro por tipo y tabla de datos.
 *   · Responsable de Ambiente:
 *       - Solo visualiza la tabla de ambientes registrados ocupando el 100% del ancho (sin formulario).
 *   · Estados con etiqueta de color y texto explícito:
 *       - Disponible: verde (badge con punto y texto)
 *       - Mantenimiento: ámbar
 *       - Inactivo: gris/neutro
 *   · Conserva todas las validaciones de negocio didácticas (RN-02: campos obligatorios, capacidad > 0 entero).
 */
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { SelectInput } from "../components/ui/SelectInput";
import { TableList } from "../components/ui/TableList";
import { TextInput } from "../components/ui/TextInput";
import { useAuth } from "../contexts/AuthContext";
import { useCargarDatos } from "../hooks/useCargarDatos";
import { obtenerMensajeError } from "../services/apiClient";
import { ambientesService } from "../services/ambientesService";
import { ESTADOS_AMBIENTE, type Ambiente, type Mensaje } from "../types";

const OPCIONES_ESTADO = ESTADOS_AMBIENTE.map((e) => ({ valor: e, texto: e }));

/** Ícono de lupa para el buscador. */
function IconoLupa() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

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

  // --- Campos del formulario de registro ---
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [estado, setEstado] = useState("Disponible");
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  // --- Filtros de la tabla ---
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const capacidadNumero = Number(capacidad);

  // RN-02: validaciones de obligatoriedad y capacidad entera > 0
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
      recargar();
    } catch (err) {
      setMensaje({ tipo: "error", texto: obtenerMensajeError(err) });
    } finally {
      setEnviando(false);
    }
  }

  // Opciones dinámicas de tipos a partir de los ambientes registrados
  const tiposUnicos = useMemo(() => {
    if (!ambientes) return [];
    const setTipos = new Set(ambientes.map((a) => a.tipo.trim()).filter(Boolean));
    return Array.from(setTipos).sort();
  }, [ambientes]);

  // Filtrado reactivo por texto y tipo
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
        <h2>Gestión de ambientes</h2>
      </div>

      <AlertMessage tipo="error" mensaje={error} />
      <AlertMessage
        tipo={mensaje?.tipo ?? "info"}
        mensaje={mensaje?.texto ?? ""}
        onCerrar={() => setMensaje(null)}
      />

      {/* Disposición: 2 columnas para Administrador; ancho completo para ResponsableAmbiente */}
      <div className={esAdmin ? "layout-dos-columnas" : "layout-una-columna"}>
        {/* Columna Izquierda: Formulario (Solo Administrador) */}
        {esAdmin && (
          <div className="panel-tarjeta">
            <h3 className="panel-tarjeta-titulo">Registrar ambiente</h3>
            <form onSubmit={alEnviar} noValidate style={{ display: "grid", gap: "0.85rem" }}>
              <TextInput
                etiqueta="Nombre del ambiente"
                valor={nombre}
                onCambio={setNombre}
                error={intentado ? errores.nombre : ""}
                requerido
                maxLength={100}
                placeholder="Ej. Laboratorio de Cómputo 1"
              />
              <TextInput
                etiqueta="Tipo"
                valor={tipo}
                onCambio={setTipo}
                error={intentado ? errores.tipo : ""}
                requerido
                maxLength={50}
                placeholder="Ej. Aula, Laboratorio, Auditorio"
              />
              <TextInput
                etiqueta="Capacidad (personas)"
                tipo="number"
                minimo={1}
                valor={capacidad}
                onCambio={setCapacidad}
                error={intentado ? errores.capacidad : ""}
                requerido
                placeholder="Número de personas"
              />
              <TextInput
                etiqueta="Ubicación"
                valor={ubicacion}
                onCambio={setUbicacion}
                error={intentado ? errores.ubicacion : ""}
                requerido
                maxLength={150}
                placeholder="Ej. Pabellón C - 2do piso"
              />
              <SelectInput
                etiqueta="Estado inicial"
                valor={estado}
                onCambio={setEstado}
                opciones={OPCIONES_ESTADO}
                error={intentado ? errores.estado : ""}
                requerido
              />

              <div style={{ marginTop: "0.5rem" }}>
                {/* UN SOLO BOTÓN DE ENVÍO */}
                <Button type="submit" disabled={enviando} style={{ width: "100%" }}>
                  {enviando ? "Guardando ambiente..." : "Registrar ambiente"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Columna Derecha / Principal: Ambientes registrados con buscador y filtro */}
        <div className="panel-tarjeta">
          <h3 className="panel-tarjeta-titulo">Ambientes registrados</h3>

          {/* Barra de herramientas: buscador y selector de tipo */}
          <div className="barra-herramientas-tabla">
            <div className="input-busqueda-wrapper">
              <span className="input-busqueda-icono" aria-hidden="true">
                <IconoLupa />
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

/**
 * AmbientesPage — Gestión y consulta de ambientes (RF-02).
 *
 * Adaptaciones por rol (FASE 4 + AJUSTE 2):
 *   · Administrador: puede crear nuevos ambientes y consultar la lista.
 *   · ResponsableAmbiente: consulta la lista de ambientes; el formulario de registro se oculta.
 *   · Solicitante: no tiene acceso a esta página (redirigido a /reservas por RutaProtegida).
 */
import { useCallback, useState, type FormEvent } from "react";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { SelectInput } from "../components/ui/SelectInput";
import { TableList } from "../components/ui/TableList";
import { TextInput } from "../components/ui/TextInput";
import { useAuth } from "../contexts/AuthContext";
import { useCargarDatos } from "../hooks/useCargarDatos";
import { obtenerMensajeError } from "../services/apiClient";
import { ambientesService } from "../services/ambientesService";
import { ESTADOS_AMBIENTE } from "../types";
import type { Mensaje } from "../types";

const OPCIONES_ESTADO = ESTADOS_AMBIENTE.map((e) => ({ valor: e, texto: e }));

export function AmbientesPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "Administrador";

  const cargar = useCallback(() => ambientesService.listar(), []);
  const { datos: ambientes, cargando, error, recargar } = useCargarDatos(cargar);

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [estado, setEstado] = useState("Disponible");
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  const capacidadNumero = Number(capacidad);

  // RN-02: validación obligatoria
  const errores = {
    nombre: nombre.trim() ? "" : "Escribe el nombre del ambiente.",
    tipo: tipo.trim() ? "" : "Escribe el tipo (por ejemplo: Aula, Laboratorio).",
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

  return (
    <section>
      <h2>Ambientes</h2>

      {/* Solo el Administrador puede registrar ambientes (RF-02) // AJUSTE 2 */}
      {esAdmin && (
        <form className="formulario" onSubmit={alEnviar} noValidate>
          <h3>Registrar ambiente</h3>
          <TextInput
            etiqueta="Nombre"
            valor={nombre}
            onCambio={setNombre}
            error={intentado ? errores.nombre : ""}
            requerido
            maxLength={100}
          />
          <TextInput
            etiqueta="Tipo"
            valor={tipo}
            onCambio={setTipo}
            error={intentado ? errores.tipo : ""}
            requerido
            maxLength={50}
          />
          <TextInput
            etiqueta="Capacidad (personas)"
            tipo="number"
            minimo={1}
            valor={capacidad}
            onCambio={setCapacidad}
            error={intentado ? errores.capacidad : ""}
            requerido
          />
          <TextInput
            etiqueta="Ubicación"
            valor={ubicacion}
            onCambio={setUbicacion}
            error={intentado ? errores.ubicacion : ""}
            requerido
            maxLength={150}
          />
          <SelectInput
            etiqueta="Estado"
            valor={estado}
            onCambio={setEstado}
            opciones={OPCIONES_ESTADO}
            error={intentado ? errores.estado : ""}
            requerido
          />

          <AlertMessage tipo={mensaje?.tipo ?? "info"} mensaje={mensaje?.texto ?? ""} onCerrar={() => setMensaje(null)} />
          <Button type="submit" disabled={enviando}>{enviando ? "Guardando..." : "Registrar ambiente"}</Button>
        </form>
      )}

      <h3>Ambientes registrados</h3>
      <AlertMessage tipo="error" mensaje={error} />
      {cargando && <p>Cargando ambientes...</p>}
      {ambientes && (
        <TableList
          descripcion="Lista de ambientes registrados"
          filas={ambientes}
          obtenerClave={(a) => a.id}
          mensajeVacio="Todavía no hay ambientes registrados."
          columnas={[
            { encabezado: "Nombre", render: (a) => a.nombre },
            { encabezado: "Tipo", render: (a) => a.tipo },
            { encabezado: "Capacidad", render: (a) => a.capacidad },
            { encabezado: "Ubicación", render: (a) => a.ubicacion },
            { encabezado: "Estado", render: (a) => a.estado },
          ]}
        />
      )}
    </section>
  );
}

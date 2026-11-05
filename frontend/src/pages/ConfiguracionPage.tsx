/**
 * ConfiguracionPage — Página de configuración del perfil y apariencia (FASE 4).
 *
 * Contenido:
 *   1. Tarjeta "Mi cuenta":
 *      - Muestra en solo lectura los datos del usuario autenticado (nombre, correo, rol e id).
 *   2. Tarjeta "Apariencia":
 *      - Radio buttons para elegir el tema: Claro, Oscuro o Según el sistema.
 *      - Conectado directamente a TemaContext (useTema), persistiendo en localStorage.
 */
import { useAuth } from "../contexts/AuthContext";
import { useTema, type OpcionTema } from "../contexts/TemaContext";

export function ConfiguracionPage() {
  const { usuario } = useAuth();
  const { tema, setTema } = useTema();

  if (!usuario) return null;

  return (
    <section>
      <div className="titulo-fila">
        <h2>Configuración</h2>
      </div>

      <div className="tarjetas-grid" style={{ display: "grid", gap: "1.5rem", maxWidth: 700 }}>
        {/* Tarjeta 1: Información de la cuenta */}
        <div className="tarjeta-configuracion">
          <h3 style={{ margin: "0 0 1rem" }}>Mi cuenta</h3>
          <p className="ayuda" style={{ marginBottom: "1.25rem" }}>
            Información registrada en el sistema de reservas. Los cambios de perfil deben ser gestionados por el Administrador.
          </p>

          <dl className="detalle" style={{ margin: 0 }}>
            <dt>Nombre completo</dt>
            <dd><strong>{usuario.nombreCompleto}</strong></dd>

            <dt>Correo institucional</dt>
            <dd>{usuario.correo}</dd>

            <dt>Rol asignado</dt>
            <dd>
              <span className="estado estado-pendiente" style={{ fontWeight: 600 }}>
                {usuario.rol}
              </span>
            </dd>

            <dt>Identificador de cuenta</dt>
            <dd><code style={{ fontSize: "0.85rem" }}>{usuario.id}</code></dd>
          </dl>
        </div>

        {/* Tarjeta 2: Apariencia y tema */}
        <div className="tarjeta-configuracion">
          <h3 style={{ margin: "0 0 0.5rem" }}>Apariencia</h3>
          <p className="ayuda" style={{ marginBottom: "1.25rem" }}>
            Elige el tema visual de la aplicación. Puedes seleccionar un tema fijo o permitir que se ajuste al del sistema operativo.
          </p>

          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend className="solo-lectores">Opciones de tema</legend>
            <div className="opciones-tema-lista" style={{ display: "grid", gap: "0.75rem" }}>
              {(
                [
                  {
                    valor: "claro",
                    titulo: "Modo claro",
                    descripcion: "Paleta clara inspirada en los colores institucionales de la UPLA.",
                  },
                  {
                    valor: "oscuro",
                    titulo: "Modo oscuro",
                    descripcion: "Fondo oscuro de alto contraste (WCAG AA), ideal para entornos con poca luz.",
                  },
                  {
                    valor: "sistema",
                    titulo: "Según el sistema",
                    descripcion: "Se sincroniza automáticamente con la preferencia del sistema operativo de tu equipo.",
                  },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.valor}
                  className={`opcion-tema-card ${tema === opt.valor ? "opcion-tema-seleccionada" : ""}`}
                >
                  <input
                    type="radio"
                    name="tema-app"
                    value={opt.valor}
                    checked={tema === opt.valor}
                    onChange={() => setTema(opt.valor as OpcionTema)}
                  />
                  <div>
                    <span className="opcion-tema-titulo">{opt.titulo}</span>
                    <p className="ayuda" style={{ margin: "0.2rem 0 0" }}>{opt.descripcion}</p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>
    </section>
  );
}

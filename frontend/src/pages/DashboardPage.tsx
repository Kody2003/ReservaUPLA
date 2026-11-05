/**
 * DashboardPage — Panel de indicadores para el Administrador (RF-08).
 *
 * Características:
 *  - 4 tarjetas superiores con bordes de color e íconos SVG:
 *      · Total de reservas (azul)
 *      · Pendientes (ámbar, con la leyenda didáctica requerida)
 *      · Aprobadas (verde)
 *      · Rechazadas (rojo)
 *  - Segunda fila con 3 bloques analíticos con datos 100% reales:
 *      a) "Ambiente más utilizado": nombre grande, total de reservas aprobadas y barra de porcentaje
 *         que representan sobre el total de aprobadas ("X% de las reservas aprobadas").
 *      b) "Reservas por día": gráfico de barras en SVG inline con ejes, conteo real por fecha y tooltips accesibles.
 *      c) "Ambientes más utilizados": ranking numerado (hasta 5) con barras proporcionales según reservas aprobadas.
 *  - Estado de carga y manejo de error visibles.
 *  - Diseño responsive: se apila a 1 columna en pantallas < 900px.
 */
import { useCallback, useMemo } from "react";
import { AlertMessage } from "../components/ui/AlertMessage";
import { useCargarDatos } from "../hooks/useCargarDatos";
import { dashboardService } from "../services/dashboardService";
import { reservasService } from "../services/reservasService";

/** Ícono de Calendario para Total de Reservas. */
function IconoCalendario() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/** Ícono de Reloj / Espera para Pendientes. */
function IconoReloj() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/** Ícono de Aprobado (Check) para Reservas Aprobadas. */
function IconoCheck() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

/** Ícono de Rechazado (X) para Reservas Rechazadas. */
function IconoCruz() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

/** Ícono de Trofeo para Rankings. */
function IconoTrofeo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34" />
      <path d="M6 2h12v7a6 6 0 0 1-12 0V2z" />
    </svg>
  );
}

/** Ícono de Gráfico de Barras. */
function IconoGrafico() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

/** Ícono de Edificio / Ambiente. */
function IconoAmbiente() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M8 10h.01" />
      <path d="M16 10h.01" />
      <path d="M8 14h.01" />
      <path d="M16 14h.01" />
    </svg>
  );
}

export function DashboardPage() {
  // Carga de datos reales: indicadores del dashboard y listado completo de reservas
  const cargarDashboard = useCallback(() => dashboardService.obtener(), []);
  const cargarReservas = useCallback(() => reservasService.listar(), []);

  const { datos: dashboard, cargando: cargandoDash, error: errorDash } = useCargarDatos(cargarDashboard);
  const { datos: reservas, cargando: cargandoRes, error: errorRes } = useCargarDatos(cargarReservas);

  const cargando = cargandoDash || cargandoRes;
  const error = errorDash || errorRes;

  // a) Ambiente más utilizado y porcentaje sobre total de aprobadas
  const ambienteTop = dashboard?.ambienteMasUtilizado;
  const totalAprobadas = dashboard?.aprobadas ?? 0;
  const porcentajeTop = useMemo(() => {
    if (!ambienteTop || totalAprobadas === 0) return 0;
    return Math.round((ambienteTop.totalReservas / totalAprobadas) * 100);
  }, [ambienteTop, totalAprobadas]);

  // b) Reservas por fecha para el gráfico en SVG inline
  const reservasPorFecha = useMemo(() => {
    if (!reservas || reservas.length === 0) return [];
    const conteo: Record<string, number> = {};
    for (const r of reservas) {
      if (r.fecha) {
        conteo[r.fecha] = (conteo[r.fecha] || 0) + 1;
      }
    }
    // Orden cronológico
    const entradas = Object.entries(conteo).sort((a, b) => a[0].localeCompare(b[0]));
    // Mostramos hasta las últimas 8 fechas registradas
    return entradas.slice(-8);
  }, [reservas]);

  // c) Ranking de hasta 5 ambientes más utilizados según reservas aprobadas reales
  const rankingAmbientes = useMemo(() => {
    if (!reservas || reservas.length === 0) return [];
    const aprobadas = reservas.filter((r) => r.estado === "Aprobada");
    const conteo: Record<string, { nombre: string; total: number }> = {};
    for (const r of aprobadas) {
      if (!conteo[r.ambienteId]) {
        conteo[r.ambienteId] = { nombre: r.ambienteNombre, total: 0 };
      }
      conteo[r.ambienteId].total += 1;
    }
    return Object.values(conteo).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [reservas]);

  const maxReservasRanking = useMemo(() => {
    return rankingAmbientes.length > 0 ? rankingAmbientes[0].total : 1;
  }, [rankingAmbientes]);

  return (
    <section>
      <div className="titulo-fila">
        <h2>Resumen de reservas</h2>
      </div>

      <AlertMessage tipo="error" mensaje={error} />
      {cargando && <p>Cargando indicadores y estadísticas del sistema...</p>}

      {dashboard && (
        <>
          {/* Fila 1: 4 tarjetas con borde de color, ícono SVG y valor grande */}
          <div className="dashboard-stats-grid">
            {/* 1. Total de reservas */}
            <div className="dashboard-stat-card stat-card-total">
              <div className="stat-card-top">
                <span className="stat-card-titulo">Total de reservas</span>
                <span className="stat-card-icono stat-icono-total" aria-hidden="true">
                  <IconoCalendario />
                </span>
              </div>
              <p className="stat-card-valor">{dashboard.total}</p>
              <p className="stat-card-leyenda">Registradas en el sistema</p>
            </div>

            {/* 2. Pendientes */}
            <div className="dashboard-stat-card stat-card-pendientes">
              <div className="stat-card-top">
                <span className="stat-card-titulo">Pendientes</span>
                <span className="stat-card-icono stat-icono-pendientes" aria-hidden="true">
                  <IconoReloj />
                </span>
              </div>
              <p className="stat-card-valor">{dashboard.pendientes}</p>
              <p className="stat-card-leyenda">Esperan una decisión del administrador</p>
            </div>

            {/* 3. Aprobadas */}
            <div className="dashboard-stat-card stat-card-aprobadas">
              <div className="stat-card-top">
                <span className="stat-card-titulo">Aprobadas</span>
                <span className="stat-card-icono stat-icono-aprobadas" aria-hidden="true">
                  <IconoCheck />
                </span>
              </div>
              <p className="stat-card-valor">{dashboard.aprobadas}</p>
              <p className="stat-card-leyenda">Horarios confirmados</p>
            </div>

            {/* 4. Rechazadas */}
            <div className="dashboard-stat-card stat-card-rechazadas">
              <div className="stat-card-top">
                <span className="stat-card-titulo">Rechazadas</span>
                <span className="stat-card-icono stat-icono-rechazadas" aria-hidden="true">
                  <IconoCruz />
                </span>
              </div>
              <p className="stat-card-valor">{dashboard.rechazadas}</p>
              <p className="stat-card-leyenda">Solicitudes denegadas</p>
            </div>
          </div>

          {/* Fila 2: 3 bloques analíticos (ambiente más utilizado, gráfico por día y ranking) */}
          <div className="dashboard-secundario-grid">
            {/* Bloque A: Ambiente más utilizado */}
            <div className="tarjeta-dashboard-bloque">
              <div className="bloque-header">
                <h3>
                  <span style={{ color: "var(--primario)" }}><IconoAmbiente /></span>
                  Ambiente más utilizado
                </h3>
              </div>
              {ambienteTop ? (
                <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0.25rem 0 0.4rem", color: "var(--texto)" }}>
                      {ambienteTop.nombre}
                    </p>
                    <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--ok)", margin: 0 }}>
                      {ambienteTop.totalReservas} reservas aprobadas
                    </p>
                  </div>
                  <div style={{ marginTop: "1.5rem" }}>
                    <div className="barra-progreso-contenedor">
                      <div
                        className="barra-progreso-llenado"
                        style={{ width: `${porcentajeTop}%` }}
                        aria-valuenow={porcentajeTop}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        role="progressbar"
                      />
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--texto-suave)", margin: "0.3rem 0 0", textAlign: "right" }}>
                      <strong>{porcentajeTop}%</strong> de las reservas aprobadas
                    </p>
                  </div>
                </div>
              ) : (
                <p className="ayuda" style={{ marginTop: "1rem" }}>
                  Aún no hay reservas aprobadas para determinar el ambiente de mayor uso.
                </p>
              )}
            </div>

            {/* Bloque B: Reservas por día (gráfico en SVG inline) */}
            <div className="tarjeta-dashboard-bloque">
              <div className="bloque-header">
                <h3>
                  <span style={{ color: "var(--primario)" }}><IconoGrafico /></span>
                  Reservas por día
                </h3>
              </div>
              {reservasPorFecha.length > 0 ? (
                <div className="grafico-svg-contenedor">
                  {(() => {
                    const anchoTotal = 340;
                    const altoTotal = 160;
                    const margenInferior = 30;
                    const margenSuperior = 20;
                    const alturaUtil = altoTotal - margenInferior - margenSuperior;
                    const maxVal = Math.max(...reservasPorFecha.map(([, cant]) => cant), 1);
                    const anchoBarra = Math.min(26, Math.floor((anchoTotal - 40) / reservasPorFecha.length) - 8);
                    const espacioPaso = (anchoTotal - 40) / reservasPorFecha.length;

                    return (
                      <svg
                        viewBox={`0 0 ${anchoTotal} ${altoTotal}`}
                        width="100%"
                        height="100%"
                        style={{ overflow: "visible" }}
                        role="img"
                        aria-label="Gráfico de reservas registradas por fecha"
                      >
                        {/* Línea base del eje horizontal */}
                        <line
                          x1="15"
                          y1={altoTotal - margenInferior}
                          x2={anchoTotal - 15}
                          y2={altoTotal - margenInferior}
                          stroke="var(--borde)"
                          strokeWidth="1.5"
                        />
                        {reservasPorFecha.map(([fecha, cant], idx) => {
                          const x = 25 + idx * espacioPaso + (espacioPaso - anchoBarra) / 2;
                          const h = (cant / maxVal) * alturaUtil;
                          const y = altoTotal - margenInferior - h;
                          const fechaCorta = fecha.slice(5); // "MM-DD"
                          return (
                            <g key={fecha} className="barra-grafico-grupo">
                              <title>{`${fecha}: ${cant} reserva(s)`}</title>
                              {/* Barra vertical con bordes superiores redondeados */}
                              <rect
                                x={x}
                                y={y}
                                width={anchoBarra}
                                height={Math.max(h, 3)}
                                rx="4"
                                fill="var(--primario)"
                                style={{ transition: "all 0.2s ease" }}
                              />
                              {/* Etiqueta de cantidad arriba de la barra */}
                              <text
                                x={x + anchoBarra / 2}
                                y={y - 5}
                                textAnchor="middle"
                                fontSize="11"
                                fontWeight="700"
                                fill="var(--texto)"
                              >
                                {cant}
                              </text>
                              {/* Etiqueta de fecha corta en el eje X */}
                              <text
                                x={x + anchoBarra / 2}
                                y={altoTotal - margenInferior + 16}
                                textAnchor="middle"
                                fontSize="10"
                                fill="var(--texto-suave)"
                              >
                                {fechaCorta}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
              ) : (
                <p className="ayuda" style={{ marginTop: "1rem" }}>
                  No hay reservas registradas para mostrar el gráfico.
                </p>
              )}
            </div>

            {/* Bloque C: Ambientes más utilizados (ranking numerado hasta 5) */}
            <div className="tarjeta-dashboard-bloque">
              <div className="bloque-header">
                <h3>
                  <span style={{ color: "#d97706" }}><IconoTrofeo /></span>
                  Ambientes más utilizados
                </h3>
              </div>
              {rankingAmbientes.length > 0 ? (
                <ul className="ranking-lista">
                  {rankingAmbientes.map((item, idx) => {
                    const anchoPct = Math.round((item.total / maxReservasRanking) * 100);
                    return (
                      <li key={item.nombre} className="ranking-item">
                        <div className="ranking-item-top">
                          <span style={{ fontWeight: 600, color: "var(--texto)", display: "flex", alignItems: "center" }}>
                            <span className="ranking-posicion">{idx + 1}</span>
                            {item.nombre}
                          </span>
                          <span style={{ fontWeight: 700, color: "var(--ok)", fontSize: "0.85rem" }}>
                            {item.total} {item.total === 1 ? "reserva" : "reservas"}
                          </span>
                        </div>
                        <div className="ranking-barra-fondo">
                          <div className="ranking-barra-relleno" style={{ width: `${anchoPct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="ayuda" style={{ marginTop: "1rem" }}>
                  Aún no hay reservas aprobadas para elaborar el ranking de ambientes.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

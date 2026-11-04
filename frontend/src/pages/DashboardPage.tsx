import { useCallback } from "react";
import { AlertMessage } from "../components/ui/AlertMessage";
import { CardIndicador } from "../components/ui/CardIndicador";
import { useCargarDatos } from "../hooks/useCargarDatos";
import { dashboardService } from "../services/dashboardService";

/**
 * RF-08: pantalla de inicio con los indicadores: total, pendientes, aprobadas, rechazadas
 * y el ambiente más utilizado. La página solo pide los datos y se los pasa a las tarjetas.
 */
export function DashboardPage() {
  const cargar = useCallback(() => dashboardService.obtener(), []);
  const { datos, cargando, error } = useCargarDatos(cargar);

  return (
    <section>
      <h2>Resumen de reservas</h2>
      <AlertMessage tipo="error" mensaje={error} />
      {cargando && <p>Cargando indicadores...</p>}

      {datos && (
        <div className="indicadores">
          <CardIndicador titulo="Total de reservas" valor={datos.total} />
          <CardIndicador titulo="Pendientes" valor={datos.pendientes} descripcion="Esperan una decisión del administrador" />
          <CardIndicador titulo="Aprobadas" valor={datos.aprobadas} />
          <CardIndicador titulo="Rechazadas" valor={datos.rechazadas} />
          <CardIndicador
            titulo="Ambiente más utilizado"
            valor={datos.ambienteMasUtilizado?.nombre ?? "Sin datos"}
            descripcion={
              datos.ambienteMasUtilizado
                ? `${datos.ambienteMasUtilizado.totalReservas} reservas aprobadas`
                : "Aún no hay reservas aprobadas"
            }
          />
        </div>
      )}
    </section>
  );
}

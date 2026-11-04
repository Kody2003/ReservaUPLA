import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { AmbientesPage } from "./pages/AmbientesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NuevaReservaPage } from "./pages/NuevaReservaPage";
import { ReservaDetallePage } from "./pages/ReservaDetallePage";
import { ReservasPage } from "./pages/ReservasPage";
import { UsuariosPage } from "./pages/UsuariosPage";

/**
 * Mapa de rutas de la aplicación: qué página se muestra para cada dirección.
 * Todas comparten el Layout (cabecera + navegación).
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="ambientes" element={<AmbientesPage />} />
        <Route path="reservas" element={<ReservasPage />} />
        <Route path="reservas/nueva" element={<NuevaReservaPage />} />
        <Route path="reservas/:id" element={<ReservaDetallePage />} />
        <Route path="*" element={<p>La página que buscas no existe. Usa el menú para volver.</p>} />
      </Route>
    </Routes>
  );
}

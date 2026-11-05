/**
 * App — Mapa de rutas de la aplicación (FASE 3: actualizado).
 *
 * Cambios respecto a la versión anterior:
 *   - Se añade la ruta /login (sin Layout, sin RutaProtegida).
 *   - Todas las rutas existentes quedan envueltas en <RutaProtegida>,
 *     que redirige a /login si el usuario no está autenticado.
 *   - Los providers (AuthProvider, TemaProvider) viven en main.tsx para
 *     separar la configuración de contextos de la definición de rutas.
 */
import { Route, Routes } from "react-router-dom";
import { RutaProtegida } from "./components/auth/RutaProtegida";
import { Layout } from "./components/layout/Layout";
import { AmbientesPage }      from "./pages/AmbientesPage";
import { DashboardPage }      from "./pages/DashboardPage";
import { LoginPage }          from "./pages/LoginPage";
import { NuevaReservaPage }   from "./pages/NuevaReservaPage";
import { ReservaDetallePage } from "./pages/ReservaDetallePage";
import { ReservasPage }       from "./pages/ReservasPage";
import { UsuariosPage }       from "./pages/UsuariosPage";

/**
 * Árbol de rutas:
 *   /login             → LoginPage (pública, sin barra de navegación)
 *   /                  → DashboardPage  (protegida)
 *   /usuarios          → UsuariosPage   (protegida)
 *   /ambientes         → AmbientesPage  (protegida)
 *   /reservas          → ReservasPage   (protegida)
 *   /reservas/nueva    → NuevaReservaPage (protegida)
 *   /reservas/:id      → ReservaDetallePage (protegida)
 */
export default function App() {
  return (
    <Routes>
      {/* Ruta pública: no lleva Layout ni RutaProtegida // LOGIN */}
      <Route path="login" element={<LoginPage />} />

      {/* Rutas protegidas: RutaProtegida valida el token antes de renderizar */}
      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="usuarios"       element={<UsuariosPage />} />
          <Route path="ambientes"      element={<AmbientesPage />} />
          <Route path="reservas"       element={<ReservasPage />} />
          <Route path="reservas/nueva" element={<NuevaReservaPage />} />
          <Route path="reservas/:id"   element={<ReservaDetallePage />} />
          <Route path="*"              element={<p>La página que buscas no existe. Usa el menú para volver.</p>} />
        </Route>
      </Route>
    </Routes>
  );
}

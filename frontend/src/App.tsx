/**
 * App — Mapa de rutas y permisos por rol (FASE 4 + AJUSTE 2).
 *
 * Jerarquía de acceso y redirección (AJUSTE 2):
 *   · Administrador:
 *       Dashboard (/), Reservas (/reservas), Ambientes (/ambientes), Usuarios (/usuarios),
 *       Configuración (/configuracion), Cambiar contraseña (/cambiar-contrasena).
 *   · ResponsableAmbiente:
 *       Reservas (/reservas), Ambientes (/ambientes), Configuración, Cambiar contraseña.
 *       (Si intenta ingresar a / o /usuarios por URL, se le redirige a /reservas).
 *   · Solicitante:
 *       "Mis reservas" (/reservas), "Nueva reserva" (/reservas/nueva), Detalle (/reservas/:id),
 *       Configuración, Cambiar contraseña.
 *       (Si intenta ingresar a /, /ambientes o /usuarios por URL, se le redirige a /reservas).
 *   · Login:
 *       Ruta pública (/login) sin Layout institucional.
 */
import { Route, Routes } from "react-router-dom";
import { RutaProtegida } from "./components/auth/RutaProtegida";
import { Layout } from "./components/layout/Layout";
import { AmbientesPage } from "./pages/AmbientesPage";
import { CambiarContrasenaPage } from "./pages/CambiarContrasenaPage";
import { ConfiguracionPage } from "./pages/ConfiguracionPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { NuevaReservaPage } from "./pages/NuevaReservaPage";
import { ReservaDetallePage } from "./pages/ReservaDetallePage";
import { ReservasPage } from "./pages/ReservasPage";
import { UsuariosPage } from "./pages/UsuariosPage";

export default function App() {
  return (
    <Routes>
      {/* ── Ruta pública de autenticación ── */}
      <Route path="login" element={<LoginPage />} />

      {/* ── Rutas autenticadas dentro del Layout ── */}
      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          {/* Dashboard (RF-08): Solo Administrador // AJUSTE 2 */}
          <Route element={<RutaProtegida rolesPermitidos={["Administrador"]} />}>
            <Route index element={<DashboardPage />} />
          </Route>

          {/* Gestión de usuarios (RF-01): Solo Administrador // AJUSTE 2 */}
          <Route element={<RutaProtegida rolesPermitidos={["Administrador"]} />}>
            <Route path="usuarios" element={<UsuariosPage />} />
          </Route>

          {/* Gestión de ambientes (RF-02): Administrador y Responsable de Ambiente // AJUSTE 2 */}
          <Route element={<RutaProtegida rolesPermitidos={["Administrador", "ResponsableAmbiente"]} />}>
            <Route path="ambientes" element={<AmbientesPage />} />
          </Route>

          {/* Reservas (RF-05, RF-03, RF-06): Accesibles para todos los usuarios autenticados */}
          <Route path="reservas" element={<ReservasPage />} />
          <Route path="reservas/nueva" element={<NuevaReservaPage />} />
          <Route path="reservas/:id" element={<ReservaDetallePage />} />

          {/* Cuenta y personalización (FASE 4) */}
          <Route path="configuracion" element={<ConfiguracionPage />} />
          <Route path="cambiar-contrasena" element={<CambiarContrasenaPage />} />

          {/* Ruta no encontrada */}
          <Route path="*" element={<p>La página que buscas no existe. Usa la barra de navegación para volver.</p>} />
        </Route>
      </Route>
    </Routes>
  );
}

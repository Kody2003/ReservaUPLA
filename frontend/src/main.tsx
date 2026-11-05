/**
 * main.tsx — Punto de entrada de la aplicación React (FASE 3: actualizado).
 *
 * Orden de los providers (de exterior a interior):
 *   1. StrictMode      — detecta efectos dobles en desarrollo
 *   2. BrowserRouter   — enrutador de React Router
 *   3. TemaProvider    — gestiona el modo claro/oscuro; envuelve todo
 *      para que incluso LoginPage tenga acceso al tema
 *   4. AuthProvider    — gestiona la sesión JWT; también envuelve todo
 *      para que RutaProtegida y apiClient lean el token desde el contexto
 *   5. App             — define las rutas y los componentes de página
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { TemaProvider } from "./contexts/TemaContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TemaProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </TemaProvider>
    </BrowserRouter>
  </StrictMode>,
);

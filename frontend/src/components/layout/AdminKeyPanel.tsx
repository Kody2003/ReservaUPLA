import { useState } from "react";
import type { FormEvent } from "react";
import { useClaveAdmin } from "../../hooks/useClaveAdmin";
import { guardarClaveAdmin } from "../../services/claveAdmin";
import { Button } from "../ui/Button";
import { TextInput } from "../ui/TextInput";

/**
 * Panel de la cabecera para activar el "modo administrador" (RN-05).
 * Es la autenticación mínima: el usuario escribe la clave y el frontend la envía en cada petición.
 * El backend es quien decide si la clave es correcta.
 */
export function AdminKeyPanel() {
  const claveGuardada = useClaveAdmin();
  const [texto, setTexto] = useState("");

  function activar(e: FormEvent) {
    e.preventDefault();
    if (texto.trim()) {
      guardarClaveAdmin(texto.trim());
      setTexto("");
    }
  }

  if (claveGuardada) {
    return (
      <div className="admin-panel">
        <span className="admin-activo">Modo administrador activo</span>
        <Button variante="secundario" onClick={() => guardarClaveAdmin("")}>
          Salir del modo
        </Button>
      </div>
    );
  }

  return (
    <form className="admin-panel" onSubmit={activar} noValidate>
      <TextInput etiqueta="Clave de administrador" tipo="password" valor={texto} onCambio={setTexto} />
      <Button type="submit" variante="secundario" disabled={!texto.trim()}>
        Activar
      </Button>
    </form>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FloatingAlert } from "@/components/ui/floating-alert";
import { FloatingInput } from "@/components/forms/floating-input";
import {
  Building2,
  Phone,
  MapPin,
  Map,
  Banknote,
  Users,
  ChevronDown,
  Lightbulb,
} from "lucide-react";
import { Row, RowCheckbox } from "../ui/row";

type TenantRequestUser = {
  id: number;
  email: string;
};

const CAPACITY_PRESETS = ["5 vs 5", "7 vs 7", "9 vs 9", "11 vs 11"];
const OTHER_CAPACITY = "otra";

export function TenantRequestScreen({ user, isTenant = false }: { user?: TenantRequestUser | null; isTenant?: boolean }) {
  const [complexName, setComplexName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [courtName, setCourtName] = useState("");
  const [surface, setSurface] = useState("");
  const [capacityPreset, setCapacityPreset] = useState("");
  const [capacityCustom, setCapacityCustom] = useState("");
  const [price, setPrice] = useState("");
  const [hasLights, setHasLights] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ key: number; message: string; variant: "default" | "negative" } | null>(null);

  function resetForm() {
    setComplexName("");
    setPhone("");
    setAddress("");
    setMapsUrl("");
    setCourtName("");
    setSurface("");
    setCapacityPreset("");
    setCapacityCustom("");
    setPrice("");
  }

  async function submitRequest() {
    const capacity = capacityPreset === OTHER_CAPACITY ? capacityCustom : capacityPreset;

    try {
      setLoading(true);

      const payload = {
        userId: user?.id ?? 0,
        userEmail: user?.email ?? "",
        complexName,
        phone,
        address,
        mapsUrl,
        courtName,
        hasLights,
        surface,
        capacity,
        price,
      };

      const response = await fetch("/api/tenant/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      let data: { error?: string; message?: string } | null = null;

      if (raw) {
        try {
          data = JSON.parse(raw) as { error?: string; message?: string };
        } catch {
          throw new Error("La solicitud no pudo procesarse. Revisa la ruta o intenta nuevamente.");
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo enviar la solicitud.");
      }

      setAlert((prev) => ({
        key: (prev?.key ?? 0) + 1,
        message: data?.message || "Solicitud enviada correctamente.",
        variant: "default",
      }));
      resetForm();
    } catch (error) {
      setAlert((prev) => ({
        key: (prev?.key ?? 0) + 1,
        message: error instanceof Error ? error.message : "No se pudo enviar la solicitud.",
        variant: "negative",
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
  <div className="space-y-6">
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
        {isTenant ? "Solicitud de nueva cancha" : "Solicitud de Tenant"}
      </p>

      <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-black">
        {isTenant ? "Solicita una cancha adicional" : "Conviértete en dueño de cancha"}
      </h1>

      <p className="mt-3 max-w-2xl text-sm text-muted">
        {isTenant
          ? "Completa la información de la nueva cancha que querés agregar. Un administrador revisará tu solicitud antes de aprobarla."
          : "Completa la información de tu complejo deportivo. Un administrador revisará tu solicitud antes de aprobarla."}
      </p>
    </div>

    <form
      onSubmit={(event) => {
        event.preventDefault();
        submitRequest();
      }}
    >
      <Card className="p-6">
        <fieldset disabled={loading} className="m-0 min-w-0 space-y-5 border-0 p-0">
          <FloatingInput
            id="complex-name"
            label="Nombre del complejo"
            type="text"
            value={complexName}
            onChange={setComplexName}
            placeholder="Ej. Complejo Deportivo La Sabana (De no estar en un complejo formal, puede usar el pueblo al que pertenece)"
            icon={<Building2 size={16} />}
            required
          />

          <FloatingInput
            id="phone"
            label="Teléfono"
            type="text"
            value={phone}
            onChange={setPhone}
            placeholder="8888-8888"
            icon={<Phone size={16} />}
            required
          />

          <div>
            <FloatingInput
              id="address"
              label="Dirección"
              type="text"
              value={address}
              onChange={setAddress}
              placeholder="Provincia, cantón, distrito..."
              icon={<MapPin size={16} />}
              required
            />
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
              ¿No tenés un complejo deportivo formal? Poné solo el pueblo al que pertenece.
            </p>
          </div>

          <FloatingInput
            id="maps"
            label="Google Maps (opcional)"
            type="url"
            value={mapsUrl}
            onChange={setMapsUrl}
            placeholder="https://maps.google.com/..."
            icon={<Map size={16} />}
          />

          <div className="border-t border-black pt-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Información de la cancha
            </p>
          </div>

          <FloatingInput
            id="court-name"
            label="Nombre de la cancha"
            type="text"
            value={courtName}
            onChange={setCourtName}
            placeholder="Cancha #1"
            icon={<Building2 size={16} />}
            required
          />

          <LabeledSelect
            id="surface"
            label="Superficie"
            value={surface}
            onChange={setSurface}
            icon={<MapPin size={16} />}
            required
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            <option value="synthetic">Sintética</option>
            <option value="natural">Natural</option>
            <option value="indoor">Indoor</option>
          </LabeledSelect>

          <LabeledSelect
            id="capacity"
            label="Capacidad"
            value={capacityPreset}
            onChange={setCapacityPreset}
            icon={<Users size={16} />}
            required
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            {CAPACITY_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
            <option value={OTHER_CAPACITY}>Otra</option>
          </LabeledSelect>

          {capacityPreset === OTHER_CAPACITY && (
            <FloatingInput
              id="capacity-custom"
              label="Especifica la capacidad"
              type="text"
              value={capacityCustom}
              onChange={setCapacityCustom}
              placeholder="Ej. 6 vs 6"
              icon={<Users size={16} />}
              required
            />
          )}

          <FloatingInput
            id="price"
            label="Precio por hora"
            type="number"
            value={price}
            onChange={setPrice}
            placeholder="12000"
            icon={<Banknote size={16} />}
            rightSlot={<span className="font-mono text-xs font-bold text-muted">₡</span>}
            required
          />
          <ul>
            <Row
              left={
                <RowCheckbox
                  checked={hasLights}
                  onCheckedChange={setHasLights}
                  aria-label="La cancha tiene luces"
                />
              }
              title="¿La cancha tiene luces?"
            />
          </ul>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar solicitud"}
            </Button>
          </div>
        </fieldset>
      </Card>
    </form>

    {alert && (
      <FloatingAlert
        key={alert.key}
        message={alert.message}
        variant={alert.variant}
        onDismiss={() => setAlert(null)}
      />
    )}
  </div>
);
}

function LabeledSelect({
  id,
  label,
  value,
  onChange,
  icon,
  required,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 border border-black bg-paper px-3.5 py-2 focus-within:outline-2 focus-within:outline-black focus-within:outline-offset-2">
      <span className="text-black">{icon}</span>
      <div className="flex-1">
        <label
          htmlFor={id}
          className="block font-mono text-[10px] font-bold uppercase tracking-wider text-muted"
        >
          {label}
        </label>
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          className="w-full appearance-none bg-transparent font-sans text-sm text-black outline-none"
        >
          {children}
        </select>
      </div>
      <ChevronDown size={14} strokeWidth={2} className="pointer-events-none text-black" aria-hidden />
    </div>
  );
}
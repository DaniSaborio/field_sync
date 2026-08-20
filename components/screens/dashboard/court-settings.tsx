"use client";

import { useState, type ReactNode } from "react";
import { Banknote, Building2, ChevronDown, CloudSun, MapPin, Map, Moon, Sun, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FloatingInput } from "@/components/forms/floating-input";

type Surface = "synthetic" | "natural" | "indoor";
type ScheduleKey = "morning" | "afternoon" | "night";

export type EditableCourt = {
  id: number;
  name: string;
  location: string;
  mapsUrl?: string | null;
  surface: Surface;
  capacity: string;
  pricePerHour: number;
  rates: Record<ScheduleKey, number | null>;
};

const SCHEDULE_SLOTS: { key: ScheduleKey; label: string; hint: string; icon: typeof Sun }[] = [
  { key: "morning", label: "Mañana", hint: "Antes de las 12:00", icon: Sun },
  { key: "afternoon", label: "Tarde", hint: "12:00 – 18:00", icon: CloudSun },
  { key: "night", label: "Noche", hint: "Desde las 18:00", icon: Moon },
];

export function CourtEditModal({
  court,
  tenantId,
  open,
  onClose,
  onSaved,
}: {
  court: EditableCourt | null;
  tenantId: number;
  open: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  if (!court) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Editar ${court.name}`} className="sm:max-w-xl">
      <CourtEditForm key={court.id} court={court} tenantId={tenantId} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}

function CourtEditForm({
  court,
  tenantId,
  onClose,
  onSaved,
}: {
  court: EditableCourt;
  tenantId: number;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [name, setName] = useState(court.name);
  const [address, setAddress] = useState(court.location === "Ubicación no disponible" ? "" : court.location);
  const [mapsUrl, setMapsUrl] = useState(court.mapsUrl ?? "");
  const [surface, setSurface] = useState<Surface>(court.surface);
  const [capacity, setCapacity] = useState(court.capacity ?? "");
  const [price, setPrice] = useState(String(court.pricePerHour ?? ""));
  const [rateOverrides, setRateOverrides] = useState<Record<ScheduleKey, boolean>>({
    morning: court.rates.morning !== null,
    afternoon: court.rates.afternoon !== null,
    night: court.rates.night !== null,
  });
  const [rateValues, setRateValues] = useState<Record<ScheduleKey, string>>({
    morning: court.rates.morning !== null ? String(court.rates.morning) : "",
    afternoon: court.rates.afternoon !== null ? String(court.rates.afternoon) : "",
    night: court.rates.night !== null ? String(court.rates.night) : "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");

    const trimmedName = name.trim();
    const trimmedCapacity = capacity.trim();
    const priceNumber = Number(price);

    if (!trimmedName) {
      setError("El nombre de la cancha es obligatorio");
      return;
    }
    if (!trimmedCapacity) {
      setError("La capacidad es obligatoria");
      return;
    }
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      setError("El precio base por hora debe ser un número mayor a cero");
      return;
    }

    const rates: Record<ScheduleKey, number | null> = { morning: null, afternoon: null, night: null };

    for (const slot of SCHEDULE_SLOTS) {
      if (!rateOverrides[slot.key]) continue;
      const value = Number(rateValues[slot.key]);
      if (!Number.isFinite(value) || value <= 0) {
        setError(`El precio para "${slot.label}" debe ser un número mayor a cero`);
        return;
      }
      rates[slot.key] = value;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/tenant/courts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          courtId: court.id,
          name: trimmedName,
          address: address.trim(),
          mapsUrl: mapsUrl.trim() || null,
          surface,
          capacity: trimmedCapacity,
          pricePerHour: priceNumber,
          rates,
        }),
      });

      const raw = await response.text();
      const data = raw ? (JSON.parse(raw) as { ok?: boolean; error?: string }) : null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "No pudimos guardar los cambios");
      }

      onSaved("Cancha actualizada correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar los cambios");
    } finally {
      setLoading(false);
    }
  }

  return (
    <fieldset disabled={loading} className="m-0 min-w-0 space-y-5 border-0 p-0">
        {error ? (
          <p role="alert" className="border border-black bg-black px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-paper">
            {error}
          </p>
        ) : null}

        <FloatingInput id="edit-court-name" label="Nombre de la cancha" type="text" value={name} onChange={setName} icon={<Building2 size={16} />} required />
        <FloatingInput id="edit-court-address" label="Dirección" type="text" value={address} onChange={setAddress} icon={<MapPin size={16} />} />
        <FloatingInput id="edit-court-maps" label="Google Maps (opcional)" type="url" value={mapsUrl} onChange={setMapsUrl} icon={<Map size={16} />} />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <LabeledSelect id="edit-court-surface" label="Superficie" value={surface} onChange={(value) => setSurface(value as Surface)} icon={<MapPin size={16} />}>
            <option value="synthetic">Sintética</option>
            <option value="natural">Natural</option>
            <option value="indoor">Indoor</option>
          </LabeledSelect>
          <FloatingInput id="edit-court-capacity" label="Capacidad" type="text" value={capacity} onChange={setCapacity} icon={<Users size={16} />} required />
        </div>

        <FloatingInput
          id="edit-court-price"
          label="Precio base por hora"
          type="number"
          value={price}
          onChange={setPrice}
          icon={<Banknote size={16} />}
          rightSlot={<span className="font-mono text-xs font-bold text-muted">₡</span>}
          required
        />

        <div className="border-t border-black pt-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Precios por franja horaria</p>
          <p className="mt-1.5 text-xs text-muted">
            Activa una franja para cobrar un precio distinto al base. Si la dejas apagada, se cobra el precio base.
          </p>
        </div>

        <div className="space-y-3">
          {SCHEDULE_SLOTS.map((slot) => {
            const Icon = slot.icon;
            const active = rateOverrides[slot.key];
            return (
              <div key={slot.key} className="border border-black bg-paper p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="shrink-0 text-black" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold text-black">{slot.label}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{slot.hint}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    onClick={() => setRateOverrides((prev) => ({ ...prev, [slot.key]: !prev[slot.key] }))}
                    className={`border border-black px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition-transform duration-150 ease-pop active:scale-95 ${
                      active ? "bg-neon text-black" : "bg-paper text-black"
                    }`}
                  >
                    {active ? "Personalizado" : "Precio base"}
                  </button>
                </div>
                {active ? (
                  <div className="mt-3 flex items-center gap-2.5 border border-black bg-paper px-3.5 py-2 focus-within:outline-2 focus-within:outline-black focus-within:outline-offset-2">
                    <span className="font-mono text-xs font-bold text-muted">₡</span>
                    <input
                      type="number"
                      value={rateValues[slot.key]}
                      onChange={(event) => setRateValues((prev) => ({ ...prev, [slot.key]: event.target.value }))}
                      placeholder="15000"
                      aria-label={`Precio por hora en la franja ${slot.label}`}
                      className="w-full bg-transparent font-sans text-sm text-black outline-none"
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 border-t border-black pt-5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" onClick={save} disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
      </div>
    </fieldset>
  );
}

function LabeledSelect({
  id,
  label,
  value,
  onChange,
  icon,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 border border-black bg-paper px-3.5 py-2 focus-within:outline-2 focus-within:outline-black focus-within:outline-offset-2">
      <span className="text-black">{icon}</span>
      <div className="flex-1">
        <label htmlFor={id} className="block font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
          {label}
        </label>
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none bg-transparent font-sans text-sm text-black outline-none"
        >
          {children}
        </select>
      </div>
      <ChevronDown size={14} strokeWidth={2} className="pointer-events-none text-black" aria-hidden />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FloatingInput } from "./auth/floating-input";
import {
  Building2,
  Phone,
  MapPin,
  Map,
} from "lucide-react";

type TenantRequestUser = {
  id: number;
  email: string;
};

export function TenantRequestScreen({ user }: { user?: TenantRequestUser | null }) {
  const [complexName, setComplexName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [courtName, setCourtName] = useState("");
  const [surface, setSurface] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submitRequest() {
  try {
    setLoading(true);
    setMessage("");

    const payload = {
      userId: user?.id ?? 0,
      userEmail: user?.email ?? "",
      complexName,
      phone,
      address,
      mapsUrl,
      courtName,
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

    setMessage(data?.message || "Solicitud enviada correctamente.");
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "No se pudo enviar la solicitud."
    );
  } finally {
    setLoading(false);
  }
}

  return (
  <div className="space-y-6">
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
        Solicitud de Tenant
      </p>

      <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-black">
        Conviértete en dueño de cancha
      </h1>

      <p className="mt-3 max-w-2xl text-sm text-muted">
        Completa la información de tu complejo deportivo. Un administrador
        revisará tu solicitud antes de aprobarla.
      </p>
    </div>

    <Card className="space-y-5 p-6">
      <FloatingInput
        id="complex-name"
        label="Nombre del complejo"
        type="text"
        value={complexName}
        onChange={setComplexName}
        placeholder="Ej. Complejo Deportivo La Sabana"
        icon={<Building2 size={16} />}
      />

      <FloatingInput
        id="phone"
        label="Teléfono"
        type="text"
        value={phone}
        onChange={setPhone}
        placeholder="8888-8888"
        icon={<Phone size={16} />}
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
        />
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
          ¿No tenés un complejo deportivo formal? Poné solo el pueblo al que pertenece.
        </p>
      </div>

      <FloatingInput
        id="maps"
        label="Google Maps"
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
        />

        <FloatingInput
            id="surface"
            label="Superficie"
            type="text"
            value={surface}
            onChange={setSurface}
            placeholder="Sintética"
            icon={<MapPin size={16} />}
        />

        <FloatingInput
            id="capacity"
            label="Capacidad"
            type="text"
            value={capacity}
            onChange={setCapacity}
            placeholder="5 vs 5"
            icon={<Building2 size={16} />}
        />

        <FloatingInput
         id="price"
         label="Precio por hora"
         type="number"
         value={price}
         onChange={setPrice}
         placeholder="12000"
         icon={<Building2 size={16} />}
        /> 


      <div className="flex justify-end">
       <Button
         type="button"
         onClick={submitRequest}
         disabled={loading}
         >
         {loading ? "Enviando..." : "Enviar solicitud"}
        </Button>
        {message && (
         <p className="text-sm font-medium text-green-700">
         {message}
        </p>
)}
      </div>
    </Card>
  </div>
);
}
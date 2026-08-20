"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Row, RowTag } from "@/components/ui/row";
import { fieldClassName } from "./constants";
import { MessageBanner, PanelShell, StatusPill } from "./shared-ui";
import type { AdminCourtRow, AdminUserRow, ApiResponse, AppUser, TenantRequestAdminRow } from "./types";
import { displayName, readJson } from "./utils";

export function AdminPanel({ user }: { user: AppUser }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [courts, setCourts] = useState<AdminCourtRow[]>([]);
  const [tenantRequests, setTenantRequests] = useState<TenantRequestAdminRow[]>([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function loadUsers() {
    const response = await fetch("/api/admin/users");
    const payload = await readJson<ApiResponse<{ users: AdminUserRow[] }>>(response);
    if (!response.ok) {
      throw new Error(payload.error || "No pudimos cargar los usuarios");
    }
    setUsers(payload.users);
  }

  async function loadCourts() {
    const response = await fetch("/api/admin/courts");
    const payload = await readJson<ApiResponse<{ courts: AdminCourtRow[] }>>(response);
    if (!response.ok) {
      throw new Error(payload.error || "No pudimos cargar las canchas");
    }
    setCourts(payload.courts);
  }

  async function loadTenantRequests() {
    const response = await fetch("/api/admin/tenant-requests");
    const payload = await readJson<ApiResponse<{ requests: TenantRequestAdminRow[] }>>(response);
    if (!response.ok) {
      throw new Error(payload.error || "No pudimos cargar las solicitudes");
    }
    setTenantRequests(payload.requests);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void Promise.all([loadUsers(), loadCourts(), loadTenantRequests()]).catch((error) =>
      setMessage(error instanceof Error ? error.message : "No pudimos cargar la información"),
    );
  }, []);

  const roleOptions = useMemo(() => {
    const roles = new Set(users.map((candidate) => candidate.role));
    return Array.from(roles);
  }, [users]);

  const filteredUsers = useMemo(
    () => (roleFilter === "all" ? users : users.filter((candidate) => candidate.role === roleFilter)),
    [users, roleFilter],
  );

  const courtsByTenant = useMemo(() => {
    const groups = new Map<number, { tenantName: string; tenantEmail: string; courts: AdminCourtRow[] }>();
    for (const court of courts) {
      const group = groups.get(court.tenantId);
      if (group) {
        group.courts.push(court);
      } else {
        groups.set(court.tenantId, { tenantName: court.tenantName, tenantEmail: court.tenantEmail, courts: [court] });
      }
    }
    return Array.from(groups.values());
  }, [courts]);

  async function respondToTenant(userId: number, action: "verify" | "suspend") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, adminId: user.id, adminRole: user.role, action }),
      });
      const payload = await readJson<ApiResponse<Record<string, never>>>(response);
      if (!response.ok) {
        throw new Error(payload.error || "No pudimos procesar la acción");
      }
      setMessage(action === "verify" ? "Cuenta verificada." : "Cuenta suspendida.");
      await loadUsers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos procesar la acción");
    } finally {
      setBusy(false);
    }
  }

  async function toggleCourtActive(courtId: number, isActive: boolean) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/courts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courtId, isActive }),
      });
      const payload = await readJson<ApiResponse<Record<string, never>>>(response);
      if (!response.ok) {
        throw new Error(payload.error || "No pudimos actualizar la cancha");
      }
      setMessage(isActive ? "Cancha activada." : "Cancha desactivada.");
      await loadCourts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos actualizar la cancha");
    } finally {
      setBusy(false);
    }
  }

  async function respondToTenantRequest(requestId: number, status: "aprobado" | "rechazado") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/tenant-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          status,
          reviewerName: user.fullName,
          notes: status === "aprobado" ? "Solicitud aprobada por el administrador de plataforma." : "Solicitud rechazada por el administrador de plataforma.",
        }),
      });
      const payload = await readJson<ApiResponse<Record<string, never>>>(response);
      if (!response.ok) {
        throw new Error(payload.error || "No pudimos actualizar la solicitud");
      }
      setMessage(status === "aprobado" ? "Solicitud aprobada." : "Solicitud rechazada.");
      await loadTenantRequests();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos actualizar la solicitud");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {message ? <MessageBanner message={message} /> : null}

      <PanelShell
        title="Usuarios"
        description="Todos los usuarios registrados, de cualquier rol. Las cuentas tenant necesitan verificación antes de operar."
        action={<StatusPill>{filteredUsers.length} usuarios</StatusPill>}
      >
        <div className="relative mb-4 max-w-xs">
          <select className={fieldClassName} value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">Todos los roles</option>
            {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black" aria-hidden />
        </div>
        <ul>
          {filteredUsers.map((candidate) => (
            <Row
              key={candidate.id}
              title={displayName(candidate)}
              meta={`${candidate.email} · ${candidate.roleLabel}`}
              right={
                <div className="flex items-center gap-2">
                  <RowTag tone={candidate.status === "verificado" ? "positive" : candidate.status === "suspendido" ? "negative" : "default"}>
                    {candidate.status}
                  </RowTag>
                  {candidate.role === "tenant" ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={busy || candidate.status === "verificado"}
                        onClick={() => respondToTenant(candidate.id, "verify")}
                      >
                        Verificar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={busy || candidate.status === "suspendido"}
                        onClick={() => respondToTenant(candidate.id, "suspend")}
                      >
                        Suspender
                      </Button>
                    </div>
                  ) : null}
                </div>
              }
            />
          ))}
        </ul>
      </PanelShell>

      <PanelShell
        title="Solicitudes de tenant"
        description="Revisión centralizada de quién quiere convertirse en dueño de cancha y necesita aprobación de plataforma."
        action={<StatusPill>{tenantRequests.length} solicitudes</StatusPill>}
      >
        {tenantRequests.length > 0 ? (
          <div className="space-y-4">
            {tenantRequests.map((request) => (
              <Card key={request.id} className="gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-black leading-tight tracking-tight text-black">{request.complexName}</h3>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted">{request.userEmail}</p>
                  </div>
                  <RowTag tone={request.status === "aprobado" ? "positive" : request.status === "rechazado" ? "negative" : "default"}>
                    {request.status}
                  </RowTag>
                </div>

                <div className="grid gap-2 text-sm text-black md:grid-cols-2">
                  <p><strong>Cancha:</strong> {request.courtName}</p>
                  <p><strong>Teléfono:</strong> {request.phone}</p>
                  <p><strong>Dirección:</strong> {request.address}</p>
                  <p><strong>Superficie:</strong> {request.surface}</p>
                  <p><strong>Capacidad:</strong> {request.capacity}</p>
                  <p><strong>Precio:</strong> {request.price}</p>
                </div>

                {request.mapsUrl ? (
                  <a href={request.mapsUrl} target="_blank" rel="noreferrer" className="inline-block text-sm font-medium text-black underline">
                    Ver ubicación en Maps
                  </a>
                ) : null}

                {request.status === "pendiente" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={busy} onClick={() => respondToTenantRequest(request.id, "aprobado")}>
                      Aprobar
                    </Button>
                    <Button variant="destructive" size="sm" disabled={busy} onClick={() => respondToTenantRequest(request.id, "rechazado")}>
                      Rechazar
                    </Button>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        ) : (
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">No hay solicitudes de tenant pendientes.</p>
        )}
      </PanelShell>

      <PanelShell
        title="Canchas por dueño"
        description="Todas las canchas registradas, agrupadas por el tenant que las administra."
        action={<StatusPill>{courts.length} canchas</StatusPill>}
      >
        {courtsByTenant.length > 0 ? (
          <div className="space-y-4">
            {courtsByTenant.map((group) => (
              <Card key={group.tenantEmail} className="gap-3">
                <div>
                  <h3 className="font-display text-lg font-black leading-tight tracking-tight text-black">{group.tenantName}</h3>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted">{group.tenantEmail}</p>
                </div>
                <ul>
                  {group.courts.map((court) => (
                    <Row
                      key={court.id}
                      title={court.name}
                      meta={`${court.address ?? "Sin dirección"}${court.pricePerHour ? ` · ₡${court.pricePerHour}/h` : ""}`}
                      right={
                        <div className="flex items-center gap-2">
                          <RowTag tone={court.isActive ? "positive" : "negative"}>{court.isActive ? "Activa" : "Inactiva"}</RowTag>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busy}
                            onClick={() => toggleCourtActive(court.id, !court.isActive)}
                          >
                            {court.isActive ? "Desactivar" : "Activar"}
                          </Button>
                        </div>
                      }
                    />
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        ) : (
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">No hay canchas registradas todavía.</p>
        )}
      </PanelShell>
    </div>
  );
}


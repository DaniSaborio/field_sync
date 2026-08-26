"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Row, RowTag } from "@/components/ui/row";
import { cn } from "@/lib/utils";
import { CourtEditModal } from "./court-settings";
import { fieldClassName, fieldLabelClassName, paymentMethodLabels } from "./constants";
import { MessageBanner, PanelShell, StatusPill } from "./shared-ui";
import type { ApiResponse, AppUser, CourtCard, CourtReservation } from "./types";
import { downloadCsv, formatShortDate, readJson } from "./utils";

const reservationStatusTone: Record<CourtReservation["status"], "positive" | "default" | "negative"> = {
  confirmada: "positive",
  pendiente: "default",
  rechazada: "negative",
  cancelada: "negative",
};

function reservationStatusLabel(status: CourtReservation["status"]) {
  switch (status) {
    case "confirmada":
      return "Confirmada";
    case "pendiente":
      return "Pendiente";
    case "rechazada":
      return "Rechazada";
    case "cancelada":
      return "Cancelada";
  }
}

function reservationCsvRow(reservation: CourtReservation) {
  return [
    reservation.date,
    reservation.timeSlot,
    reservation.playerName ?? `Usuario #${reservation.userId}`,
    reservationStatusLabel(reservation.status),
    reservation.paymentMethod ? paymentMethodLabels[reservation.paymentMethod] : "-",
    reservation.paymentStatus ?? "-",
    reservation.amount != null ? String(reservation.amount) : "-",
  ];
}

function StatStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap divide-x divide-black border border-black bg-paper shadow-hard">
      {items.map((item) => (
        <div key={item.label} className="min-w-[104px] flex-1 px-3 py-2.5 text-center">
          <p className="font-mono text-lg font-black tabular-nums text-black">{item.value}</p>
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function LegendSwatch({ tone, label }: { tone: "positive" | "default" | "negative"; label: string }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
      <span
        className={cn(
          "size-2.5 shrink-0 border border-black",
          tone === "positive" && "bg-neon",
          tone === "negative" && "bg-black",
          tone === "default" && "bg-paper",
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}

type DailyRevenuePoint = { date: string; verified: number; pending: number; total: number };

// Barras apiladas: verificado (base, neon) + pendiente (encima, con borde) por día,
// para ver de un vistazo la tendencia de ingresos en el rango seleccionado.
function DailyRevenueChart({ data }: { data: DailyRevenuePoint[] }) {
  if (data.length === 0) {
    return <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Sin ingresos en el rango seleccionado.</p>;
  }

  const max = Math.max(1, ...data.map((point) => point.total));

  return (
    <div>
      <div className="flex h-28 gap-1 border-b border-black">
        {data.map((point) => {
          const verifiedPct = (point.verified / max) * 100;
          const pendingPct = (point.pending / max) * 100;
          return (
            <div
              key={point.date}
              className="flex min-w-[6px] flex-1 flex-col justify-end"
              title={`${formatShortDate(point.date)} · Verificado ₡${point.verified} · Pendiente ₡${point.pending}`}
            >
              {pendingPct > 0 ? <div className="w-full border-x border-t border-black bg-paper" style={{ height: `${pendingPct}%` }} /> : null}
              {verifiedPct > 0 ? <div className="w-full bg-neon" style={{ height: `${verifiedPct}%` }} /> : null}
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-wider text-muted">
        <span>{formatShortDate(data[0].date)}</span>
        {data.length > 1 ? <span>{formatShortDate(data[data.length - 1].date)}</span> : null}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        <LegendSwatch tone="positive" label="Verificado" />
        <LegendSwatch tone="default" label="Pendiente" />
      </div>
    </div>
  );
}

// Barra segmentada con el peso de cada estado sobre el total de reservas del rango.
function StatusBreakdownBar({ confirmed, pending, cancelled }: { confirmed: number; pending: number; cancelled: number }) {
  const total = confirmed + pending + cancelled;

  if (total === 0) {
    return <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Sin reservas en el rango seleccionado.</p>;
  }

  const segments = [
    { key: "confirmed", value: confirmed, tone: "positive" as const, label: "Confirmadas" },
    { key: "pending", value: pending, tone: "default" as const, label: "Pendientes" },
    { key: "cancelled", value: cancelled, tone: "negative" as const, label: "Canceladas/rechazadas" },
  ];

  return (
    <div>
      <div className="flex h-6 w-full gap-[2px] border border-black bg-paper p-[2px]">
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <div
              key={segment.key}
              title={`${segment.label}: ${segment.value} (${Math.round((segment.value / total) * 100)}%)`}
              style={{ width: `${(segment.value / total) * 100}%` }}
              className={cn(
                segment.tone === "positive" && "bg-neon",
                segment.tone === "negative" && "bg-black",
                segment.tone === "default" && "border border-black bg-paper",
              )}
            />
          ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((segment) => (
          <LegendSwatch key={segment.key} tone={segment.tone} label={`${segment.label} · ${segment.value}`} />
        ))}
      </div>
    </div>
  );
}

// Ranking de ingresos (verificado + pendiente) por cancha, de mayor a menor.
function CourtRevenueRanking({ courts }: { courts: { id: number; name: string; total: number }[] }) {
  if (courts.length === 0 || courts.every((court) => court.total === 0)) {
    return <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Sin ingresos en el rango seleccionado.</p>;
  }

  const max = Math.max(1, ...courts.map((court) => court.total));
  const sorted = [...courts].sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-2.5">
      {sorted.map((court) => (
        <div key={court.id} className="flex items-center gap-2">
          <span className="w-20 shrink-0 truncate font-mono text-[10px] uppercase tracking-wider text-muted" title={court.name}>
            {court.name}
          </span>
          <div className="h-3 flex-1 border border-black bg-paper">
            <div className="h-full bg-black" style={{ width: `${(court.total / max) * 100}%` }} />
          </div>
          <span className="w-16 shrink-0 text-right font-mono text-xs font-black tabular-nums text-black">₡{court.total}</span>
        </div>
      ))}
    </div>
  );
}

export function TenantCourtsPanel({ user, onRequestMoreCourts }: { user: AppUser; onRequestMoreCourts: () => void }) {
  const [courts, setCourts] = useState<CourtCard[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editingCourt, setEditingCourt] = useState<CourtCard | null>(null);

  async function loadCourts() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/courts?manage=true&tenantId=${user.id}`);
      const payload = await readJson<ApiResponse<{ courts: CourtCard[] }>>(response);
      if (!response.ok) {
        throw new Error(payload.error || "No pudimos cargar el reporte de canchas");
      }
      setCourts(payload.courts ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos cargar el reporte de canchas");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCourts();
  }, [user.id]);

  const myCourts = useMemo(() => courts.filter((court) => court.tenantId === user.id), [courts, user.id]);

  const courtReports = useMemo(
    () =>
      myCourts.map((court) => {
        const reservations = court.reservations
          .filter((reservation) => (!fromDate || reservation.date >= fromDate) && (!toDate || reservation.date <= toDate))
          .sort((a, b) => `${b.date}${b.timeSlot}`.localeCompare(`${a.date}${a.timeSlot}`));
        const confirmedCount = reservations.filter((r) => r.status === "confirmada").length;
        const pendingCount = reservations.filter((r) => r.status === "pendiente").length;
        const rejectedCount = reservations.filter((r) => r.status === "rechazada").length;
        const cancelledCount = reservations.filter((r) => r.status === "cancelada").length;
        const revenueVerified = reservations
          .filter((r) => r.status === "confirmada")
          .reduce((sum, r) => sum + (r.amount ?? 0), 0);
        const revenuePending = reservations
          .filter((r) => r.status === "pendiente")
          .reduce((sum, r) => sum + (r.amount ?? 0), 0);

        return { court, reservations, confirmedCount, pendingCount, rejectedCount, cancelledCount, revenueVerified, revenuePending };
      }),
    [myCourts, fromDate, toDate],
  );

  const totals = useMemo(
    () =>
      courtReports.reduce(
        (acc, report) => ({
          reservations: acc.reservations + report.reservations.length,
          confirmed: acc.confirmed + report.confirmedCount,
          pending: acc.pending + report.pendingCount,
          cancelled: acc.cancelled + report.cancelledCount + report.rejectedCount,
          revenueVerified: acc.revenueVerified + report.revenueVerified,
          revenuePending: acc.revenuePending + report.revenuePending,
        }),
        { reservations: 0, confirmed: 0, pending: 0, cancelled: 0, revenueVerified: 0, revenuePending: 0 },
      ),
    [courtReports],
  );

  const dailySeries = useMemo<DailyRevenuePoint[]>(() => {
    const byDate = new Map<string, { verified: number; pending: number }>();
    for (const report of courtReports) {
      for (const reservation of report.reservations) {
        if (reservation.status !== "confirmada" && reservation.status !== "pendiente") continue;
        const entry = byDate.get(reservation.date) ?? { verified: 0, pending: 0 };
        if (reservation.status === "confirmada") entry.verified += reservation.amount ?? 0;
        else entry.pending += reservation.amount ?? 0;
        byDate.set(reservation.date, entry);
      }
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-21)
      .map(([date, value]) => ({ date, ...value, total: value.verified + value.pending }));
  }, [courtReports]);

  const courtRevenueData = useMemo(
    () => courtReports.map((report) => ({ id: report.court.id, name: report.court.name, total: report.revenueVerified + report.revenuePending })),
    [courtReports],
  );

  function exportCourtCsv(report: (typeof courtReports)[number]) {
    downloadCsv(`reporte-${report.court.name.toLowerCase().replace(/\s+/g, "-")}.csv`, [
      ["Fecha", "Hora", "Jugador", "Estado", "Método de pago", "Estado del pago", "Monto"],
      ...report.reservations.map(reservationCsvRow),
    ]);
  }

  function exportAllCsv() {
    downloadCsv("reporte-canchas.csv", [
      ["Cancha", "Fecha", "Hora", "Jugador", "Estado", "Método de pago", "Estado del pago", "Monto"],
      ...courtReports.flatMap((report) => report.reservations.map((r) => [report.court.name, ...reservationCsvRow(r)])),
    ]);
  }

  // Un administrador de plataforma suspendió esta cuenta (HU-11): se bloquea
  // la gestión de canchas hasta que se reactive. La notificación del aviso ya
  // se crea del lado del servidor cuando se aplica la suspensión.
  if (user.status === "suspendido") {
    return (
      <PanelShell title="Mis canchas" description="Gestión de canchas bloqueada.">
        <MessageBanner message="No es posible gestionar tus canchas: un administrador de plataforma suspendió tu cuenta. Revisá tus notificaciones para más detalles." />
      </PanelShell>
    );
  }

  return (
    <>
    <PanelShell
      title="Mis canchas"
      description="Reporte de reservas e ingresos por cancha."
      action={
        <div className="flex items-center gap-3">
          <StatusPill>{myCourts.length} canchas</StatusPill>
          <Button type="button" size="sm" onClick={onRequestMoreCourts}>
            Solicitar más canchas
          </Button>
        </div>
      }
    >
      {message ? <MessageBanner message={message} /> : null}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="block space-y-1.5">
          <span className={fieldLabelClassName}>Desde</span>
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className={`${fieldClassName} h-9`} />
        </label>
        <label className="block space-y-1.5">
          <span className={fieldLabelClassName}>Hasta</span>
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className={`${fieldClassName} h-9`} />
        </label>
        <Button type="button" size="sm" variant="secondary" disabled={busy || totals.reservations === 0} onClick={exportAllCsv}>
          <Download size={14} strokeWidth={2} aria-hidden />
          Descargar todo (CSV)
        </Button>
      </div>

      <StatStrip
        items={[
          { label: "Reservas", value: String(totals.reservations) },
          { label: "Confirmadas", value: String(totals.confirmed) },
          { label: "Pendientes", value: String(totals.pending) },
          { label: "Canceladas", value: String(totals.cancelled) },
          { label: "Verificado", value: `₡${totals.revenueVerified}` },
          { label: "Por confirmar", value: `₡${totals.revenuePending}` },
        ]}
      />

      <div className="mt-4 mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Ingresos por día</p>
          <div className="mt-3">
            <DailyRevenueChart data={dailySeries} />
          </div>
        </Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Reservas por estado</p>
          <div className="mt-3">
            <StatusBreakdownBar confirmed={totals.confirmed} pending={totals.pending} cancelled={totals.cancelled} />
          </div>
        </Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Ingresos por cancha</p>
          <div className="mt-3">
            <CourtRevenueRanking courts={courtRevenueData} />
          </div>
        </Card>
      </div>

      {courtReports.length > 0 ? (
        <div className="space-y-3">
          {courtReports.map((report) => (
            <Card key={report.court.id} className="gap-3 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-black leading-tight tracking-tight text-black">{report.court.name}</h3>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                    {report.court.location}
                    {report.court.pricePerHour ? ` · ₡${report.court.pricePerHour}/h` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => setEditingCourt(report.court)}>
                    <Pencil size={14} strokeWidth={2} aria-hidden />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={report.reservations.length === 0}
                    onClick={() => exportCourtCsv(report)}
                  >
                    <Download size={14} strokeWidth={2} aria-hidden />
                    CSV
                  </Button>
                </div>
              </div>

              <CollapsibleSection
                label={`${report.reservations.length} reservas`}
                summary={`${report.confirmedCount} confirmadas · ₡${report.revenueVerified} verificado`}
              >
                <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                  <div>
                    <p className="font-mono text-xl font-black tabular-nums text-black">{report.confirmedCount}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Confirmadas</p>
                  </div>
                  <div>
                    <p className="font-mono text-xl font-black tabular-nums text-black">{report.pendingCount}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Pendientes</p>
                  </div>
                  <div>
                    <p className="font-mono text-xl font-black tabular-nums text-black">{report.rejectedCount}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Rechazadas</p>
                  </div>
                  <div>
                    <p className="font-mono text-xl font-black tabular-nums text-black">{report.cancelledCount}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Canceladas</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="font-mono text-xl font-black tabular-nums text-black">₡{report.revenueVerified}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Verificado</p>
                  </div>
                  <div>
                    <p className="font-mono text-xl font-black tabular-nums text-black">₡{report.revenuePending}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Por confirmar</p>
                  </div>
                </div>

                {report.reservations.length > 0 ? (
                  <ul>
                    {report.reservations.map((reservation) => (
                      <Row
                        key={reservation.id}
                        title={reservation.playerName ?? `Usuario #${reservation.userId}`}
                        meta={`${reservation.date} · ${reservation.timeSlot}${
                          reservation.paymentMethod ? ` · ${paymentMethodLabels[reservation.paymentMethod]}` : ""
                        }${reservation.amount ? ` · ₡${reservation.amount}` : ""}`}
                        right={<RowTag tone={reservationStatusTone[reservation.status]}>{reservationStatusLabel(reservation.status)}</RowTag>}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted">No hay reservas en el rango seleccionado.</p>
                )}
              </CollapsibleSection>
            </Card>
          ))}
        </div>
      ) : (
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Todavía no tenés canchas registradas.</p>
      )}
    </PanelShell>
    <CourtEditModal
      court={editingCourt}
      tenantId={user.id}
      open={editingCourt !== null}
      onClose={() => setEditingCourt(null)}
      onSaved={(savedMessage) => {
        setEditingCourt(null);
        setMessage(savedMessage);
        void loadCourts();
      }}
    />
    </>
  );
}


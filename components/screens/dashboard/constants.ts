import type { PaymentMethod } from "./types";

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  sinpe: "SINPE Móvil",
  efectivo: "Efectivo",
  mixto: "SINPE + Efectivo",
};

export const fieldClassName =
  "h-11 w-full appearance-none border border-black bg-paper px-3 text-sm font-medium text-black outline-none focus:outline-2 focus:outline-black focus:outline-offset-2";

export const fieldLabelClassName =
  "flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted";

export const timeSlotFilterLabels: Record<string, string> = {
  all: "Todo el día",
  morning: "Mañana",
  afternoon: "Tarde",
  night: "Noche",
};

export const surfaceFilterLabels: Record<string, string> = {
  all: "Todas",
  synthetic: "Sintética",
  natural: "Natural",
  indoor: "Indoor",
};

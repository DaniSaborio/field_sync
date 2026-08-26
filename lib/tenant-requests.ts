export type TenantRequestStatus = "pendiente" | "aprobado" | "rechazado";

export type TenantRequestRecord = {
  id: number;
  userId: number;
  userEmail: string;
  complexName: string;
  phone: string;
  address: string;
  mapsUrl: string;
  courtName: string;
  surface: string;
  capacity: string;
  price: string;
  hasLights: boolean;
  status: TenantRequestStatus;
  reviewerName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const requests: TenantRequestRecord[] = [];

let nextId = 1;

export function submitTenantRequest(input: {
  userId: number;
  userEmail: string;
  complexName: string;
  phone: string;
  address: string;
  mapsUrl: string;
  courtName: string;
  surface: string;
  capacity: string;
  price: string;
  hasLights: boolean;
}) {
  const trimmed = {
    userId: Number(input.userId),
    userEmail: String(input.userEmail ?? "").trim(),
    complexName: String(input.complexName ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    address: String(input.address ?? "").trim(),
    mapsUrl: String(input.mapsUrl ?? "").trim(),
    courtName: String(input.courtName ?? "").trim(),
    surface: String(input.surface ?? "").trim(),
    capacity: String(input.capacity ?? "").trim(),
    price: String(input.price ?? "").trim(),
    hasLights: Boolean(input.hasLights),
  };

  if (!trimmed.userId || !trimmed.userEmail || !trimmed.complexName || !trimmed.phone || !trimmed.address || !trimmed.courtName) {
    return { ok: false as const, error: "Faltan datos obligatorios para la solicitud." };
  }

  const now = new Date().toISOString();
  const request: TenantRequestRecord = {
    id: nextId++,
    ...trimmed,
    status: "pendiente",
    reviewerName: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };

  requests.unshift(request);

  return { ok: true as const, request };
}

export function listTenantRequests() {
  return [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function updateTenantRequestStatus(input: {
  requestId: number;
  status: TenantRequestStatus;
  reviewerName?: string | null;
  notes?: string | null;
}) {
  const request = requests.find((item) => item.id === Number(input.requestId));

  if (!request) {
    return { ok: false as const, error: "No encontramos la solicitud." };
  }

  if (input.status !== "aprobado" && input.status !== "rechazado") {
    return { ok: false as const, error: "Estado no válido." };
  }

  request.status = input.status;
  request.reviewerName = input.reviewerName?.trim() || null;
  request.notes = input.notes?.trim() || null;
  request.updatedAt = new Date().toISOString();

  return { ok: true as const, request };
}

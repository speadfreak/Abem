import { db } from "@/lib/db";

/* Live snapshot consumed by /api/live/stream (SSE) and /api/live/snapshot.
   Boards (kitchen, staff, rider, admin) all read from this shape. */

export interface LiveOrderItem {
  id: string;
  name: string;
  nameAm?: string;
  price: number;
  qty: number;
  notes?: string;
  image?: string;
  tags?: string[];
  station?: string;
}

export interface LiveOrder {
  id: string;
  code: string;
  type: string;
  tableLabel?: string;
  tableToken?: string;
  customerName: string;
  phone: string;
  address?: string;
  landmark?: string;
  zoneName?: string;
  total: number;
  status: string;
  station?: string;
  notes?: string;
  otp?: string;
  riderId?: string;
  riderName?: string;
  items: LiveOrderItem[];
  statusLog: { status: string; at: string; by?: string }[];
  createdAt: string;
  updatedAt: string;
  prepMinutes: number;
}

export interface LiveRequest {
  id: string;
  tableToken: string;
  tableLabel: string;
  type: string;
  status: string;
  createdAt: string;
}

export async function buildLiveSnapshot(): Promise<{
  orders: LiveOrder[];
  requests: LiveRequest[];
  ts: string;
}> {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 6); // rolling 6h window
  const [orders, requests] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: since }, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    db.serviceRequest.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" }, take: 40 }),
  ]);

  return {
    orders: orders.map((o) => ({
      id: o.id,
      code: o.code,
      type: o.type,
      tableLabel: o.tableLabel ?? undefined,
      tableToken: o.tableToken ?? undefined,
      customerName: o.customerName,
      phone: o.phone,
      address: o.address ?? undefined,
      landmark: o.landmark ?? undefined,
      zoneName: o.zoneName ?? undefined,
      total: o.total,
      status: o.status,
      station: o.station ?? undefined,
      notes: o.notes ?? undefined,
      otp: o.otp ?? undefined,
      riderId: o.riderId ?? undefined,
      riderName: o.riderName ?? undefined,
      items: ((o.items as unknown) as LiveOrderItem[]) ?? [],
      statusLog: ((o.statusLog as unknown) as { status: string; at: string; by?: string }[]) ?? [],
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      prepMinutes: Math.max(0, Math.floor((Date.now() - o.createdAt.getTime()) / 60000)),
    })),
    requests: requests.map((r) => ({
      id: r.id,
      tableToken: r.tableToken,
      tableLabel: r.tableLabel,
      type: r.type,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
    ts: new Date().toISOString(),
  };
}

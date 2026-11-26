/* Shared client-side types for the Abem Flow ordering UI. */

export interface ApiDish {
  id: string;
  slug: string;
  name: string;
  nameAm?: string | null;
  description?: string | null;
  descriptionAm?: string | null;
  price: number;
  image?: string | null;
  tags?: string[];
  spicyLevel?: number;
  isVegan?: boolean;
  isFasting?: boolean;
  isChefPick?: boolean;
  isFeatured?: boolean;
  categoryId?: string;
}

export interface ApiCategory {
  id: string;
  slug: string;
  name: string;
  nameAm?: string | null;
  description?: string | null;
  station?: string;
  items: ApiDish[];
}

export interface ApiZone {
  id: string;
  name: string;
  fee: number;
  minOrder: number;
  etaMin: number;
  etaMax: number;
}

export interface OrderSuccessData {
  code: string;
  total: number;
  eta: string;
  otp: string | null;
  pointsEarned: number;
  type: "DINEIN" | "TAKEAWAY" | "DELIVERY";
  riderName?: string | null;
}

export interface TrackedOrder {
  code: string;
  type: string;
  status: string;
  customerName: string;
  items: { id: string; name: string; nameAm?: string; price: number; qty: number; image?: string }[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  zoneName?: string;
  address?: string;
  landmark?: string;
  riderName?: string;
  otp?: string;
  statusLog: { status: string; at: string }[];
  createdAt: string;
  pointsEarned: number;
}

export type OrderMode = "DELIVERY" | "TAKEAWAY" | "DINEIN";

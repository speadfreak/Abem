import type { SiteSettings } from "@/lib/settings";

export type AdminRole = "OWNER" | "MANAGER" | "STAFF";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

/* ── Orders ── */

export interface OrderItemRow {
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

export interface StatusLogEntry {
  status: string;
  at: string;
  by?: string;
}

export interface AdminOrder {
  id: string;
  code: string;
  type: string;
  tableLabel?: string | null;
  customerName: string;
  phone: string;
  address?: string | null;
  landmark?: string | null;
  zoneName?: string | null;
  deliveryFee: number;
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  otp?: string | null;
  riderId?: string | null;
  riderName?: string | null;
  notes?: string | null;
  items: OrderItemRow[];
  statusLog: StatusLogEntry[];
  createdAt: string;
  updatedAt: string;
}

/* ── Reservations ── */

export interface AdminReservation {
  id: string;
  code: string;
  name: string;
  email?: string | null;
  phone: string;
  date: string;
  time: string;
  party: number;
  area: string;
  occasion?: string | null;
  notes?: string | null;
  status: string;
  adminNote?: string | null;
  createdAt: string;
}

/* ── Menu ── */

export interface AdminMenuItem {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  nameAm?: string | null;
  description?: string | null;
  descriptionAm?: string | null;
  price: number;
  image?: string | null;
  tags: string[];
  spicyLevel: number;
  isVegan: boolean;
  isFasting: boolean;
  isChefPick: boolean;
  isFeatured: boolean;
  available: boolean;
  order: number;
}

export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  nameAm?: string | null;
  description?: string | null;
  descriptionAm?: string | null;
  station: string;
  image?: string | null;
  order: number;
  active: boolean;
  items: AdminMenuItem[];
}

/* ── Content ── */

export interface AdminTeamMember {
  id: string;
  name: string;
  nameAm?: string | null;
  role: string;
  bio?: string | null;
  photo?: string | null;
  order: number;
  active: boolean;
}

export interface AdminTestimonial {
  id: string;
  name: string;
  role?: string | null;
  quote: string;
  rating: number;
  photo?: string | null;
  active: boolean;
  order: number;
}

export interface AdminFaq {
  id: string;
  question: string;
  answer: string;
  order: number;
  active: boolean;
}

export interface AdminEventPackage {
  id: string;
  slug: string;
  title: string;
  titleAm?: string | null;
  description: string;
  capacity: string;
  priceFrom?: number | null;
  image?: string | null;
  features: string[];
  order: number;
  active: boolean;
}

export interface AdminStory {
  id: string;
  slug: string;
  title: string;
  titleAm?: string | null;
  excerpt: string;
  content: string;
  cover?: string | null;
  category: string;
  tags: string[];
  author: string;
  readMinutes: number;
  published: boolean;
  publishedAt?: string | null;
  createdAt: string;
}

export interface AdminOpening {
  id: string;
  title: string;
  type: string;
  location: string;
  description: string;
  active: boolean;
  order: number;
}

export interface AdminGalleryItem {
  id: string;
  title: string;
  titleAm?: string | null;
  category: string;
  type: string;
  url: string;
  thumb?: string | null;
  order: number;
  active: boolean;
}

/* ── Messages ── */

export interface AdminMessage {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AdminSubscriber {
  id: string;
  email: string;
  createdAt: string;
}

export interface AdminApplication {
  id: string;
  openingId?: string | null;
  opening?: string | null;
  name: string;
  email: string;
  phone: string;
  cover?: string | null;
  createdAt: string;
}

/* ── Settings / ops ── */

export interface AdminBranch {
  id: string;
  name: string;
  address: string;
  addressAm?: string | null;
  phone: string;
  mapEmbedUrl: string;
  directionsUrl: string;
  isPrimary: boolean;
  active: boolean;
  order: number;
}

export interface AdminCoupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxUses?: number | null;
  usedCount: number;
  active: boolean;
  expiresAt?: string | null;
}

export interface AdminZone {
  id: string;
  name: string;
  fee: number;
  minOrder: number;
  etaMin: number;
  etaMax: number;
  active: boolean;
  order: number;
}

export interface AdminTable {
  id: string;
  label: string;
  seats: number;
  zone: string;
  qrToken: string;
  active: boolean;
}

export interface AdminRider {
  id: string;
  name: string;
  phone: string;
  status: string;
  active: boolean;
}

export interface AdminLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: unknown;
  createdAt: string;
}

/* ── API payloads ── */

export interface DashboardStats {
  ok: true;
  todayOrders: number;
  revenueToday: number;
  weekSeries: { date: string; orders: number; revenue: number }[];
  topDishes: { name: string; qty: number }[];
  peakHours: { hour: number; count: number }[];
  avgPrepMinutes: number | null;
  pendingReservations: number;
  unreadMessages: number;
  newsletterCount: number;
  occupiedTables: number;
  loyaltyMembers: number;
  recentOrders: AdminOrder[];
  recentReservations: AdminReservation[];
}

export interface SettingsPayload {
  ok: true;
  settings: SiteSettings;
  branches: AdminBranch[];
  coupons: AdminCoupon[];
  zones: AdminZone[];
  tables: AdminTable[];
}

export interface ContentPayload {
  ok: true;
  team: AdminTeamMember[];
  testimonials: AdminTestimonial[];
  faqs: AdminFaq[];
  eventPackages: AdminEventPackage[];
  stories: AdminStory[];
  openings: AdminOpening[];
  gallery: AdminGalleryItem[];
}

export interface MessagesPayload {
  ok: true;
  messages: AdminMessage[];
  subscribers: AdminSubscriber[];
  applications: AdminApplication[];
}

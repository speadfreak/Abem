import { z } from "zod";

export const reservationSchema = z.object({
  name: z.string().min(2, "Please tell us your name").max(80),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phone: z.string().min(7, "Valid phone required").max(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  party: z.coerce.number().int().min(1).max(40),
  area: z.enum(["indoor", "garden", "vip"]),
  occasion: z.string().max(60).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  company: z.string().max(0).optional().or(z.undefined()), // honeypot
});
export type ReservationInput = z.infer<typeof reservationSchema>;

export const contactSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().max(20).optional().or(z.literal("")),
  subject: z.string().min(2).max(120),
  message: z.string().min(10, "Tell us a little more").max(2000),
  company: z.string().max(0).optional().or(z.undefined()), // honeypot
});
export type ContactInput = z.infer<typeof contactSchema>;

export const newsletterSchema = z.object({
  email: z.string().email(),
});

export const orderItemSchema = z.object({
  id: z.string().min(1),
  qty: z.number().int().min(1).max(20),
  notes: z.string().max(200).optional().or(z.literal("")),
});

export const orderSchema = z.object({
  type: z.enum(["DINEIN", "TAKEAWAY", "DELIVERY"]),
  tableToken: z.string().optional().or(z.literal("")),
  customerName: z.string().min(2).max(80),
  phone: z.string().min(7).max(20),
  address: z.string().max(300).optional().or(z.literal("")),
  landmark: z.string().max(120).optional().or(z.literal("")),
  zoneId: z.string().optional().or(z.literal("")),
  couponCode: z.string().max(24).optional().or(z.literal("")),
  paymentMethod: z.enum(["COD", "TELEBIRR", "CBE_BIRR", "CHAPA", "SANTIMPAY"]).default("COD"),
  scheduledFor: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  loyaltyPhone: z.string().max(20).optional().or(z.literal("")),
  items: z.array(orderItemSchema).min(1, "Add at least one dish").max(40),
});
export type OrderInput = z.infer<typeof orderSchema>;

export const rewardsJoinSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(20),
  birthday: z.string().regex(/^\d{2}-\d{2}$/).optional().or(z.literal("")),
  referral: z.string().max(24).optional().or(z.literal("")),
});

export const careerSchema = z.object({
  openingId: z.string().optional().or(z.literal("")),
  opening: z.string().max(120).optional().or(z.literal("")),
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  cover: z.string().max(1500).optional().or(z.literal("")),
});

export const serviceRequestSchema = z.object({
  tableToken: z.string().min(4),
  type: z.enum(["WAITER", "BILL", "WATER"]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const couponValidateSchema = z.object({
  code: z.string().min(2).max(24),
  subtotal: z.number().min(0),
});

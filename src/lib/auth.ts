import "server-only";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE = "abem_session";
const secret = () =>
  new TextEncoder().encode(process.env.SESSION_SECRET || "abem-dev-secret-change-in-production");

export type Role = "OWNER" | "MANAGER" | "STAFF";
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 11);
}
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload?.id || !payload?.email) return null;
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name ?? "Team"),
      role: (payload.role as Role) ?? "STAFF",
    };
  } catch {
    return null;
  }
}

/** Server components / route handlers: read current session (may be null). */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Route-handler guard. Returns the user or null (respond 401/403 upstream). */
export async function requireAdmin(roles?: Role[]): Promise<SessionUser | null> {
  const user = await getSession();
  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;
  // ensure the account still exists + is active
  const row = await db.adminUser.findUnique({ where: { id: user.id } });
  if (!row || !row.active) return null;
  return user;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Token payload verify for edge middleware (jose works on edge). */
export async function verifyEdgeToken(token: string): Promise<SessionUser | null> {
  return verifySessionToken(token);
}

export const SESSION_COOKIE_NAME = COOKIE;

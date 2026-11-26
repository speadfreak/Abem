/* Pure Json-parsing helpers shared by server routes and client components.
   No "use client" directive so route handlers can import these safely. */

/** Read an unknown Json column as an array. */
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Read an unknown Json column as a string[] (tags, features...). */
export function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
}

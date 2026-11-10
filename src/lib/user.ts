import type { UserRole } from "@/lib/types";

/** The API has no names, only email: use the part before the `@`. */
export function displayName(email: string): string {
  const local = email.split("@")[0] ?? email;
  const words = local.split(/[._-]+/).filter(Boolean);
  if (words.length === 0) return local;
  return words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export function firstName(email: string): string {
  return displayName(email).split(" ")[0];
}

export function initials(email: string): string {
  const words = displayName(email).split(" ");
  const letters = words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return letters.toUpperCase();
}

export function roleHome(role: UserRole): string {
  return role === "employer" ? "/employer" : "/candidate";
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

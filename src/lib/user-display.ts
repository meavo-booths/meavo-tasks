export function userInitials(name: string | null | undefined, email: string | null | undefined) {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function userLabel(name: string | null | undefined, email: string | null | undefined) {
  return name?.trim() || email || "Unknown";
}

export function userShortLabel(name: string | null | undefined, email: string | null | undefined) {
  const label = userLabel(name, email);
  return label.split(" ")[0] ?? label;
}

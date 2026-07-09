import { userInitials } from "@/lib/user-display";

const PALETTES = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
] as const;

function paletteForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i)) % PALETTES.length;
  }
  return PALETTES[hash];
}

export function UserAvatar({
  userId,
  name,
  email,
  size = "sm",
  className = "",
}: {
  userId: string;
  name?: string | null;
  email?: string | null;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const sizes = {
    xs: "h-5 w-5 text-[9px]",
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
  };

  return (
    <span
      title={name ?? email ?? undefined}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white ${paletteForId(userId)} ${sizes[size]} ${className}`}
    >
      {userInitials(name, email)}
    </span>
  );
}

export function AvatarStack({
  users,
  max = 3,
  size = "sm",
}: {
  users: { userId: string; name?: string | null; email?: string | null }[];
  max?: number;
  size?: "xs" | "sm" | "md";
}) {
  if (users.length === 0) return null;
  const visible = users.slice(0, max);
  const extra = users.length - visible.length;

  return (
    <div className="flex -space-x-1.5">
      {visible.map((user) => (
        <UserAvatar
          key={user.userId}
          userId={user.userId}
          name={user.name}
          email={user.email}
          size={size}
        />
      ))}
      {extra > 0 && (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-600 ring-2 ring-white">
          +{extra}
        </span>
      )}
    </div>
  );
}

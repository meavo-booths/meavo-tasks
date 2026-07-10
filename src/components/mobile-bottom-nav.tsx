"use client";

import { IconCalendar, IconUser, IconUsers } from "@/components/icons";
import { MobilePortal } from "@/components/mobile-portal";

export type MobileTab = "today" | "personal" | "shared";

const TABS: { id: MobileTab; label: string; icon: typeof IconCalendar }[] = [
  { id: "today", label: "Today", icon: IconCalendar },
  { id: "personal", label: "Personal", icon: IconUser },
  { id: "shared", label: "Shared", icon: IconUsers },
];

export function MobileBottomNav({
  active,
  onChange,
  todayCount,
}: {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
  todayCount: number;
}) {
  return (
    <MobilePortal>
      <nav className="mobile-tab-bar" aria-label="Dashboard sections">
        {TABS.map(({ id, label, icon: TabIcon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? "page" : undefined}
              className={`mobile-tab-bar__item ${isActive ? "mobile-tab-bar__item--active" : ""}`}
            >
              <span className="relative">
                <TabIcon size={20} />
                {id === "today" && todayCount > 0 && !isActive && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                    {todayCount > 9 ? "9+" : todayCount}
                  </span>
                )}
              </span>
              <span className="mobile-tab-bar__label">{label}</span>
            </button>
          );
        })}
      </nav>
    </MobilePortal>
  );
}

export function MobileFab({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <MobilePortal>
      <button type="button" onClick={onClick} className="mobile-fab" aria-label={label}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </MobilePortal>
  );
}

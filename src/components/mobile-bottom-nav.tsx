"use client";

import { IconBoard, IconCalendar, IconInbox } from "@/components/icons";

export type MobileTab = "today" | "inbox" | "shared";

const TABS: { id: MobileTab; label: string; icon: typeof IconCalendar }[] = [
  { id: "today", label: "Today", icon: IconCalendar },
  { id: "inbox", label: "Inbox", icon: IconInbox },
  { id: "shared", label: "Shared", icon: IconBoard },
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
    <nav
      className="mobile-tab-bar"
      aria-label="Dashboard sections"
    >
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
  );
}

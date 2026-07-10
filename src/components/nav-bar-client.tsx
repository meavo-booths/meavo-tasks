"use client";

import {
  MeavoNavBar,
  type NavLink,
  type NotificationsState,
  type ToolSwitcherState,
} from "@meavo/navigation";

export function NavBarClient({
  links,
  logoHref,
  toolSwitcher,
  userName,
  userEmail,
  userImage,
  signOutAction,
  notifications,
}: {
  links: NavLink[];
  logoHref: string;
  toolSwitcher: ToolSwitcherState;
  userName: string | null | undefined;
  userEmail: string | null | undefined;
  userImage?: string | null;
  signOutAction: () => void | Promise<void>;
  notifications?: NotificationsState;
}) {
  return (
    <MeavoNavBar
      links={links}
      logoHref={logoHref}
      toolSwitcher={toolSwitcher}
      userName={userName}
      userEmail={userEmail}
      userImage={userImage}
      signOutAction={signOutAction}
      notifications={notifications}
      isActiveLink={(pathname, href) =>
        href === "/"
          ? pathname === "/"
          : pathname === href || pathname.startsWith(`${href}/`)
      }
    />
  );
}

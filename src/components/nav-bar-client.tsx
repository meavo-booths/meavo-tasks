"use client";

import { MeavoNavBar, type NavLink, type ToolSwitcherState } from "@meavo/navigation";

export function NavBarClient({
  links,
  logoHref,
  toolSwitcher,
  userName,
  userEmail,
  userImage,
  signOutAction,
}: {
  links: NavLink[];
  logoHref: string;
  toolSwitcher: ToolSwitcherState;
  userName: string | null | undefined;
  userEmail: string | null | undefined;
  userImage?: string | null;
  signOutAction: () => void | Promise<void>;
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
      isActiveLink={(pathname, href) =>
        href === "/"
          ? pathname === "/"
          : pathname === href || pathname.startsWith(`${href}/`)
      }
    />
  );
}

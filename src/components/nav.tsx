import { MeavoNavBar } from "@meavo/navigation";
import {
  getAccessibleTools,
  isMeavoAppKey,
  resolveCurrentToolId,
} from "@meavo/navigation/server";
import { signOutAction } from "@/app/actions/auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MEAVO_APP_KEY = isMeavoAppKey(process.env.MEAVO_APP_KEY)
  ? process.env.MEAVO_APP_KEY
  : "tasks";
const GATEWAY_URL = process.env.GATEWAY_URL ?? "https://meavo.app";

const links = [
  { href: "/", label: "My Inbox" },
  { href: "/boards", label: "Boards" },
];

export async function Nav() {
  const session = await auth();
  if (!session?.user) return null;

  const isAdmin = session.user.systemRole === "ADMIN";

  const toolOptions = await getAccessibleTools(prisma, {
    userId: session.user.id,
    isAdmin,
    gatewayUrl: GATEWAY_URL,
  });

  return (
    <MeavoNavBar
      links={links}
      logoHref={GATEWAY_URL}
      toolSwitcher={{
        currentId: resolveCurrentToolId(toolOptions, MEAVO_APP_KEY),
        options: toolOptions,
      }}
      userName={session.user.name}
      userEmail={session.user.email}
      userImage={session.user.image}
      signOutAction={signOutAction}
    />
  );
}

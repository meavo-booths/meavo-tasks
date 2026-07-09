import { redirect } from "next/navigation";
import { getTasksUser, TASKS_ACCESS_REVOKED_MESSAGE } from "@/lib/access";
import { Nav } from "@/components/nav";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const access = await getTasksUser();
  if (!access.ok) {
    if (access.error === TASKS_ACCESS_REVOKED_MESSAGE) {
      redirect("/login?error=NoAccess");
    }
    redirect("/login");
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-8">{children}</main>
    </>
  );
}

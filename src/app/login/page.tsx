import Image from "next/image";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LOGIN_ERROR_MESSAGES, isGoogleAuthEnabled } from "@/lib/google-auth";
import { LoginForm } from "@/components/login-form";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  const { error, callbackUrl } = await searchParams;
  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/";

  if (session?.user) redirect(safeCallback);

  const authError = error ? (LOGIN_ERROR_MESSAGES[error] ?? LOGIN_ERROR_MESSAGES.AccessDenied) : null;

  return (
    <div className="w-full">
      <Card className="mx-auto w-full max-w-md text-center">
        <div className="flex flex-col items-center">
          <Image
            src="/meavo-logo.png"
            alt="Meavo"
            width={96}
            height={48}
            className="h-12 w-auto object-contain"
            priority
          />
          <p className="mt-3 text-lg font-semibold text-slate-900">Tasks</p>
        </div>
        <p className="mt-4 text-slate-600">
          Sign in to manage your tasks and team boards.
        </p>
        <LoginForm
          googleEnabled={isGoogleAuthEnabled()}
          authError={authError}
          callbackUrl={safeCallback}
        />
      </Card>
    </div>
  );
}

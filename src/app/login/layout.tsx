export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen min-h-[100dvh] max-w-6xl items-center px-4 py-6 sm:px-6 sm:py-8" style={{ paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
      {children}
    </main>
  );
}

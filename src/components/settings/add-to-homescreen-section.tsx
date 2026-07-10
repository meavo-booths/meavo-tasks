import { Card } from "@/components/ui";

export function AddToHomescreenSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Install Tasks on your phone so it opens full-screen like a native app — no browser chrome,
        quick access from your home screen.
      </p>

      <Card className="bg-slate-50/60">
        <h3 className="text-sm font-semibold text-slate-900">iPhone (Safari)</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
          <li>Open <strong>tasks.meavo.app</strong> in Safari and sign in.</li>
          <li>Tap the <strong>Share</strong> button (square with arrow pointing up).</li>
          <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
          <li>Name it <strong>Tasks</strong>, then tap <strong>Add</strong>.</li>
        </ol>
      </Card>

      <Card className="bg-slate-50/60">
        <h3 className="text-sm font-semibold text-slate-900">Android (Chrome)</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
          <li>Open <strong>tasks.meavo.app</strong> in Chrome and sign in.</li>
          <li>Tap the <strong>menu</strong> (three dots, top right).</li>
          <li>Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>.</li>
          <li>Confirm the name and tap <strong>Add</strong> / <strong>Install</strong>.</li>
        </ol>
      </Card>

      <p className="text-xs text-slate-500">
        Tip: after installing, use the home screen icon instead of a browser bookmark for the best
        mobile experience with the bottom navigation bar.
      </p>
    </div>
  );
}

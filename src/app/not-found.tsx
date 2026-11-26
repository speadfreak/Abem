import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import EmberCanvas from "@/components/brand/EmberCanvas";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <EmberCanvas className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_20%,rgba(179,38,30,0.12),transparent)]" aria-hidden="true" />
      <LogoMark animated className="h-20 w-20" />
      <p className="mt-8 font-display text-[clamp(4rem,12vw,8rem)] leading-none">
        <span className="gold-text">4</span><span className="text-cream/90">0</span><span className="ember-text">4</span>
      </p>
      <h1 className="display-2 mt-2 text-cream">This table doesn&apos;t exist.</h1>
      <p className="lead mt-4 max-w-md">
        The page you asked for has left the kitchen. The mesob, however, is very much still set —
        let us walk you back.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-4">
        <Link href="/" className="btn-gold">Back to the fire</Link>
        <Link href="/menu" className="btn-ghost">See the menu</Link>
      </div>
    </main>
  );
}

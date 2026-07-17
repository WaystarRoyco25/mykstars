import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <p className="kicker">404</p>
      <h1 className="font-serif text-5xl mt-3">Off the runway</h1>
      <p className="text-muted mt-4 leading-relaxed">
        That page has left the stage. The people we cover are all still here.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Link
          href="/artists"
          className="label text-bone border border-crimson px-5 py-2.5 hover:bg-crimson hover:text-white transition-colors"
        >
          Browse the Stars
        </Link>
        <Link href="/" className="label hover:text-bone transition-colors">
          Home →
        </Link>
      </div>
    </div>
  );
}

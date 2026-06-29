import type { Metadata } from "next";
import Link from "next/link";
import { getArtists, getGalleriesByArtist } from "@/lib/data";
import { roleLabel } from "@/lib/people";

export const metadata: Metadata = {
  title: "People",
  description:
    "Per-person hubs: a photo timeline, profile and the latest credited galleries for each idol, actor and director across K-culture.",
};

export default async function ArtistsPage() {
  const artists = await getArtists();
  const counts = await Promise.all(
    artists.map(async (a) => (await getGalleriesByArtist(a.slug)).length),
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-10">
        <p className="kicker">People</p>
        <h1 className="font-serif text-4xl sm:text-5xl mt-2">Hubs</h1>
        <p className="text-muted mt-3 max-w-2xl leading-relaxed">
          A photo timeline and profile for each person (idols, actors and
          directors): the Naver profile page, in English.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line">
        {artists.map((a, i) => (
          <Link
            key={a.slug}
            href={`/artists/${a.slug}`}
            className="group bg-ink p-6 hover:bg-ink-2 transition-colors"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-serif text-2xl group-hover:text-crimson transition-colors">
                {a.name}
              </h2>
              {a.koreanName && <span className="text-muted text-sm">{a.koreanName}</span>}
            </div>
            <p className="label mt-3 text-muted">
              {roleLabel(a)}
              {a.agency ? ` · ${a.agency}` : ""}
            </p>
            <p className="label mt-1 text-muted">{counts[i]} photo sets</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

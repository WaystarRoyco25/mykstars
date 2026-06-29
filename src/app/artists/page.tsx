import type { Metadata } from "next";
import { getArtists, getGalleriesByArtist } from "@/lib/data";
import ArtistCard from "@/components/ArtistCard";

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
          <ArtistCard key={a.slug} artist={a} photoSets={counts[i]} />
        ))}
      </div>
    </div>
  );
}

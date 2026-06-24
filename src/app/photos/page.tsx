import type { Metadata } from "next";
import { getGalleries } from "@/lib/data";
import GalleryGrid from "@/components/GalleryGrid";

export const metadata: Metadata = {
  title: "Photos",
  description:
    "The freshest organized, credited HD photos of Korean celebrities across K-Pop, K-Drama, K-Movie and Fashion — choose a pillar to dive in.",
};

export default async function PhotosPage() {
  const galleries = await getGalleries();

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8">
        <p className="kicker">Photos</p>
        <h1 className="font-serif text-4xl sm:text-5xl mt-2">The latest, organized</h1>
        <p className="text-muted mt-3 max-w-2xl leading-relaxed">
          Every set is credited and links back to its source — newest first.
          Pick a pillar in the header to focus on K-Pop, K-Drama, Fashion or
          K-Movie.
        </p>
      </header>

      {galleries.length > 0 ? (
        <GalleryGrid galleries={galleries} priorityCount={3} />
      ) : (
        <p className="text-muted">No photo sets yet.</p>
      )}
    </div>
  );
}

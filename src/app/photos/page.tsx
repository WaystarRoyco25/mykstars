import type { Metadata } from "next";
import { getGalleries } from "@/lib/data";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/types";
import type { Category } from "@/lib/types";
import CategoryFilter from "@/components/CategoryFilter";
import GalleryGrid from "@/components/GalleryGrid";

export const metadata: Metadata = {
  title: "Photos",
  description:
    "The freshest organized, credited HD photos of Korean celebrities — airport, red carpet, comeback, event and pictorial — filterable by category.",
};

function parseCategory(value?: string): Category | null {
  return CATEGORY_ORDER.includes(value as Category) ? (value as Category) : null;
}

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const active = parseCategory(category);
  const galleries = await getGalleries(active ? { category: active } : undefined);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8">
        <p className="kicker">Photos</p>
        <h1 className="font-serif text-4xl sm:text-5xl mt-2">
          {active ? CATEGORY_LABELS[active] : "The latest, organized"}
        </h1>
        <p className="text-muted mt-3 max-w-2xl leading-relaxed">
          Every set is credited and links back to its source. Filter by where the
          photos were taken.
        </p>
      </header>

      <div className="mb-10 border-b border-line pb-3">
        <CategoryFilter active={active} />
      </div>

      {galleries.length > 0 ? (
        <GalleryGrid galleries={galleries} priorityCount={3} />
      ) : (
        <p className="text-muted">No photo sets in this category yet.</p>
      )}
    </div>
  );
}

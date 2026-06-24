import type { Gallery } from "@/lib/types";
import PhotoCard from "./PhotoCard";

export default function GalleryGrid({
  galleries,
  priorityCount = 0,
}: {
  galleries: Gallery[];
  priorityCount?: number;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-8 [grid-auto-flow:dense]">
      {galleries.map((g, i) => (
        <PhotoCard key={g.slug} gallery={g} priority={i < priorityCount} />
      ))}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getEvents } from "@/lib/data";
import { NOW } from "@/lib/seed";
import type { EventRegion, EventType, StarEvent } from "@/lib/types";
import { EVENT_TYPE_LABELS, REGION_ORDER } from "@/lib/types";
import { dDayLabel, eventDateRange, monthLabel } from "@/lib/format";
import AttributionBadge from "@/components/AttributionBadge";
import DDayBadge from "@/components/DDayBadge";
import ScheduleFilter from "@/components/ScheduleFilter";
import JsonLd from "@/components/JsonLd";
import { IconArrowUpRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "Schedule",
  description:
    "A D-Day countdown to officially-announced K-pop concerts and fan meetings worldwide — international stops first, filterable by region and type.",
};

const VALID_REGIONS = new Set<string>(REGION_ORDER);

function EventRow({ event }: { event: StarEvent }) {
  const slug = event.artistSlugs?.[0];
  return (
    <li className="border-b border-line">
      <article className="flex items-start gap-4 sm:gap-6 py-5 px-3 -mx-3 hover:bg-ink-2 transition-colors">
        {/* D-Day + date */}
        <div className="w-14 sm:w-20 shrink-0 pt-1">
          <DDayBadge date={event.date} initialLabel={dDayLabel(event.date)} />
          <div className="text-xs text-muted tabular-nums mt-1.5 leading-tight">
            {eventDateRange(event.date, event.endDate)}
          </div>
        </div>

        {/* Headliner + details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-x-3 gap-y-1 flex-wrap">
            {slug ? (
              <Link href={`/artists/${slug}`} className="group">
                <h3 className="font-serif text-xl sm:text-2xl leading-tight group-hover:text-crimson transition-colors">
                  {event.headliner}
                </h3>
              </Link>
            ) : (
              <h3 className="font-serif text-xl sm:text-2xl leading-tight">{event.headliner}</h3>
            )}
            <span className="label text-muted-2">{EVENT_TYPE_LABELS[event.type]}</span>
          </div>
          {event.tour && <p className="text-muted text-sm mt-1">{event.tour}</p>}
          <p className="text-sm text-muted mt-2">
            {event.city}, {event.country}
            {event.venue ? ` · ${event.venue}` : ""}
          </p>
          {event.note && (
            <p className="text-xs text-muted-2 mt-1.5 max-w-prose leading-relaxed">{event.note}</p>
          )}
        </div>

        {/* Tickets + source */}
        <div className="shrink-0 flex flex-col items-end gap-2 text-right">
          {event.ticketUrl && (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="label inline-flex items-center gap-1 text-bone hover:text-crimson transition-colors"
            >
              Tickets <IconArrowUpRight size={12} />
            </a>
          )}
          <AttributionBadge source={event.source} />
        </div>
      </article>
    </li>
  );
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; type?: string }>;
}) {
  const { region: regionParam, type: typeParam } = await searchParams;

  const activeRegion: EventRegion | "international" =
    regionParam && VALID_REGIONS.has(regionParam)
      ? (regionParam as EventRegion)
      : "international";
  const activeType: EventType | null =
    typeParam === "concert" || typeParam === "fan-meeting" ? typeParam : null;

  const events = await getEvents({
    region: activeRegion,
    type: activeType ?? undefined,
    upcomingFrom: NOW,
  });

  // Events come sorted soonest-first; bucket consecutive runs by calendar month.
  const groups: { key: string; label: string; items: StarEvent[] }[] = [];
  for (const e of events) {
    const key = e.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(e);
    else groups.push({ key, label: monthLabel(e.date), items: [e] });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "MyKStars — K-culture concert & fan-meeting schedule",
    itemListElement: events.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": e.type === "concert" ? "MusicEvent" : "Event",
        name: `${e.headliner}${e.tour ? ` — ${e.tour}` : ""}`,
        startDate: e.date,
        ...(e.endDate ? { endDate: e.endDate } : {}),
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: e.venue ?? e.city,
          address: {
            "@type": "PostalAddress",
            addressLocality: e.city,
            addressCountry: e.country,
          },
        },
        ...(e.ticketUrl ? { url: e.ticketUrl } : {}),
      },
    })),
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <JsonLd data={jsonLd} />

      <header className="mb-8">
        <p className="kicker">Schedule</p>
        <h1 className="font-serif text-4xl sm:text-5xl mt-2">D-Day calendar</h1>
        <p className="text-muted mt-3 max-w-2xl leading-relaxed">
          Officially-announced concerts and fan meetings, counting down to the day. Built for fans
          outside Korea — international stops lead; switch regions or filter by type below.
        </p>
      </header>

      <div className="mb-10 border-b border-line pb-3">
        <ScheduleFilter activeRegion={activeRegion} activeType={activeType} />
      </div>

      {groups.length > 0 ? (
        <div className="flex flex-col gap-10">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="label text-bone border-b border-line pb-2 mb-2">{group.label}</h2>
              <ul>
                {group.items.map((e) => (
                  <EventRow key={e.slug} event={e} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="text-muted">No upcoming events match this filter yet.</p>
      )}

      <p className="text-xs text-muted-2 mt-12 max-w-2xl leading-relaxed">
        Dates are compiled from official announcements and ticketing pages and are accurate as of
        June 2026. Tour schedules change — always confirm with the official link before booking
        travel.
      </p>
    </div>
  );
}

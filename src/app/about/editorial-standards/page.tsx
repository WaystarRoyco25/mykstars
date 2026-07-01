import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Editorial standards",
  description:
    "How MyKStars credits photos, labels what is confirmed versus unverified, and handles corrections.",
};

const SECTIONS = [
  {
    h: "Attribution, always",
    p: "Every photograph is credited to its originating outlet, photographer or platform and links back to the original. We prefer official social embeds so images stay on their source. We do not strip watermarks or credit lines, and we honor removal requests.",
  },
  {
    h: "Logos and trademarks",
    p: "Company names and logos (record labels, agencies and broadcasters) are the trademarks of their respective owners. We show them only to identify the companies behind the artists and titles we cover, and their use here implies no endorsement or affiliation.",
  },
  {
    h: "Confirmed vs unverified",
    p: "We attach a Confirmed label only to facts an official source has stated on the record, with that source linked. Unverified marks reporting that is circulating but not confirmed at the source, and we explain what would have to change for the status to update. We do not repeat unconfirmed personal claims as if established.",
  },
  {
    h: "Neutral framing",
    p: "We state achievements and events plainly, without clickbait, fan-war framing, or sensationalism. Translations show enough context to be understood fairly.",
  },
  {
    h: "Corrections",
    p: "When we get something wrong, we fix it and say so. Significant corrections are noted on the article. Email corrections@mykstars.com.",
  },
];

export default function EditorialStandardsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <p className="kicker">About</p>
      <h1 className="font-serif text-4xl sm:text-5xl mt-2">Editorial standards</h1>
      <p className="text-muted mt-4 leading-relaxed">
        MyKStars exists to give global fans the freshest K-celebrity photography,
        organized, credited, and presented with credible context rather than
        clickbait. These are the rules we hold ourselves to.
      </p>

      <div className="mt-10 flex flex-col gap-8">
        {SECTIONS.map((s) => (
          <section key={s.h} className="border-t border-line pt-6">
            <h2 className="font-serif text-2xl">{s.h}</h2>
            <p className="text-muted mt-3 leading-relaxed">{s.p}</p>
          </section>
        ))}
      </div>

      <p className="text-sm text-muted mt-10">
        See also our{" "}
        <Link href="/legal/dmca" className="text-crimson hover:underline">
          DMCA &amp; takedown policy
        </Link>
        .
      </p>
    </div>
  );
}

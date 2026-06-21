import type { Metadata } from "next";
import TakedownForm from "@/components/TakedownForm";

export const metadata: Metadata = {
  title: "DMCA & takedown",
  description:
    "How MyKStars handles copyright and removal requests. We credit every photo, link to its source, and remove validly-claimed content quickly.",
};

export default function DmcaPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <p className="kicker">Legal</p>
      <h1 className="font-serif text-4xl sm:text-5xl mt-2">DMCA &amp; takedown</h1>

      <div className="flex flex-col gap-4 text-muted leading-relaxed mt-6">
        <p>
          MyKStars is built around attribution. We credit every photograph to its
          originating outlet, photographer or platform, link back to the original,
          and prefer official embeds so images remain on their source. We never strip
          watermarks or credit lines.
        </p>
        <p>
          If you are a rights-holder and believe content here is used without
          authorization, tell us and we will act quickly. We maintain a registered
          DMCA agent, operate notice-and-takedown, and terminate repeat infringers.
          Filing the form below is the fastest route; you may also email{" "}
          <a href="mailto:dmca@mykstars.com" className="text-crimson hover:underline">
            dmca@mykstars.com
          </a>
          .
        </p>
      </div>

      <h2 className="font-serif text-2xl mt-10 mb-5">Submit a request</h2>
      <TakedownForm />

      <p className="text-xs text-muted mt-10 leading-relaxed">
        This page describes our operating policy and is not legal advice. A complete
        DMCA notice should identify the work, the material to be removed, your contact
        details, a good-faith statement, and a statement under penalty of perjury that
        you are authorized to act.
      </p>
    </div>
  );
}

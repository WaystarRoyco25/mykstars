"use client";

import { useState } from "react";
import { submitTakedown } from "@/app/legal/dmca/actions";

type State = "idle" | "sending" | "done" | "error";

const field =
  "w-full bg-ink-2 border border-line px-3 py-2.5 text-bone placeholder:text-muted-2 focus:border-crimson outline-none";
const labelCls = "label block mb-2";

export default function TakedownForm() {
  const [state, setState] = useState<State>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const form = e.currentTarget;
    try {
      const result = await submitTakedown(new FormData(form));
      if (!result.ok) throw new Error("Request failed");
      setState("done");
      form.reset();
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="border border-crimson p-6">
        <p className="kicker mb-2">Received</p>
        <p className="text-muted leading-relaxed">
          Thank you. Your request has been logged and will be reviewed promptly. We
          remove validly-claimed content quickly and notify the uploader.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className={labelCls} htmlFor="name">Your name</label>
          <input className={field} id="name" name="name" required />
        </div>
        <div>
          <label className={labelCls} htmlFor="email">Email</label>
          <input className={field} id="email" name="email" type="email" required />
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="rightsHolder">Rights-holder you represent</label>
        <input className={field} id="rightsHolder" name="rightsHolder" required />
      </div>
      <div>
        <label className={labelCls} htmlFor="url">URL of the content on MyKStars</label>
        <input className={field} id="url" name="url" type="url" placeholder="https://mykstars.com/photos/…" required />
      </div>
      <div>
        <label className={labelCls} htmlFor="details">Describe the work and your claim</label>
        <textarea className={field} id="details" name="details" rows={4} required />
      </div>
      <label className="flex items-start gap-3 text-sm text-muted">
        <input type="checkbox" name="goodFaith" required className="mt-1 accent-[var(--color-crimson)]" />
        I have a good-faith belief that this use is not authorized, and the information above is accurate.
      </label>

      {state === "error" && (
        <p className="text-crimson text-sm">Something went wrong. Please email dmca@mykstars.com.</p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="self-start label text-bone border border-crimson px-5 py-2.5 hover:bg-crimson hover:text-white transition-colors disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "Submit takedown request"}
      </button>
    </form>
  );
}

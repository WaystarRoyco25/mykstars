"use server";

export type TakedownResult = { ok: true } | { ok: false };

function textField(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+$/.test(value);
}

function isValidWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Takedown intake. A tracked ticket and DMCA-agent notification remain a
// separate feature; this action retains the existing logging sink.
export async function submitTakedown(formData: FormData): Promise<TakedownResult> {
  const name = textField(formData, "name");
  const email = textField(formData, "email");
  const rightsHolder = textField(formData, "rightsHolder");
  const url = textField(formData, "url");
  const details = textField(formData, "details");
  const goodFaith = formData.get("goodFaith") === "on";

  if (
    !name ||
    !email ||
    !isValidEmail(email) ||
    !rightsHolder ||
    !url ||
    !isValidWebUrl(url) ||
    !details ||
    !goodFaith
  ) {
    return { ok: false };
  }

  console.info("[takedown] received", { rightsHolder, url });
  return { ok: true };
}

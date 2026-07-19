export interface TakedownRequest {
  name: string;
  email: string;
  rightsHolder: string;
  url: string;
  details: string;
  goodFaith: true;
}

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

export function parseTakedownRequest(formData: FormData): TakedownRequest | null {
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
    return null;
  }

  return { name, email, rightsHolder, url, details, goodFaith: true };
}

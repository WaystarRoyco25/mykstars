export interface CheckIssue {
  file: string;
  line?: number;
  kind: string;
  detail: string;
}

export function issue(
  file: string,
  kind: string,
  detail: string,
  line?: number,
): CheckIssue {
  return { file, kind, detail, ...(line === undefined ? {} : { line }) };
}

export function formatIssue(value: CheckIssue): string {
  return `${value.file}:${value.line ?? 1}  ${value.kind}  ${value.detail}`;
}

export function parseCalendarDate(value: string): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
    ? value
    : undefined;
}

export function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

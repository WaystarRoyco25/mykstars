export function singleParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

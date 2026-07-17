export const VOTER_COOKIE = "myk_voter";
export const VOTER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

interface VoterCookieStore {
  get(name: string): { value: string } | undefined;
  set(
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      sameSite: "lax";
      secure: boolean;
      maxAge: number;
      path: string;
    },
  ): void;
}

export function getVoterId(cookieStore: Pick<VoterCookieStore, "get">): string | undefined {
  return cookieStore.get(VOTER_COOKIE)?.value;
}

export function getOrCreateVoterId(
  cookieStore: VoterCookieStore,
  createId: () => string = () => crypto.randomUUID(),
): string {
  const existing = getVoterId(cookieStore);
  if (existing) return existing;

  const voterId = createId();
  cookieStore.set(VOTER_COOKIE, voterId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: VOTER_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  return voterId;
}

import type { ReactNode } from "react";
import Link from "next/link";

export default function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`label whitespace-nowrap pb-1.5 border-b-2 transition-colors ${
        active ? "text-bone border-crimson" : "border-transparent hover:text-bone"
      }`}
    >
      {children}
    </Link>
  );
}

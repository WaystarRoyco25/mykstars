import Link from "next/link";

// The MyKStars wordmark: high-contrast display serif, crimson "Stars".
export default function Wordmark({
  className = "",
  size = "text-2xl",
}: {
  className?: string;
  size?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="MyKStars home"
      className={`font-serif tracking-tight ${size} ${className}`}
    >
      MyK<span className="text-crimson">Stars</span>
    </Link>
  );
}

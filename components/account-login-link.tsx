"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AccountLoginLink({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const pathname = usePathname() || "/";
  const next = pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/";
  return (
    <Link
      href={`/account/login?next=${encodeURIComponent(next)}`}
      className={className}
    >
      {label}
    </Link>
  );
}

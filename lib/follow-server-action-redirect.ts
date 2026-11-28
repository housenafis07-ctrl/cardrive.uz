"use client";

/** Follow Next.js redirect signals thrown by server actions invoked imperatively. */
export function followServerActionRedirect(error: unknown): boolean {
  const candidate = error && typeof error === "object" ? error as { digest?: unknown; message?: unknown } : {};
  const digest = typeof candidate.digest === "string" ? candidate.digest : "";
  const message = typeof candidate.message === "string" ? candidate.message : String(error ?? "");
  const match = /^NEXT_REDIRECT;(?:push|replace);([^;]+);/.exec(digest);
  if (match) {
    const destination = match[1];
    if (destination.startsWith("/") && !destination.startsWith("//")) {
      window.location.assign(destination);
      return true;
    }
  }
  if (digest.startsWith("NEXT_REDIRECT") || message === "NEXT_REDIRECT") {
    window.location.reload();
    return true;
  }
  return false;
}

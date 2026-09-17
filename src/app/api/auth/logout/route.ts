import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  return NextResponse.json({ success: true, redirect: "/login" });
}

export async function GET(req: Request) {
  // CRITICAL: Next.js link prefetching and browser speculative fetching sends GET requests in the background.
  // We must NEVER delete the user's session on a background prefetch request!
  const isPrefetch =
    req.headers.get("purpose") === "prefetch" ||
    req.headers.get("x-purpose") === "prefetch" ||
    req.headers.get("sec-purpose") === "prefetch" ||
    req.headers.get("x-nextjs-data") ||
    req.headers.get("rsc") ||
    req.headers.get("next-router-prefetch") ||
    req.headers.get("next-router-state-tree");

  if (isPrefetch) {
    return new NextResponse(null, { status: 204 });
  }

  const cookieStore = await cookies();
  cookieStore.delete("session");
  return NextResponse.redirect(new URL("/login", req.url));
}

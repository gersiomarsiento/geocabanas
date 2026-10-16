// app/api/admin/properties/[id]/sync-ical/route.ts
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// No per-route auth check: /api/admin/* is already gated by the middleware.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  revalidateTag(`ical:${id}`, { expire: 0 }); 

  return NextResponse.json({ ok: true });
}

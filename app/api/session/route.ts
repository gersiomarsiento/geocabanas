import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const authenticated = token ? await verifySessionToken(token) : false;
  return NextResponse.json({ authenticated });
}

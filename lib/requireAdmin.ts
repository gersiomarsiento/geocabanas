// lib/requireAdmin.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

// Returns a 401 response if not logged in, otherwise null.
export async function requireAdmin(): Promise<NextResponse | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const valid = token ? await verifySessionToken(token) : false;
  return valid
    ? null
    : NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

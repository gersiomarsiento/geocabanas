// Minimal signed-cookie session for a single hardcoded admin. No user
// table, no NextAuth — just a JWT the server signs and verifies.
 
import { SignJWT, jwtVerify } from "jose";
 
export const COOKIE_NAME = "admin_session";
 
const secret = new TextEncoder().encode(process.env.SESSION_SECRET as string);
 
export async function createSessionToken(): Promise<string> {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}
 
export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}
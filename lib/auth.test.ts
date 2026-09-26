import { SignJWT } from "jose";
import { createSessionToken, verifySessionToken } from "@/lib/auth";

describe("session token round-trip", () => {
  it("accepts a token it just created", async () => {
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);
  });

  it("rejects garbage input", async () => {
    expect(await verifySessionToken("not-a-real-token")).toBe(false);
  });

  it("rejects an empty string", async () => {
    expect(await verifySessionToken("")).toBe(false);
  });
});

describe("session token forgery/tamper resistance", () => {
  it("rejects a token signed with a different secret", async () => {
    const wrongSecret = new TextEncoder().encode(
      "a-completely-different-secret",
    );
    const forgedToken = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(wrongSecret);

    expect(await verifySessionToken(forgedToken)).toBe(false);
  });

  it("rejects a correctly-signed token with the wrong role claim", async () => {
    const realSecret = new TextEncoder().encode(
      process.env.SESSION_SECRET as string,
    );
    const wrongRoleToken = await new SignJWT({ role: "user" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(realSecret);

    expect(await verifySessionToken(wrongRoleToken)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const realSecret = new TextEncoder().encode(
      process.env.SESSION_SECRET as string,
    );
    const expiredToken = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("-1s") // already expired at signing time
      .sign(realSecret);

    expect(await verifySessionToken(expiredToken)).toBe(false);
  });
});

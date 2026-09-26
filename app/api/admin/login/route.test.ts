import { POST as loginPOST } from "@/app/api/admin/login/route";
import { POST as logoutPOST } from "@/app/api/admin/logout/route";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth";

function loginRequest(password: unknown): Request {
  return new Request("http://localhost/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

describe("POST /api/admin/login", () => {
  it("rejects a missing password with 401", async () => {
    const res = await loginPOST(loginRequest(undefined) as never);
    expect(res.status).toBe(401);
  });

  it("rejects an incorrect password with 401", async () => {
    const res = await loginPOST(loginRequest("wrong-password") as never);
    expect(res.status).toBe(401);
  });

  it("issues a valid, correctly-attributed session cookie on the right password", async () => {
    const res = await loginPOST(
      loginRequest(process.env.ADMIN_PASSWORD) as never,
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);

    const setCookieHeader = res.headers.get("set-cookie") ?? "";
    expect(setCookieHeader).toContain(`${COOKIE_NAME}=`);
    expect(setCookieHeader).toContain("HttpOnly");
    expect(setCookieHeader).toContain("SameSite=lax");
    expect(setCookieHeader).toContain("Path=/");
    // NODE_ENV is "test" here, not "production", so Secure should be absent.
    expect(setCookieHeader).not.toContain("Secure");

    const tokenValue = res.cookies.get(COOKIE_NAME)?.value;
    expect(tokenValue).toBeDefined();
    expect(await verifySessionToken(tokenValue as string)).toBe(true);
  });
});

describe("POST /api/admin/logout", () => {
  it("clears the session cookie", async () => {
    const res = await logoutPOST();
    const setCookieHeader = res.headers.get("set-cookie") ?? "";

    expect(setCookieHeader).toContain(`${COOKIE_NAME}=`);
    expect(setCookieHeader).toContain("Max-Age=0");
  });
});

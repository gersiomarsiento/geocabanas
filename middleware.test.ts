jest.mock("next-intl/middleware", () => ({
  __esModule: true,
  default: () => () => {
    throw new Error(
      "intlMiddleware should not be invoked by any /admin-path test",
    );
  },
}));

import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";

function requestFor(path: string, token?: string): NextRequest {
  const headers = new Headers();
  if (token) {
    headers.set("cookie", `${COOKIE_NAME}=${token}`);
  }
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe("middleware — /admin gate", () => {
  it("redirects to /admin/login when there is no session cookie", async () => {
    const res = await middleware(requestFor("/admin"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/admin/login");
  });

  it("redirects to /admin/login when the cookie is garbage", async () => {
    const res = await middleware(requestFor("/admin", "not-a-real-token"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/admin/login");
  });

  it("lets a request through with a valid session cookie", async () => {
    const token = await createSessionToken();
    const res = await middleware(requestFor("/admin", token));

    expect(res.status).not.toBe(307);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects away from /admin/login when already authenticated", async () => {
    const token = await createSessionToken();
    const res = await middleware(requestFor("/admin/login", token));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/admin");
  });

  it("lets an unauthenticated request reach the login page itself", async () => {
    const res = await middleware(requestFor("/admin/login"));
    expect(res.status).not.toBe(307);
    expect(res.headers.get("location")).toBeNull();
  });
});

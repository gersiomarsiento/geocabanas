import { supabaseAdmin } from "@/lib/supabase/admin";

describe("local Supabase connection (smoke test)", () => {
  it("loads .env.test values", () => {
    expect(process.env.SUPABASE_URL).toBe("http://127.0.0.1:65433");
  });

  it("can query the properties table and gets an empty array back", async () => {
    const { data, error } = await supabaseAdmin.from("properties").select("*");

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

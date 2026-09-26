import { GET, POST } from "@/app/api/admin/faqs/route";
import { createTestFaq, cleanup, trackFaqId } from "@/lib/testUtils/db";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/faqs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(async () => {
  await cleanup();
});

describe("GET /api/admin/faqs", () => {
  it("returns an empty array when there are no FAQs", async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });

  it("returns FAQs ordered by sort_order ascending", async () => {
    await createTestFaq({
      question: { es: "Segunda" },
      answer: { es: "R2" },
      sort_order: 1,
    });
    await createTestFaq({
      question: { es: "Primera" },
      answer: { es: "R1" },
      sort_order: 0,
    });

    const res = await GET();
    const body = await res.json();

    expect(body.map((f: { question: string }) => f.question)).toEqual([
      "Primera",
      "Segunda",
    ]);
  });

  it("returns only the es text, ignoring en/pt even when present", async () => {
    await createTestFaq({
      question: { es: "¿Hola?", en: "Hello?", pt: "Olá?" },
      answer: { es: "Sí", en: "Yes", pt: "Sim" },
    });

    const res = await GET();
    const body = await res.json();

    expect(body[0].question).toBe("¿Hola?");
    expect(body[0].answer).toBe("Sí");
  });
});

describe("POST /api/admin/faqs — validation", () => {
  it("returns 400 when question is missing", async () => {
    const res = await POST(postRequest({ answer: "Respuesta" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when answer is missing", async () => {
    const res = await POST(postRequest({ question: "Pregunta" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when question is only whitespace", async () => {
    const res = await POST(
      postRequest({ question: "   ", answer: "Respuesta" }),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/admin/faqs — creation", () => {
  it("trims whitespace from question and answer", async () => {
    const res = await POST(
      postRequest({ question: "  ¿Qué es esto?  ", answer: "  Es esto.  " }),
    );
    const body = await res.json();
    trackFaqId(body.id);

    expect(res.status).toBe(200);
    expect(body.question).toBe("¿Qué es esto?");
    expect(body.answer).toBe("Es esto.");
  });

  it("assigns sort_order 0 to the first FAQ", async () => {
    const res = await POST(postRequest({ question: "Primera", answer: "R1" }));
    const body = await res.json();
    trackFaqId(body.id);

    expect(body.sortOrder).toBe(0);
  });

  it("assigns the next sort_order after the current max", async () => {
    await createTestFaq({ sort_order: 0 });
    await createTestFaq({ sort_order: 5 });

    const res = await POST(
      postRequest({ question: "Nueva", answer: "Respuesta" }),
    );
    const body = await res.json();
    trackFaqId(body.id);

    expect(body.sortOrder).toBe(6);
  });
});

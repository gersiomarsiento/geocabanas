"use client";

// app/components/FaqSection.tsx

import { useEffect, useState } from "react";

interface PublicFaq {
  id: string;
  question: string;
  answer: string;
}

export default function FaqSection() {
  const [faqs, setFaqs] = useState<PublicFaq[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/faqs")
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudieron cargar las preguntas");
        }

        return res.json() as Promise<PublicFaq[]>;
      })
      .then(setFaqs)
      .catch(() => setFaqs([]));
  }, []);

  if (faqs && faqs.length === 0) return null;

  return (
    <section
      id="preguntas-frecuentes"
      aria-label="Preguntas frecuentes"
      className="mx-auto w-full justify-items-center px-3 py-10 md:px-6"
    >
      <div className="w-full max-w-lg md:max-w-354">
        <h2 className="mb-6 text-center text-primary">
          Preguntas frecuentes
        </h2>

        {!faqs ? (
          <p className="text-center text-sm text-zinc-500 ">Cargando…</p>
        ) : (
          <div className="space-y-2">
            {faqs.map((faq) => {
              const isOpen = openId === faq.id;

              return (
                <div
                  key={faq.id}
                  className="overflow-hidden rounded-xl border border-zinc-200 bg-accent-50/10 shadow-sm  "
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between px-3 md:px-6 py-4 text-left"
                  >
                    <span className="text-sm font-medium text-primary ">
                      {faq.question}
                    </span>

                    <span
                      className={`ml-3 shrink-0 text-xl leading-none text-zinc-500 transition-transform duration-300 ease-in-out ${
                        isOpen ? "rotate-45" : "rotate-0"
                      }`}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div
                        className={`border-t border-zinc-200 px-5 py-4 text-sm text-zinc-600 transition-opacity duration-200   -100" : "opacity-0"
                      }`}
                      >
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

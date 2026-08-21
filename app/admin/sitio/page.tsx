"use client";

import { useState, type ReactNode } from "react";

import SiteHeroCard from "../propiedades/SiteHeroCard";
import SiteContactCard from "../propiedades/SiteContactCard";
import SiteEmailCard from "../propiedades/SiteEmailCard";
import SiteFaqCard from "../propiedades/SiteFaqCard";
import SiteCurrencyCard from "../propiedades/SiteCurrencyCard";

type SectionId = "hero" | "contact" | "currency" | "email" | "faq";

interface AdminSectionProps {
  id: SectionId;
  title: string;
  openSection: SectionId | null;
  onToggle: (id: SectionId) => void;
  children: ReactNode;
}

function AdminSection({
  id,
  title,
  openSection,
  onToggle,
  children,
}: AdminSectionProps) {
  const isOpen = openSection === id;

  return (
    <section className="mb-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <span className="text-base font-semibold">{title}</span>

        <span
          className={`text-xl transition-transform duration-200 ${
            isOpen ? "rotate-45" : ""
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
          <div className="border-t border-zinc-200 p-5">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function SitioPage() {
  const [openSection, setOpenSection] = useState<SectionId | null>("hero");

  function handleToggle(section: SectionId) {
    setOpenSection((current) => (current === section ? null : section));
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Sitio</h1>

      <AdminSection
        id="hero"
        title="Identidad"
        openSection={openSection}
        onToggle={handleToggle}
      >
        <SiteHeroCard />
      </AdminSection>

      <AdminSection
        id="contact"
        title="Contacto y ubicación"
        openSection={openSection}
        onToggle={handleToggle}
      >
        <SiteContactCard />
      </AdminSection>

      <AdminSection
        id="currency"
        title="Tipos de cambio"
        openSection={openSection}
        onToggle={handleToggle}
      >
        <SiteCurrencyCard />
      </AdminSection>

      <AdminSection
        id="email"
        title="Email de confirmación"
        openSection={openSection}
        onToggle={handleToggle}
      >
        <SiteEmailCard />
      </AdminSection>

      <AdminSection
        id="faq"
        title="Preguntas frecuentes"
        openSection={openSection}
        onToggle={handleToggle}
      >
        <SiteFaqCard />
      </AdminSection>
    </div>
  );
}

"use client";

import { useState } from "react";

import SiteHeroCard from "../propiedades/SiteHeroCard";
import SiteContactCard from "../propiedades/SiteContactCard";
import SiteEmailCard from "../propiedades/SiteEmailCard";
import SiteFaqCard from "../propiedades/SiteFaqCard";
import SiteCurrencyCard from "../propiedades/SiteCurrencyCard";
import { CollapsibleSection } from "../propiedades/AdminUI";

type SectionId = "hero" | "contact" | "currency" | "email" | "faq";

export default function SitioPage() {
  const [openSection, setOpenSection] = useState<SectionId | null>("hero");

  function handleToggle(section: SectionId) {
    setOpenSection((current) => (current === section ? null : section));
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Sitio</h1>

      <div className="space-y-4">
        <CollapsibleSection
          title="Identidad"
          open={openSection === "hero"}
          onToggle={() => handleToggle("hero")}
        >
          <SiteHeroCard />
        </CollapsibleSection>

        <CollapsibleSection
          title="Contacto y ubicación"
          open={openSection === "contact"}
          onToggle={() => handleToggle("contact")}
        >
          <SiteContactCard />
        </CollapsibleSection>

        <CollapsibleSection
          title="Tipos de cambio"
          open={openSection === "currency"}
          onToggle={() => handleToggle("currency")}
        >
          <SiteCurrencyCard />
        </CollapsibleSection>

        <CollapsibleSection
          title="Email de confirmación"
          open={openSection === "email"}
          onToggle={() => handleToggle("email")}
        >
          <SiteEmailCard />
        </CollapsibleSection>

        <CollapsibleSection
          title="Preguntas frecuentes"
          open={openSection === "faq"}
          onToggle={() => handleToggle("faq")}
        >
          <SiteFaqCard />
        </CollapsibleSection>
      </div>
    </div>
  );
}
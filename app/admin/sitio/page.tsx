"use client";

import { useState } from "react";

import SiteSlideCard from "../propiedades/SiteSlideCard";
import SiteIdentityCard from "../propiedades/SiteIdentityCard";
import SiteContactCard from "../propiedades/SiteContactCard";
import SiteEmailCard from "../propiedades/SiteEmailCard";
import SiteFaqCard from "../propiedades/SiteFaqCard";
import SiteReviewsCard from "../propiedades/SiteReviewsCard";
import SiteCurrencyCard from "../propiedades/SiteCurrencyCard";
import SiteInstagramCard from "../propiedades/SiteInstagramCard";
import SiteCommonAreasCard from "../propiedades/SiteCommonAreasCard";
import SiteFeaturesCard from "../propiedades/SiteFeaturesCard";
import { CollapsibleSection } from "../propiedades/AdminUI";

type SectionId =
  | "portada"
  | "identity"
  | "features"
  | "commonAreas"
  | "contact"
  | "currency"
  | "email"
  | "faq"
  | "instagram"
  | "reviews";

export default function SitioPage() {
  const [openSection, setOpenSection] = useState<SectionId | null>("portada");

  function handleToggle(section: SectionId) {
    setOpenSection((current) => (current === section ? null : section));
  }

  return (
    <div>
      <h1 className="small mb-6 text-xl font-semibold">Sitio</h1>

      <div className="space-y-4">
        <CollapsibleSection
          title="Portada"
          open={openSection === "portada"}
          onToggle={() => handleToggle("portada")}
        >
          <div className="space-y-3">
            <CollapsibleSection
              className="bg-secondary-200! text-foreground! hover:bg-primary! hover:text-background!"
              title="Slide 1"
              defaultOpen
            >
              <SiteSlideCard slide={1} />
            </CollapsibleSection>
            <CollapsibleSection
              className="bg-secondary-200! text-foreground! hover:bg-primary! hover:text-background!"
              title="Slide 2"
            >
              <SiteSlideCard slide={2} />
            </CollapsibleSection>
            <CollapsibleSection
              className="bg-secondary-200! text-foreground! hover:bg-primary! hover:text-background!"
              title="Slide 3"
            >
              <SiteSlideCard slide={3} />
            </CollapsibleSection>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Identidad"
          open={openSection === "identity"}
          onToggle={() => handleToggle("identity")}
        >
          <SiteIdentityCard />
        </CollapsibleSection>
        <CollapsibleSection
          title="Espacios comunes"
          open={openSection === "commonAreas"}
          onToggle={() => handleToggle("commonAreas")}
        >
          <SiteCommonAreasCard />
        </CollapsibleSection>

        <CollapsibleSection
          title="Características y estadía"
          open={openSection === "features"}
          onToggle={() => handleToggle("features")}
        >
          <SiteFeaturesCard />
        </CollapsibleSection>

        <CollapsibleSection
          title="Contacto y ubicación"
          open={openSection === "contact"}
          onToggle={() => handleToggle("contact")}
        >
          <SiteContactCard />
        </CollapsibleSection>

        <CollapsibleSection
          title="Instagram"
          open={openSection === "instagram"}
          onToggle={() => handleToggle("instagram")}
        >
          <SiteInstagramCard />
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

        <CollapsibleSection
          title="Reseñas"
          open={openSection === "reviews"}
          onToggle={() => handleToggle("reviews")}
        >
          <SiteReviewsCard />
        </CollapsibleSection>
      </div>
    </div>
  );
}

"use client";

// app/admin/sitio/page.tsx
//
// Site-wide settings live here now, separate from per-property settings
// on /admin/propiedades. SiteHeroCard and SiteContactCard are unchanged
// — just relocated. Next steps add new cards/fields here (hero copy,
// email copy).

import SiteHeroCard from "../propiedades/SiteHeroCard";
import SiteContactCard from "../propiedades/SiteContactCard";
import SiteEmailCard from "../propiedades/SiteEmailCard";

export default function SitioPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Sitio</h1>
      <SiteHeroCard />
      <SiteContactCard />
      <SiteEmailCard />
    </div>
  );
}

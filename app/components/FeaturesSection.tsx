// app/components/FeaturesSection.tsx
//
// Hardcoded on purpose — no admin setting, no database table. Styled to
// match AboutSection's black theme so the two sit as one continuous block
// when placed back to back on the homepage, rather than a jarring cut
// from black straight into a light card grid.

function PoolIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className="h-9 w-9"
    >
      <path d="M2 17c1.2 1 2.4 1 3.6 0s2.4-1 3.6 0 2.4 1 3.6 0 2.4-1 3.6 0 2.4 1 3.6 0" />
      <path d="M2 21c1.2 1 2.4 1 3.6 0s2.4-1 3.6 0 2.4 1 3.6 0 2.4-1 3.6 0 2.4 1 3.6 0" />
      <path d="M7 13V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v7" />
      <path d="M11 9h5a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function GrillIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className="h-9 w-9"
    >
      <ellipse cx="12" cy="8" rx="8" ry="3" />
      <path d="M4 8v3c0 1.7 3.6 3 8 3s8-1.3 8-3V8" />
      <path d="M12 14v7M8 21h8" />
      <path d="M9 5.5c.5-1 .5-2-.3-3M15 5.5c-.5-1-.5-2 .3-3" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className="h-9 w-9"
    >
      <path d="M3 8.5a16 16 0 0 1 18 0" />
      <path d="M6.3 12.2a11.5 11.5 0 0 1 11.4 0" />
      <path d="M9.7 15.9a6.5 6.5 0 0 1 4.6 0" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BeachIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className="h-9 w-9"
    >
      <path d="M2 20c3-1.3 6-1.3 9 0s6 1.3 9 0" />
      <path d="M12 14V4" />
      <path d="M12 4c3 0 5.5 2.2 6 5-3.5-1-6.5 0-6 5" />
      <path d="M12 9c-3 0-5.5 2-6 4.5" />
    </svg>
  );
}

const FEATURES = [
  { icon: <PoolIcon />, label: "Piscina" },
  { icon: <GrillIcon />, label: "Parrillero" },
  { icon: <WifiIcon />, label: "WiFi" },
  { icon: <BeachIcon />, label: "A pasos de la playa (600 mts)" },
];

export default function FeaturesSection() {
  return (
    <section
      aria-label="Características del lugar"
      className="w-full bg-primary px-3 pb-10 pt-2 md:px-6 md:pb-16"
    >
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-4">
        {FEATURES.map((feature) => (
          <div
            key={feature.label}
            className="flex flex-col items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-center"
          >
            <span className="text-zinc-100">{feature.icon}</span>
            <span className="text-xs font-medium text-zinc-300">
              {feature.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

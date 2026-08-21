// app/components/LoadingOverlay.tsx
//
// Absolutely positioned to cover its nearest positioned ancestor — the
// parent needs `position: relative` (or similar) for this to sit over
// just that section rather than the whole page. See BookingCalendar's
// carousel wrapper for an example (it already has `relative`).

export default function LoadingOverlay({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center bg-secondary-50 ${className}`}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800" />
    </div>
  );
}

// app/components/icons/CaretSmallIcon.tsx

interface CaretSmallIconProps {
  className?: string;
}

export default function CaretIcon({
  className = "w-3 h-3",
}: CaretSmallIconProps) {
  return (
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="12"
  height="12"
  viewBox="0 0 24 24"
  fill="none"
  className={className}
>
  <path
    d="M5 8L12 15L19 8"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</svg>
  );
}

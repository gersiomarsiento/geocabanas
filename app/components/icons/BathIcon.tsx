interface IconProps {
  className?: string;
}

export default function BathIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
    >
      <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3z" />
      <path d="M6 12V6a2 2 0 0 1 3.6-1.2" />
      <path d="M3 19h18" />
    </svg>
  );
}

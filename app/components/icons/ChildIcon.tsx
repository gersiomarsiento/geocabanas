interface IconProps {
  className?: string;
}

export default function ChildIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
    >
      <circle cx="12" cy="5" r="2.2" />
      <path d="M12 9v6" />
      <path d="M8 12h8" />
      <path d="M9 21l3-6 3 6" />
    </svg>
  );
}

interface IconProps {
  className?: string;
}

export default function UsersIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
    >
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M15.5 6.2a3.2 3.2 0 0 1 0 6.2" />
      <path d="M14.8 14.3c2.6.4 4.7 2.6 4.7 5.7" />
    </svg>
  );
}

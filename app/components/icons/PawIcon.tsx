interface IconProps {
  className?: string;
}

export default function PawIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
    >
      <circle cx="7" cy="8" r="1.6" />
      <circle cx="12" cy="6" r="1.6" />
      <circle cx="17" cy="8" r="1.6" />
      <path d="M8.5 12.5c-2 .8-3 2.4-3 4a2.7 2.7 0 0 0 2.7 2.7c1 0 1.6-.5 2.3-1a4 4 0 0 1 3 0c.7.5 1.3 1 2.3 1A2.7 2.7 0 0 0 18.5 16.5c0-1.6-1-3.2-3-4a5.5 5.5 0 0 0-7 0z" />
    </svg>
  );
}

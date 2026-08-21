interface IconProps {
  className?: string;
}

export default function BedIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
    >
      <path d="M3 19v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" />
      <path d="M3 19v2M21 19v2" />
      <path
        d="M3 13V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3"
        strokeLinejoin="round"
      />
      <path d="M13 10h6a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

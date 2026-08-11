// app/components/icons/CaretIcon.tsx

interface CaretIconProps {
  className?: string;
}

export default function CaretIcon({ className }: CaretIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48px"
      height="48px"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <g id="Arrow / Caret_Right_SM">
        <path
          id="Vector"
          d="M11 9L14 12L11 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

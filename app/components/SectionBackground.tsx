import Image from "next/image";

interface SectionBackgroundProps {
  src?: string;
  alt?: string;
  className?: string;
}

export default function SectionBackground({
  src = "/images/bg_light_mesh.webp",
  alt = "",
  className = "",
}: SectionBackgroundProps) {
  return (
    <Image
      src={src}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      fill
      loading="lazy"
      sizes="100vw"
      className={`absolute inset-0 object-cover -z-10 ${className}`}
    />
  );
}
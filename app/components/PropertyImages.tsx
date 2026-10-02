"use client";

// app/admin/propiedades/PropertyImages.tsx

import ImageManager from "../components/ImageManager";

export default function PropertyImages({ propertyId }: { propertyId: string }) {
  return (
    <ImageManager
      apiBase={`/api/admin/properties/${propertyId}/images`}
      showCover
    />
  );
}

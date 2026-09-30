// lib/amenities.ts
//
// Single source of truth for the amenity checklist so the admin form and
// any future visitor-facing property page render the exact same set of
// options with the exact same labels.

export type AmenityOption = { id: string; label: string };

export const AMENITY_OPTIONS: AmenityOption[] = [
  { id: "wifi", label: "WiFi" },
  { id: "shared_bathroom", label: "Baño compartido" },
  { id: "private_bathroom", label: "Baño privado" },
  { id: "parking", label: "Estacionamiento" },
  { id: "pool", label: "Piscina" },
  { id: "heated_pool", label: "Piscina climatizada" },
  { id: "air_conditioning", label: "Aire acondicionado" },
  { id: "heating", label: "Calefacción" },
  { id: "shared_kitchen", label: "Cocina compartida" },
  { id: "private_kitchen", label: "Cocina privada" },
  { id: "tv", label: "TV" },
  { id: "cable_tv", label: "TV por cable" },
  { id: "washer", label: "Lavarropas" },
  { id: "dryer", label: "Secarropas" },
  { id: "bbq", label: "Parrilla" },
  { id: "breakfast", label: "Desayuno incluido" },
  { id: "fireplace", label: "Chimenea" },
  { id: "hot_tub", label: "Jacuzzi" },
  { id: "gym", label: "Gimnasio" },
  { id: "wheelchair_accessible", label: "Accesible en silla de ruedas" },
  { id: "smoking_allowed", label: "Se permite fumar" },
];

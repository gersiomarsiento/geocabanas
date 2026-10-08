// lib/site/features.ts
import {
  WavesHorizontal,
  Parasol,
  FlameKindling,
  Wifi,
  SquareParking,
  PawPrint,
  Utensils,
  Snowflake,
  Tv,
  Bath,
  BedDouble,
  Trees,
  Car,
  Coffee,
  Dumbbell,
  Bike,
  ShieldCheck,
  Sun,
  Fan,
  Baby,
  Sofa,
  ShowerHead,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import type { LocalizedText } from "@/lib/i18n/getLocalized";

export type FeatureItem = { icon: string; label: LocalizedText };
export type StayInfoItem = { value: string; label: LocalizedText };

export const FEATURE_ICONS: Record<string, { Icon: LucideIcon; name: string }> =
  {
    pool: { Icon: WavesHorizontal, name: "Piscina" },
    beach: { Icon: Parasol, name: "Playa" },
    wifi: { Icon: Wifi, name: "WiFi" },
    bbq: { Icon: FlameKindling, name: "Parrillero" },
    parking: { Icon: SquareParking, name: "Estacionamiento" },
    pets: { Icon: PawPrint, name: "Mascotas" },
    kitchen: { Icon: Utensils, name: "Cocina" },
    ac: { Icon: Snowflake, name: "Aire acondicionado" },
    tv: { Icon: Tv, name: "TV" },
    bath: { Icon: Bath, name: "Baño" },
    bed: { Icon: BedDouble, name: "Cama" },
    garden: { Icon: Trees, name: "Jardín" },
    car: { Icon: Car, name: "Auto" },
    coffee: { Icon: Coffee, name: "Café" },
    gym: { Icon: Dumbbell, name: "Gimnasio" },
    bike: { Icon: Bike, name: "Bicicletas" },
    security: { Icon: ShieldCheck, name: "Seguridad" },
    sun: { Icon: Sun, name: "Solarium" },
    fan: { Icon: Fan, name: "Ventilador" },
    baby: { Icon: Baby, name: "Niños" },
    sofa: { Icon: Sofa, name: "Living" },
    shower: { Icon: ShowerHead, name: "Ducha" },
  };

export function getFeatureIcon(key: string): LucideIcon {
  return FEATURE_ICONS[key]?.Icon ?? Sparkles;
}

export const DEFAULT_FEATURES_TITLE: LocalizedText = {
  es: "LO QUE VAS A ENCONTRAR",
  en: "WHAT YOU'LL FIND",
  pt: "O QUE VOCÊ VAI ENCONTRAR",
};

export const DEFAULT_FEATURES: FeatureItem[] = [
  { icon: "pool", label: { es: "Piscina", en: "Pool", pt: "Piscina" } },
  {
    icon: "beach",
    label: {
      es: "A pasos de la playa",
      en: "Steps away from the beach",
      pt: "A poucos passos da praia",
    },
  },
  {
    icon: "wifi",
    label: {
      es: "WiFi en todo el predio",
      en: "WiFi throughout the property",
      pt: "Wi-Fi em todo o terreno",
    },
  },
  {
    icon: "bbq",
    label: { es: "Parrillero", en: "BBQ grill", pt: "Churrasqueira" },
  },
  {
    icon: "parking",
    label: { es: "Estacionamiento", en: "Parking", pt: "Estacionamento" },
  },
  {
    icon: "pets",
    label: { es: "Pet friendly", en: "Pet friendly", pt: "Aceita animais" },
  },
];

export const DEFAULT_STAY_INFO: StayInfoItem[] = [
  { value: "3 PM", label: { es: "Check-in", en: "Check-in", pt: "Check-in" } },
  {
    value: "10 AM",
    label: { es: "Check-out", en: "Check-out", pt: "Check-out" },
  },
  { value: "50%", label: { es: "Depósito", en: "Deposit", pt: "Sinal" } },
  {
    value: "2",
    label: { es: "Mín. noches", en: "Min. nights", pt: "Mín. de noites" },
  },
];

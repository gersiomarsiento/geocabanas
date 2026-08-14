import { getLogoUrl } from "@/lib/site/hero";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const logoUrl = await getLogoUrl();
  return <HeaderClient logoUrl={logoUrl} />;
}

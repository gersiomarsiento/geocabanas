import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="text-[12px] md:text-[14px] px-6 py-4 bg-primary text-primary-foreground">
      <p className="max-w-360 justify-self-center w-full md:px-6">
        {t("derechos")}
      </p>
    </footer>
  );
}

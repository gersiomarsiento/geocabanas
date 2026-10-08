import HeroSlides from "@/app/components/HeroSlides";
import BookingCalendar from "../components/BookingCalendar";
import ContactSection from "../components/ContactSection";
import FaqSection from "../components/FaqSection";
// import AboutSection from "../components/AboutSection";
import ReviewsSection from "../components/ReviewsSection";

import Footer from "../components/Footer";
import Header from "../components/Header";
import InstagramGallery from "../components/InstagramGallery";
import WhatsAppButton from "../components/WhatsAppButton";
import AvailabilitySearch from "../components/AvailabilitySearch";
// import PropertiesSection from "../components/PropertiesSection";
import FeaturesSection from "../components/FeaturesSection";
import { getCommonAreaImages } from "@/lib/commonAreas";
import { getLocalized } from "@/lib/i18n/getLocalized";
import { getLocale, getTranslations } from "next-intl/server";
import { getContactSettings } from "@/lib/site/settings";
import {
  DEFAULT_FEATURES,
  DEFAULT_STAY_INFO,
  DEFAULT_FEATURES_TITLE,
} from "@/lib/site/features";

export default async function Home() {
  const locale = await getLocale();
  const [t, tBooking, commonAreas, contact] = await Promise.all([
    getTranslations("Hero"),
    getTranslations("Booking"),
    getCommonAreaImages(),
    getContactSettings(),
  ]);

  const featuresTitle = getLocalized(
    contact.featuresTitle ?? DEFAULT_FEATURES_TITLE,
    locale,
  );
  const features = (
    contact.features?.length ? contact.features : DEFAULT_FEATURES
  ).map((f) => ({ icon: f.icon, label: getLocalized(f.label, locale) }));
  const stayInfo = (
    contact.stayInfo?.length ? contact.stayInfo : DEFAULT_STAY_INFO
  ).map((s) => ({ value: s.value, label: getLocalized(s.label, locale) }));

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <Header />

      <main className="flex-1 overflow-x-hidden">
        <section
          aria-label={t("imagenPrincipal")}
          className="relative flex h-svh w-full items-center justify-center bg-primary"
        >
          <HeroSlides />
        </section>
        <FeaturesSection
          commonAreas={commonAreas}
          features={features}
          stayInfo={stayInfo}
          title={featuresTitle}
        />
        <section
          id="reservar-button"
          aria-labelledby="booking-title"
          className="mx-auto bg-light-mesh w-full justify-items-center px-3 md:px-6 py-10"
        >
          <h2 id="booking-title" className="mb-6 text-center">
            {tBooking("hacerTuReserva")}
          </h2>
          <BookingCalendar />
          <AvailabilitySearch />
        </section>

        {/* <AboutSection /> */}
        {/* <PropertiesSection /> */}

        <ReviewsSection />
        <InstagramGallery />
        <FaqSection />
        <ContactSection />
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

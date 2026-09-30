import { getTranslations } from "next-intl/server";
import HeroSlider from "../components/HeroSlider";
import BookingCalendar from "../components/BookingCalendar";
import ContactSection from "../components/ContactSection";
import FaqSection from "../components/FaqSection";
import AboutSection from "../components/AboutSection";
import ReviewsSection from "../components/ReviewsSection";

import Footer from "../components/Footer";
import HeroImage from "../components/HeroImage";
import HeroImageClient from "../components/HeroImageClient";
import Header from "../components/Header";
import InstagramGallery from "../components/InstagramGallery";
import WhatsAppButton from "../components/WhatsAppButton";
import AvailabilitySearch from "../components/AvailabilitySearch";
import PropertiesSection from "../components/PropertiesSection";
import FeaturesSection from "../components/FeaturesSection";

export default async function Home() {
  const t = await getTranslations("Hero");
  const tBooking = await getTranslations("Booking");

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <Header />

      <main className="flex-1 overflow-x-hidden">
        <section
          aria-label={t("imagenPrincipal")}
          className="relative flex h-svh w-full items-center justify-center bg-primary"
        >
          <HeroSlider
            slides={[
              <HeroImage key="1" />,
              <HeroImageClient
                key="2"
                heroUrl={"/images/hero.webp"}
                heroTitle={"Geo"}
                heroSubtitle={"Siempre con vos"}
                heroButtonHref={"/#"}
                heroButtonText={"RESERVAR"}
              />,
            ]}
          />
        </section>
        <FeaturesSection />
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

        <AboutSection />
        <PropertiesSection />

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

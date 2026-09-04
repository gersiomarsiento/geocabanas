import { getTranslations } from "next-intl/server";
import BookingCalendar from "../components/BookingCalendar";
import ContactSection from "../components/ContactSection";
import FaqSection from "../components/FaqSection";
import AboutSection from "../components/AboutSection";
import ReviewsSection from "../components/ReviewsSection";

import Footer from "../components/Footer";
import HeroImage from "../components/HeroImage";
import Header from "../components/Header";
import InstagramGallery from "../components/InstagramGallery";
import WhatsAppButton from "../components/WhatsAppButton";
import AvailabilitySearch from "../components/AvailabilitySearch";
// import FeaturesSection from "../components/FeaturesSection";

export default async function Home() {
  const t = await getTranslations("Hero");
  const tBooking = await getTranslations("Booking");

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <section
        aria-label={t("imagenPrincipal")}
        className="relative flex h-svh w-full items-center justify-center bg-primary"
      >
        <Header />
        <div className="flex h-full w-full flex-col items-center gap-2 text-primary-foreground">
          <HeroImage />
        </div>
      </section>

      <AboutSection />
      <main
        id="reservar-button"
        className="mx-auto w-full justify-items-center bg-secondary-50 flex-1 px-3 md:px-6 py-10"
      >
        <h2 className="mb-6 text-center">{tBooking("hacerTuReserva")}</h2>
        <BookingCalendar />
        <AvailabilitySearch />
      </main>
      <ReviewsSection />
      <InstagramGallery />
      <FaqSection />
      <ContactSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

import BookingCalendar from "./components/BookingCalendar";
import ContactSection from "./components/ContactSection";
import FaqSection from "./components/FaqSection";
import AboutSection from "./components/AboutSection";
import FeaturesSection from "./components/FeaturesSection";
import Footer from "./components/Footer";
import HeroImage from "./components/HeroImage";
import Header from "./components/Header";

export default async function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <section
        aria-label="Imagen principal"
        className="relative flex h-svh w-full items-center justify-center bg-primary"
      >
        <Header />
        <div className="flex h-full w-full flex-col items-center gap-2 text-primary-foreground">
          <HeroImage />
        </div>
      </section>

      <AboutSection />
      {/* <FeaturesSection /> */}

      <main
        id="reservar-button"
        className="mx-auto w-full justify-items-center bg-secondary-50 flex-1 px-3 md:px-6 py-10"
      >
        <h2 className="mb-6 text-center">
          Hacé tu reserva
        </h2>
        <BookingCalendar />
      </main>
      <FaqSection />
      <ContactSection />
      <Footer />
    </div>
  );
}

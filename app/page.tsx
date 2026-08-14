import BookingCalendar from "./components/BookingCalendar";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import HeroImage from "./components/HeroImage";
import AboutSection from "./components/AboutSection";
import Header from "./components/Header";

export default async function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans">
      <Header />

      <section
        aria-label="Imagen principal"
        className="relative flex h-[calc(100svh-60px)] w-full items-center justify-center bg-black"
      >
        <div className="flex h-full w-full flex-col items-center gap-2 text-white">
          <HeroImage />
        </div>
      </section>

      <AboutSection />

      <main
        id="reservar-button"
        className="mx-auto w-full max-w-lg md:max-w-360 flex-1 px-3 md:px-6 py-6"
      >
        <h2 className="mb-6 text-center text-xl font-semibold text-black">
          Hacé tu reserva
        </h2>
        <BookingCalendar />
      </main>
      <ContactSection />
      <Footer />
    </div>
  );
}
